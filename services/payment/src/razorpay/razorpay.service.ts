import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { genereateRecipetID } from 'src/utils/helper';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentEntiry, PaymentStatus } from 'src/entities/payment.entity';
import { Repository } from 'typeorm';
import { StudentFeesEntity } from 'src/entities/studentfees.entity';
import { lastValueFrom, Observable } from 'rxjs';
import * as microservices from '@nestjs/microservices';

interface studentGrpc {
  GetStudent(data: { uuid: string }): Observable<any>;
}

@Injectable()
export class RazorpayService implements OnModuleInit {
  private razorPay: Razorpay;
  private studentService: studentGrpc;

  constructor(
    @InjectRepository(PaymentEntiry)
    private paymentRepo: Repository<PaymentEntiry>,
    @InjectRepository(StudentFeesEntity)
    private feesRepo: Repository<StudentFeesEntity>,
    @Inject('student')
    private clientStudent: microservices.ClientGrpc,
  ) {
    this.razorPay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  onModuleInit() {
    this.studentService = this.clientStudent.getService('StudentService');
  }

  async createPayment(amount: number, studentId: string) {
    const studentfees = await this.feesRepo.findOne({
      where: { studentId },
    });

    if (!studentfees) {
      return 'no student fee data';
    }

    const grpc_res: {
      data: string;
    } = (await lastValueFrom(
      this.studentService.GetStudent({ uuid: studentId }),
    )) as { data: string };

    console.log(grpc_res, 'texing');

    const user: {
      data: { student_name: string; email: string; phone_number: string };
    } = JSON.parse(grpc_res.data) as {
      data: {
        student_name: string;
        email: string;
        phone_number: string;
      };
    };

    const option = {
      amount: amount * 100,
      currency: 'INR',
      receipt: genereateRecipetID(),
    };

    const order = await this.razorPay.orders.create(option);

    const payment = this.paymentRepo.create({
      receiptNumber: option.receipt,
      studentId,
      phoneNumber: user.data.phone_number,
      studentName: user.data.student_name,
      notes: 'pay via razorpay',
      studentFeesId: studentfees.uuid,
      amount,
      paymentDate: new Date(),
      paymentMode: 'ONLINE',
      transactionId: 'razorpay',
      razorOrderId: order.id,
    });

    await this.paymentRepo.save(payment);

    return {
      ...order,
      name: user.data.student_name,
      email: user.data.email,
      phone: user.data.phone_number,
    };
  }

  async verifyPayment(
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
  ) {
    const data = razorpay_order_id + '|' + razorpay_payment_id;

    const expectSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(data.toString())
      .digest('hex');

    if (expectSignature === razorpay_signature) {
      const payment = await this.paymentRepo.findOne({
        where: {
          razorOrderId: razorpay_order_id,
        },
      });

      if (!payment) {
        return {
          success: true,
          data: null,
        };
      }

      const fees = await this.feesRepo.findOne({
        where: { uuid: payment.studentFeesId },
      });

      if (!fees) {
        const newdata = {
          razorPaymentId: razorpay_payment_id,
        };

        Object.assign(payment, newdata);
        const finalpay = await this.paymentRepo.save(payment);
        return {
          success: true,
          data: finalpay,
        };
      }

      const newdata = {
        razorPaymentId: razorpay_payment_id,
        status: PaymentStatus.SUCCEEDED,
        paidAmount: fees.paidAmount + payment.amount,
      };

      Object.assign(payment, newdata);

      const finalpay = await this.paymentRepo.save(payment);

      const newfee = {
        paidAmount: payment.amount,
        lastPaidDate: new Date(),
      };

      Object.assign(fees, newfee);

      await this.feesRepo.save(fees);

      return {
        success: true,
        data: finalpay,
      };
    } else {
      const payment = await this.paymentRepo.findOne({
        where: {
          razorOrderId: razorpay_order_id,
        },
      });

      if (!payment) {
        return {
          success: true,
          data: null,
        };
      }

      const newdata = {
        status: PaymentStatus.FAILED,
      };

      Object.assign(payment, newdata);

      await this.paymentRepo.save(payment);
      return {
        success: expectSignature === razorpay_signature,
        data: null,
      };
    }
  }
}
