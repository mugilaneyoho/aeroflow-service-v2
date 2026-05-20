import { Controller, Get, Param, Res, Response } from '@nestjs/common';
import { AppService } from './app.service';
import { GrpcMethod } from '@nestjs/microservices';
import { CreateGRPCdto, CreatePaymentDto } from './dto/createpayment.dto';
import { PdfService } from './template/pdf.service';
import fs from 'fs';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @GrpcMethod('PaymentService', 'GetAllPayment')
  findall() {
    return this.appService.findall();
  }

  @GrpcMethod('PaymentService', 'CreatePayment')
  create(data: CreateGRPCdto) {
    const body = {
      amount: data.admissionFees,
      paymentDate: data.paymentDate,
      paymentMode: data.paymentMode,
      transactionId: data.transactionId,
      collectedBy: data.telecallerId,
      studentId: data.studentId,
      studentName: data.studentName,
      notes: data.remarks,
      phoneNumber: data.phoneNumber,
    };
    return this.appService.createAdmission(body);
  }

  @GrpcMethod('FeeManagement', 'GetFeeSummary')
  async getFeeSummary(data: { student_id: string }) {
    return this.appService.getFeeSummary(data);
  }

  @GrpcMethod('FeeManagement', 'GetPaymentHistory')
  async getPaymentHistory(data: { student_id: string }) {
    return this.appService.getPaymentHistory(data);
  }

  @GrpcMethod('FeeManagement', 'InitStudentFees')
  initStudentFees(data: { studentId: string; totalFees: number }) {
    return this.appService.InitStudentFees(data);
  }

  @GrpcMethod('FeeManagement', 'GetStudentFees')
  getStudentFees(data: { studentId: string }) {
    return this.appService.getStudentFees(data);
  }

  @Get('downloadByuser/:uuid')
  async downloadByuser(@Res() res: any, @Param('uuid') uuid: string) {
    const student: { admissionFeesId: string } | null =
      await this.appService.findAdmissionFees(uuid);

    if (!student) {
      return null;
    }
    const pdfBuffer = await this.appService.DownloadPaymentSlip(
      student?.admissionFeesId,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=invoice.pdf',

      // 'Content-Length': pdfBuffer.length,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    res.end(pdfBuffer);
  }

  @Get('download/:uuid')
  async downloadPdf(@Res() res: any, @Param('uuid') uuid: string) {
    const pdfBuffer = await this.appService.DownloadPaymentSlip(uuid);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=invoice.pdf',

      // 'Content-Length': pdfBuffer.length,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    res.end(pdfBuffer);
  }
}
