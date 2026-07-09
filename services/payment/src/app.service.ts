import * as Sentry from '@sentry/nestjs';
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

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
      relations: ['studentFees'],
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

    const mappedData = data.map((pay) => ({
      uuid: pay.uuid,
      amount: pay.amount,
      payment_date: pay.paymentDate ? pay.paymentDate.toISOString() : '',
      receipt_number: pay.receiptNumber,
      transaction_id: pay.transactionId,
      collected_by: pay.collectedBy,
      student_id: pay.studentId,
      student_name: pay.studentName,
      notes: pay.notes,
      status: pay.status,
      payment_perpose: pay.paymentPerpose,
      phoneNumber: pay.phoneNumber,
      total_fees: pay.studentFees ? Number(pay.studentFees.totalFees || 0) : 0,
      paid_amount: pay.studentFees
        ? Number(pay.studentFees.paidAmount || 0)
        : 0,
      pending_amount: pay.studentFees
        ? Number(pay.studentFees.totalFees || 0) -
          Number(pay.studentFees.paidAmount || 0)
        : 0,
    }));

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCollectionResult = await this.paymentRepo
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'sum')
      .where('payment.paymentDate >= :todayStart', { todayStart })
      .andWhere('payment.status = :status', { status: PaymentStatus.SUCCEEDED })
      .getRawOne();

    const feesStatsResult = await this.feesRepo
      .createQueryBuilder('fees')
      .select('SUM(fees.totalFees)', 'totalFees')
      .addSelect('SUM(fees.paidAmount)', 'paidAmount')
      .getRawOne();

    const overdueCount = await this.feesRepo
      .createQueryBuilder('fees')
      .where('fees.totalFees > fees.paidAmount')
      .getCount();

    const totalCollected = Number(feesStatsResult?.paidAmount || 0);
    const totalFees = Number(feesStatsResult?.totalFees || 0);
    const totalPending = totalFees - totalCollected;

    const stats = {
      todayCollection: Number(todayCollectionResult?.sum || 0),
      totalCollected,
      totalPending,
      overdueStudents: overdueCount,
    };

    return {
      success: true,
      message: 'payment data fetched',
      data: mappedData,
      paystatus,
      stats,
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
        totalFees: Number(data.totalFees),
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

  async createManualPayment(data: {
    studentId: string;
    studentName: string;
    amount: number;
    paymentDate: Date | string;
    paymentMode: string;
    transactionId: string;
    paymentPerpose: PaymentPerpose;
    notes?: string;
    phoneNumber?: string;
    collectedBy?: string;
  }) {
    const nowDate = new Date();
    const receiptNumber = genereateRecipetID();

    let student_fee = await this.feesRepo.findOne({
      where: { studentId: data.studentId },
    });

    if (!student_fee) {
      // Fetch student details from StudentService via gRPC to get course fees
      let totalFees = 0;
      try {
        const grpc_res: { data: string } = (await lastValueFrom(
          this.studentService.GetStudent({ uuid: data.studentId }),
        )) as { data: string };
        const studentDetails = JSON.parse(grpc_res.data);
        totalFees = Number(studentDetails.data?.course?.price || 0);
      } catch (error) {
      Sentry.captureException(error);
        console.error('Failed to fetch student details via gRPC:', error);
      }

      student_fee = this.feesRepo.create({
        studentId: data.studentId,
        admissionFeesPay: data.paymentPerpose === PaymentPerpose.ADMISSIONFEE,
        admissionFeesAmount:
          data.paymentPerpose === PaymentPerpose.ADMISSIONFEE ? data.amount : 0,
        totalFees: totalFees,
        paidAmount: data.amount,
        lastPaidDate: data.paymentDate ? new Date(data.paymentDate) : nowDate,
      });
      student_fee = await this.feesRepo.save(student_fee);
    } else {
      // update existing student fee record
      const isAdmission = data.paymentPerpose === PaymentPerpose.ADMISSIONFEE;
      const updatedPaidAmount =
        Number(student_fee.paidAmount || 0) + Number(data.amount);

      const updateData: Partial<StudentFeesEntity> = {
        paidAmount: updatedPaidAmount,
        lastPaidDate: data.paymentDate ? new Date(data.paymentDate) : nowDate,
      };

      if (isAdmission) {
        updateData.admissionFeesPay = true;
        updateData.admissionFeesAmount = Number(data.amount);
      }

      await this.feesRepo.update({ uuid: student_fee.uuid }, updateData);

      // reload student fee to make sure we have the updated record for the payment relation
      student_fee =
        (await this.feesRepo.findOne({
          where: { uuid: student_fee.uuid },
        })) || student_fee;
    }

    const pay = this.paymentRepo.create({
      studentFeesId: student_fee.uuid,
      studentId: data.studentId,
      studentName: data.studentName,
      amount: Number(data.amount),
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : nowDate,
      paymentMode: data.paymentMode || 'CASH',
      transactionId: data.transactionId || receiptNumber,
      receiptNumber: receiptNumber,
      notes: data.notes || 'Manual payment entry',
      phoneNumber: data.phoneNumber || '',
      collectedBy: data.collectedBy || 'Admin',
      status: PaymentStatus.SUCCEEDED,
      paymentPerpose: data.paymentPerpose || PaymentPerpose.COURSEFEE,
    });

    const savedPayment = await this.paymentRepo.save(pay);

    if (data.paymentPerpose === PaymentPerpose.ADMISSIONFEE) {
      await this.feesRepo.update(
        { uuid: student_fee.uuid },
        { admissionFeesId: savedPayment.uuid },
      );
    }

    return {
      success: true,
      message: 'Payment recorded successfully',
      data: savedPayment,
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
      uuid: pay.uuid,
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
      Sentry.captureException(error);
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
      uuid: pay.uuid,
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

      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        studentDetails: studentDetails?.data,
        paymentDetails,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.log(error);
      return new InternalServerErrorException();
    }
  }

  async findAdmissionFees(studentId: string) {
    try {
      const student = await this.feesRepo.findOne({ where: { studentId } });

      return student;
    } catch (error) {
      Sentry.captureException(error);
      console.log(error);
      return null;
    }
  }
}
