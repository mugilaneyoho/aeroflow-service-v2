import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  PaymentEntiry,
  PaymentPerpose,
  PaymentStatus,
} from './entities/payment.entity';
import { Repository } from 'typeorm';
import { CreatePaymentDto } from './dto/createpayment.dto';
import { StudentFeesEntity } from './entities/studentfees.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(PaymentEntiry)
    private paymentRepo: Repository<PaymentEntiry>,
    @InjectRepository(StudentFeesEntity)
    private feesRepo: Repository<StudentFeesEntity>,
  ) {}

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

    const receiptNumber =
      'PAY' +
      nowDate.getMilliseconds() +
      nowDate.getSeconds() +
      nowDate.getHours() +
      'TSD' +
      nowDate.getFullYear() +
      nowDate.getMonth() +
      nowDate.getDate();

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
}
