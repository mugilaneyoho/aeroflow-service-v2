/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  PaymentEntiry,
  PaymentPerpose,
  PaymentStatus,
} from './entities/payment.entity';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './dto/createpayment.dto';
import { StudentFeesEntity } from './entities/studentfees.entity';
import { lastValueFrom, Observable } from 'rxjs';
import * as microservices from '@nestjs/microservices';
import { PdfService } from './template/pdf.service';
import fs from 'fs';
import { genereateRecipetID } from './utils/helper';

interface studentGrpc {
  GetStudent(data: { uuid: string }): Observable<any>;
}

@Injectable()
export class AppService implements OnModuleInit {
  private studentService: studentGrpc;

  constructor(
    @InjectRepository(PaymentEntiry)
    private paymentRepo: Repository<PaymentEntiry>,
    @InjectRepository(StudentFeesEntity)
    private feesRepo: Repository<StudentFeesEntity>,
    @Inject('student')
    private clientStudent: microservices.ClientGrpc,
    private readonly pdfService: PdfService,
  ) {}

  onModuleInit() {
    this.studentService = this.clientStudent.getService('StudentService');
  }

  getHello(): string {
    return 'Hello World!';
  }

  async findall() {
    const [data, total] = await this.paymentRepo.findAndCount({
      where: { paymentPerpose: PaymentPerpose.ADMISSIONFEE },
    });

    const paystatus = await this.paymentRepo
      .createQueryBuilder('payment')
      .select('payment.status', 'status')
      .addSelect('COUNT(payment.id)', 'count')
      .where('payment.paymentPerpose = :perpose', {
        perpose: PaymentPerpose.ADMISSIONFEE,
      })
      .groupBy('payment.status')
      .getRawMany();

    return {
      success: true,
      message: 'payment data fetched',
      data,
      paystatus,
      meta: {
        total,
      },
    };
  }

  async createAdmission(data: CreatePaymentDto) {
    let fees!: PaymentEntiry;
    const student_fee = await this.feesRepo.findOne({
      where: { studentId: data.studentId },
    });

    const nowDate = new Date();

    const receiptNumber = genereateRecipetID();

    if (student_fee) {
      const pay = this.paymentRepo.create({
        ...data,
        studentFeesId: student_fee.uuid,
        receiptNumber,
        status: PaymentStatus.SUCCEEDED,
        paymentPerpose: PaymentPerpose.OTHERFEE,
      });

      fees = await this.paymentRepo.save(pay);

      await this.feesRepo.update(
        { uuid: student_fee.uuid },
        { lastPaidDate: nowDate },
      );
    } else {
      const studentfee = this.feesRepo.create({
        studentId: data.studentId,
        admissionFeesPay: true,
        admissionFeesAmount: data.amount,
        lastPaidDate: nowDate,
      });

      const feeList = await this.feesRepo.save(studentfee);

      const pay = this.paymentRepo.create({
        ...data,
        studentFeesId: feeList.uuid,
        receiptNumber,
        status: PaymentStatus.SUCCEEDED,
        paymentPerpose: PaymentPerpose.ADMISSIONFEE,
      });

      fees = await this.paymentRepo.save(pay);

      await this.feesRepo.update(
        { uuid: feeList.uuid },
        { admissionFeesId: fees.uuid },
      );
    }

    return {
      data: fees,
    };
  }

  async getFeeSummary(data: { student_id: string }) {
    const studentFee = await this.feesRepo.findOne({
      where: { studentId: data.student_id },
    });

    if (!studentFee) {
      return { total_fees: 0, paid_fees: 0, pending_amount: 0 };
    }

    const total = Number(studentFee.totalFees || 0);
    const paid = Number(studentFee.paidAmount || 0);
    const admissionFees = Number(studentFee.admissionFeesAmount || 0);
    const pending = total - paid;

    return {
      total_fees: total,
      paid_fees: paid,
      admissionFeesAmount: admissionFees,
      pending_amount: pending,
    };
  }

  async getPaymentHistory(data: { student_id: string }) {
    const studentFee = await this.feesRepo.findOne({
      where: { studentId: data.student_id },
    });

    if (!studentFee) {
      return { records: [] };
    }

    const payments = await this.paymentRepo.find({
      where: { studentFeesId: studentFee.uuid },
      order: { id: 'DESC' },
    });

    const records = payments.map((pay) => ({
      transaction_id: pay.receiptNumber,
      date: pay.createdAt
        ? pay.createdAt.toISOString()
        : new Date().toISOString(),
      amount: Number(pay.amount),
      purpose: pay.paymentPerpose,
    }));

    return { records };
  }

  async InitStudentFees(data: { studentId?: string; totalFees?: number }) {
    try {
      const studentId = data.studentId;
      const totalFees = data.totalFees || 0;

      if (!studentId) return { success: false };

      const existing = await this.feesRepo.findOne({ where: { studentId } });

      if (existing) {
        if (!existing.totalFees || existing.totalFees === 0) {
          await this.feesRepo.update({ studentId }, { totalFees });
        }
        return {
          success: true,
        };
      }

      await this.feesRepo.save({
        studentId,
        admissionFeesPay: false,
        admissionFeesAmount: 0,
        totalFees,
        paidAmount: 0,
        lastPaidDate: new Date(),
      });

      return { success: true };
    } catch (error) {
      console.error('InitStudentFees error:', error);
      return { success: false };
    }
  }

  async getStudentFees(data: { studentId?: string }) {
    const studentFee = await this.feesRepo.findOne({
      where: { studentId: data.studentId },
    });

    if (!studentFee) {
      return {
        data: JSON.stringify({
          total_fees: 0,
          admission_fees: 0,
          paid_amount: 0,
          pending_amount: 0,
          last_paid_date: null,
          records: [],
        }),
      };
    }

    const total = Number(studentFee.totalFees || 0);
    const paid = Number(studentFee.paidAmount || 0);
    const admission_fees = Number(studentFee.admissionFeesAmount || 0);

    const payments = await this.paymentRepo.find({
      where: { studentFeesId: studentFee.uuid },
      order: { id: 'DESC' },
    });

    const records = payments.map((pay) => ({
      transaction_id: pay.receiptNumber,
      date: pay.createdAt
        ? pay.createdAt.toISOString()
        : new Date().toISOString(),
      amount: Number(pay.amount),
      paymentpurpose: pay.paymentPerpose,
    }));

    return {
      data: JSON.stringify({
        total_fees: total,
        admission_fees,
        paid_amount: paid,
        pending_amount: total - paid,
        last_paid_date: studentFee.lastPaidDate
          ? studentFee.lastPaidDate.toISOString()
          : null,
        records,
      }),
    };
  }

  async DownloadPaymentSlip(slipId: string) {
    try {
      const paymentDetails = await this.paymentRepo.findOne({
        where: {
          uuid: slipId,
        },
        relations: ['studentFees'],
      });

      if (!paymentDetails) {
        return new NotFoundException();
      }

      const grpc_res: {
        data: string;
      } = (await lastValueFrom(
        this.studentService.GetStudent({ uuid: paymentDetails.studentId }),
      )) as { data: string };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const studentDetails = JSON.parse(grpc_res.data as unknown as string);

      console.log(studentDetails);
      let html = fs.readFileSync('src/template/admission.html', 'utf-8');

      html = html.replace('{{studentName}}', studentDetails.data.student_name);
      html = html.replace('{{studentMail}}', studentDetails.data.email);
      html = html.replace('{{studentPhone}}', studentDetails.data.phone_number);

      html = html.replace(
        '{{courseName}}',
        studentDetails.data.course?.course_name || '',
      );

      html = html.replace(
        '{{courseFees}}',
        String(studentDetails.data.course?.price || ''),
      );

      html = html.replace('{{paidFees}}', String(paymentDetails.amount));
      html = html.replace('{{gstAmount}}', '0');
      html = html.replace('{{totalPaid}}', String(paymentDetails?.amount));

      const pdfBuffer = await this.pdfService.generatePdf(html);
      return pdfBuffer;
    } catch (error) {
      console.log(error);
      return new InternalServerErrorException();
    }
  }

  async findAdmissionFees(studentId:string) {
    try {
      const student = await this.feesRepo.findOne({where:{studentId}})

      return student
    } catch (error) {
      console.log(error);
      return new InternalServerErrorException();
    }
  }
}
