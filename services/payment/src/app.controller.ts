/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Param,
  Res,
  Post,
  Body,
  Headers,
} from '@nestjs/common';
import { AppService } from './app.service';
import { GrpcMethod } from '@nestjs/microservices';
import { CreateGRPCdto, CreatePaymentDto } from './dto/createpayment.dto';
import { PdfService } from './template/pdf.service';
import { IncoiveService } from './template/export.service';

export const smpdata: any = {
  invoiceId: 'INVPIIVE02-6680',
  invoiceDate: '2026-06-22',

  studentName: 'Arun Kumar S',
  registrationNo: 'CPAGS-2026-0042',
  mobileNo: '+91 98765 43210',
  emailId: 'arun.kumar@example.com',
  qualifications: 'B.Sc Aviation',
  dateOfBirth: '2002-08-15',
  gender: 'Male',
  fatherName: 'Suresh Kumar',
  motherName: 'Meena Devi',
  parentMobile: '+91 99887 76655',
  currentAddress: '12, Gandhi Nagar, Anna Salai, Chennai – 600 002',
  permanentAddress: '45, Lakshmi Street, Madurai – 625 001',
  courseSelected: 'Certified Professional in Airport Ground Services (CPAGS)',
  modeOfTraining: 'Online',
  modeOfPayment: 'UPI Payment',

  totalCourseFees: 95000,
  registrationFees: 5000,
  trainingFees: 90000,
  totalFeesPaid: 5000,
  pendingFees: 90000,
  remarks:
    'Registration fee collected. Balance training fee due before batch commencement.',

  items: [
    { slNo: 1, description: 'Registration Fee', amount: 5000 },
    {
      slNo: 2,
      description:
        'Certified Professional in Airport Ground Services – Training Fee',
      amount: 90000,
    },
  ],

  note: 'The Registration ID will be issued upon full payment of the Registration Fee. The Registration fee is Non-refundable.',
  totalAmount: 95000,

  terms: [
    'Payment of this invoice constitutes acceptance of the terms and conditions outlined in the Placement Guarantee Agreement.',
    'The invoice amount, once paid, is final and non-refundable subjected to the placement guarantee agreement.',
  ],

  phone: '+91 7200 842333',
  email: 'info@patroninternational.org',
  address:
    'No.29/1, 2nd floor, Ambal Nagar, Main Road, Keelkattalai, Chennai 600117',
};

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly pdfService: PdfService,
    private readonly invoceService: IncoiveService,
  ) {}

  @Post('manual-payment')
  async createManualPayment(
    @Body() data: any,
    @Headers('user') userHeader?: string,
  ) {
    let collectedBy = 'Admin';
    if (userHeader) {
      try {
        const user = JSON.parse(userHeader);
        collectedBy = user.student_name || user.email || 'Admin'; // wait, in backend, what is the user's name field? Let's check: telecalling or reception panels usually set email/name. So user.student_name or user.name or user.email
      } catch (e) {
        console.error('Failed to parse user header', e);
      }
    }
    return this.appService.createManualPayment({
      ...data,
      collectedBy,
    });
  }

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
    const details: any = await this.appService.DownloadPaymentSlip(
      student?.admissionFeesId,
    );

    console.log(details);

    const pdfdatas = {
      invoiceId: details?.paymentDetails?.receiptNumber,
      invoiceDate: details?.paymentDetails?.paymentDate
        ?.toISOString()
        ?.split('T')[0],

      studentName: details?.studentDetails?.student_name,
      registrationNo: details?.studentDetails?.student_id,
      mobileNo: details?.studentDetails?.phone_number,
      emailId: details?.studentDetails?.email,
      qualifications: details?.studentDetails?.qualification,
      dateOfBirth: details?.studentDetails?.dob?.split('T')[0],
      gender: details?.studentDetails?.gender,
      fatherName: details?.studentDetails?.father_name,
      motherName: details?.studentDetails?.mother_name,
      parentMobile: details?.studentDetails?.parent_number,
      currentAddress: details?.studentDetails?.currentAddress,
      permanentAddress: details?.studentDetails?.permantAddress,
      courseSelected: details?.studentDetails?.course?.course_name,
      modeOfTraining: details?.studentDetails?.batch?.mode,
      modeOfPayment: details?.paymentDetails?.paymentMode,

      totalCourseFees: 95000,
      registrationFees: 5000,
      trainingFees: 90000,
      totalFeesPaid: 5000,
      pendingFees: 90000,
      remarks:
        'Registration fee collected. Balance training fee due before batch commencement.',

      items: [
        { slNo: 1, description: 'Registration Fee', amount: 5000 },
        {
          slNo: 2,
          description:
            'Certified Professional in Airport Ground Services – Training Fee',
          amount: 90000,
        },
      ],

      note: 'The Registration ID will be issued upon full payment of the Registration Fee. The Registration fee is Non-refundable.',
      totalAmount: 95000,

      terms: [
        'Payment of this invoice constitutes acceptance of the terms and conditions outlined in the Placement Guarantee Agreement.',
        'The invoice amount, once paid, is final and non-refundable subjected to the placement guarantee agreement.',
      ],

      phone: '+91 7200 842333',
      email: 'info@patroninternational.org',
      address:
        'No.29/1, 2nd floor, Ambal Nagar, Main Road, Keelkattalai, Chennai 600117',
    };

    const pdfBuffer = await this.invoceService.generateInvoice(pdfdatas);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=invoice.pdf',

      // 'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Get('download/:uuid')
  async downloadPdf(@Res() res: any, @Param('uuid') uuid: string) {
    const details: any = await this.appService.DownloadPaymentSlip(uuid);

    const pdfdatas = {
      invoiceId: details?.paymentDetails?.receiptNumber,
      invoiceDate: details?.paymentDetails?.paymentDate
        ?.toISOString()
        ?.split('T')[0],

      studentName: details?.studentDetails?.student_name,
      registrationNo: details?.studentDetails?.student_id,
      mobileNo: details?.studentDetails?.phone_number,
      emailId: details?.studentDetails?.email,
      qualifications: details?.studentDetails?.qualification,
      dateOfBirth: details?.studentDetails?.dob?.split('T')[0],
      gender: details?.studentDetails?.gender,
      fatherName: details?.studentDetails?.father_name,
      motherName: details?.studentDetails?.mother_name,
      parentMobile: details?.studentDetails?.parent_number,
      currentAddress: details?.studentDetails?.currentAddress,
      permanentAddress: details?.studentDetails?.permantAddress,
      courseSelected: details?.studentDetails?.course?.course_name,
      modeOfTraining: details?.studentDetails?.batch?.mode,
      modeOfPayment: details?.paymentDetails?.paymentMode,

      totalCourseFees: 95000,
      registrationFees: 5000,
      trainingFees: 90000,
      totalFeesPaid: 5000,
      pendingFees: 90000,
      remarks:
        'Registration fee collected. Balance training fee due before batch commencement.',

      items: [
        { slNo: 1, description: 'Registration Fee', amount: 5000 },
        {
          slNo: 2,
          description:
            'Certified Professional in Airport Ground Services – Training Fee',
          amount: 90000,
        },
      ],

      note: 'The Registration ID will be issued upon full payment of the Registration Fee. The Registration fee is Non-refundable.',
      totalAmount: 95000,

      terms: [
        'Payment of this invoice constitutes acceptance of the terms and conditions outlined in the Placement Guarantee Agreement.',
        'The invoice amount, once paid, is final and non-refundable subjected to the placement guarantee agreement.',
      ],

      phone: '+91 7200 842333',
      email: 'info@patroninternational.org',
      address:
        'No.29/1, 2nd floor, Ambal Nagar, Main Road, Keelkattalai, Chennai 600117',
    };

    const pdfBuffer = await this.invoceService.generateInvoice(pdfdatas);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=invoice.pdf',

      // 'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
