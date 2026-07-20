import * as Sentry from '@sentry/nestjs';
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import * as microservices from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom, Observable } from 'rxjs';
import { StudentProfileEntity } from 'src/entities/student.entity';
import { Repository } from 'typeorm';
import { CreateStudentDto } from './dto/create-student.dto';
import { CourseEntity } from 'src/entities/course.entity';
import { BatchEntity } from 'src/entities/batch.entity';
import fs from 'fs';
import { PdfService } from 'src/template/pdfService';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import axios from 'axios';
import * as path from 'path';
import { Response } from 'express';
import { RedisUserCache } from 'src/redis/redis.service';
import dayjs from 'dayjs';

interface studentgrpc {
  CreateStudent(data: {
    email: string;
    password: string;
    profileId: string;
  }): Observable<any>;
}

interface paymentgrpc {
  initStudentFees(data: {
    studentId: string;
    totalFees: number;
  }): Observable<any>;
  getStudentFees(data: { studentId: string }): Observable<any>;
  GetAllPayment(data: any): Observable<any>;
}

@Injectable()
export class StudentService implements OnModuleInit {
  private AuthService: studentgrpc;
  private FeeService: paymentgrpc;
  private PaymentService: paymentgrpc;
  PW = 595.28;
  PH = 841.89;

  constructor(
    @InjectRepository(StudentProfileEntity)
    private studentRepo: Repository<StudentProfileEntity>,
    @InjectRepository(CourseEntity)
    private courseRepo: Repository<CourseEntity>,
    @InjectRepository(BatchEntity)
    private batchRepo: Repository<BatchEntity>,

    @Inject('student')
    private client: microservices.ClientGrpc,
    // @Inject('payment')
    // private paymentClient: microservices.ClientGrpc,
    private pdfService: PdfService,
    @Inject('payment_fee')
    private paymentFeeClient: microservices.ClientGrpc,
    @Inject('payment_record')
    private paymentRecordClient: microservices.ClientGrpc,
    @Inject('whatsapp')
    private readonly whatsApp: microservices.ClientProxy,
    private readonly redisCache: RedisUserCache,
  ) {}

  async onModuleInit() {
    this.AuthService = this.client.getService('StudentService');
    this.FeeService = this.paymentFeeClient.getService('FeeManagement');
    this.PaymentService = this.paymentRecordClient.getService('PaymentService');
    await this.whatsApp.connect();
  }

  async create(data: CreateStudentDto) {
    try {
      const nowDate = new Date();
      const leadId = Array.isArray(data?.lead) ? data.lead[0] : data?.lead;
      const exist = await this.studentRepo.findOne({
        where: { phone_number: data.phone_number },
      });

      if (exist) {
        throw new ConflictException({
          success: false,
          message: 'user already exist this email.',
        });
      }

      const student_id =
        'PI' +
        nowDate.getMonth() +
        nowDate.getFullYear() +
        'STD' +
        nowDate.getMilliseconds() +
        nowDate.getMinutes();

      const user = this.studentRepo.create({ ...data, student_id });

      const student = await this.studentRepo.save(user);

      const grpc_res: { success: boolean; message: string } =
        await lastValueFrom(
          this.AuthService.CreateStudent({
            email: student.email,
            password: 'patron',
            profileId: student.uuid,
          }),
        );

      if (!grpc_res.success) {
        console.error('grpc student profile error.');
        return new InternalServerErrorException({
          success: false,
          message: 'internal server error.',
        });
      }

      const final = await this.studentRepo.findOne({
        where: { uuid: student?.uuid },
        relations: ['course'],
      });

      return {
        success: true,
        message: 'profile created successfully',
        data: final,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'create student error!');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async findAll(query: {
    page: string;
    limit: string;
    approved?: string;
    isbatch?: string;
  }) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const whereClause: any = { is_delete: false };

      if (query.approved !== undefined) {
        whereClause.is_approved = query.approved === 'true';
      }

      if (query.isbatch !== undefined) {
        whereClause.is_approved = true;
        whereClause.is_batch_assign = query.isbatch === 'true';
      }

      const [students, total] = await this.studentRepo.findAndCount({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
        relations: ['batch'],
      });

      return {
        success: true,
        message: 'staff fetched',
        data: students,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'getall student error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async findOne(uuid: string) {
    try {
      const cache = await this.redisCache.getUser(uuid);

      if (cache) {
        return {
          success: true,
          message: 'student fetched',
          data: cache,
        };
      }

      const student = await this.studentRepo.findOne({
        where: { uuid },
        relations: ['course', 'batch'],
      });

      if (!student) {
        throw new NotFoundException();
      }

      await this.redisCache.setUser(student.uuid, student);

      return {
        success: true,
        message: 'student fetched',
        data: student,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'find student error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async deleteOne(uuid: string) {
    try {
      await this.studentRepo.update({ uuid }, { is_delete: true });
      await this.redisCache.deleteUser(uuid);
      return {
        success: true,
        message: 'student deleted successfully.',
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'delete staff error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async approveStudent(uuid: string) {
    try {
      const student = await this.studentRepo.findOne({
        where: { uuid },
        relations: ['course'],
      });

      if (!student) {
        throw new NotFoundException({
          success: false,
          message: 'Student not found.',
        });
      }

      if (student.is_approved) {
        return {
          success: false,
          message: 'Student is already approved.',
        };
      }

      await this.studentRepo.update({ uuid }, { is_approved: true });

      this.whatsApp.emit('whatsapp-student-welcome', {
        student_name: student.student_name,
        course_name: student.course.course_name,
        student_id: student.student_id,
        to: student.phone_number,
      });

      return {
        success: true,
        message: 'Student approved successfully.',
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'approveStudent error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async dashboard(req: { headers: { user: string } }) {
    try {
      const user: { profile_id: string } = JSON.parse(req.headers.user);

      const student = await this.studentRepo.findOne({
        where: {
          uuid: user.profile_id,
        },
        relations: ['course', 'batch'],
      });

      if (!student) {
        return new NotFoundException('student not founded');
      }

      return {
        success: true,
        data: student,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.log(error, 'student dashboard');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async getStudentFees(studentId: string) {
    try {
      const result: { data: string } = await lastValueFrom(
        this.FeeService.getStudentFees({ studentId }),
      );
      const data = JSON.parse(result.data);
      return { success: true, message: 'fees details response', data };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'getStudentFees error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async getApplication(uuid: string): Promise<Buffer> {
    try {
      const studentDetails = await this.studentRepo.findOne({
        where: { uuid },
        relations: ['course', 'batch'],
      });

      if (!studentDetails) {
        throw new NotFoundException('Student profile not found');
      }

      let profileImgBuffer: Buffer | null = null;
      if (studentDetails?.profile_image) {
        if (studentDetails?.profile_image.startsWith('data:')) {
          const base64Data = studentDetails?.profile_image
            .split(';base64,')
            .pop();
          if (base64Data) {
            profileImgBuffer = Buffer.from(base64Data, 'base64');
          }
        } else if (studentDetails?.profile_image?.startsWith('http')) {
          try {
            const response = await axios.get(studentDetails?.profile_image, {
              responseType: 'arraybuffer',
            });
            profileImgBuffer = Buffer.from(response.data);
          } catch (e) {
            console.error('Failed to fetch student profile image:', e);
          }
        }
      }

      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));

        const bgPath = path.join(
          process.cwd(),
          'src/template/plainletterhead.jpeg',
        );

        if (fs.existsSync(bgPath)) {
          doc.image(bgPath, 0, 0, { width: this.PW, height: this.PH });
        } else {
          console.warn(
            'Background image plainletterhead.jpeg not found in templates folder!',
          );
        }

        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('STUDENT TRAINING APPLICATION FORM', 40, 130, {
            align: 'center',
          });

        const startY = 165;

        // Left Column details (Application details)
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Application No:', 40, startY);
        doc
          .font('Helvetica')
          .text(studentDetails.student_id || 'N/A', 150, startY);

        doc.font('Helvetica-Bold').text('Date:', 40, startY + 20);
        doc
          .font('Helvetica')
          .text(
            studentDetails.admission_date
              ? new Date(studentDetails.admission_date).toLocaleDateString()
              : 'N/A',
            150,
            startY + 20,
          );

        doc.font('Helvetica-Bold').text('Course Name:', 40, startY + 40);
        doc
          .font('Helvetica')
          .text(studentDetails.course?.course_name || 'N/A', 150, startY + 40);

        doc.font('Helvetica-Bold').text('Batch Name:', 40, startY + 60);
        doc
          .font('Helvetica')
          .text(
            studentDetails.batch?.batchName || 'Not Assigned',
            150,
            startY + 60,
          );

        doc.font('Helvetica-Bold').text('Batch Code:', 40, startY + 80);
        doc
          .font('Helvetica')
          .text(studentDetails.batch?.batchCode || 'N/A', 150, startY + 80);

        doc.font('Helvetica-Bold').text('Batch Timing:', 40, startY + 100);
        doc
          .font('Helvetica')
          .text(
            studentDetails.batch
              ? `${dayjs(studentDetails.batch.startDate).format('DD/MM/YYYY') || ''} - ${studentDetails.batch.duration + ' ' + studentDetails.batch.durationType || ''}`
              : 'N/A',
            150,
            startY + 100,
          );

        // Right Column - Profile Image Box
        const imgX = 450;
        const imgY = startY;
        const imgW = 100;
        const imgH = 110;

        if (profileImgBuffer) {
          try {
            doc.image(profileImgBuffer, imgX, imgY, {
              width: imgW,
              height: imgH,
            });
            doc
              .rect(imgX, imgY, imgW, imgH)
              .strokeColor('#000000')
              .lineWidth(1)
              .stroke();
          } catch (e) {
            doc
              .rect(imgX, imgY, imgW, imgH)
              .strokeColor('#000000')
              .lineWidth(1)
              .stroke();
            doc.fontSize(8).text('PHOTO', imgX + 30, imgY + 50);
          }
        } else {
          doc
            .rect(imgX, imgY, imgW, imgH)
            .strokeColor('#000000')
            .lineWidth(1)
            .stroke();
          doc
            .fontSize(8)
            .font('Helvetica')
            .text('PASTE PHOTO HERE', imgX + 8, imgY + 50);
        }

        // Section: Personal Details
        const sectionY = 295;
        doc
          .strokeColor('#000000')
          .lineWidth(1)
          .moveTo(20, sectionY - 10)
          .lineTo(575, sectionY - 10)
          .stroke();

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#1F338C')
          .text('PERSONAL DETAILS', 40, sectionY);

        const personalStartY = sectionY + 20;
        const col1X = 40;
        const col2X = 300;

        // Col 1
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Student Name:', col1X, personalStartY);
        doc
          .font('Helvetica')
          .text(
            studentDetails.student_name || 'N/A',
            col1X + 90,
            personalStartY,
          );

        doc
          .font('Helvetica-Bold')
          .text('Date of Birth:', col1X, personalStartY + 20);
        doc
          .font('Helvetica')
          .text(
            studentDetails.dob
              ?  new Date(studentDetails.dob).toLocaleDateString()
              : 'N/A',
            col1X + 90,
            personalStartY + 20,
          );

        doc.font('Helvetica-Bold').text('Gender:', col1X, personalStartY + 40);
        doc
          .font('Helvetica')
          .text(
            studentDetails.gender || 'N/A',
            col1X + 90,
            personalStartY + 40,
          );

        doc
          .font('Helvetica-Bold')
          .text('Mobile No:', col1X, personalStartY + 60);
        doc
          .font('Helvetica')
          .text(
            studentDetails.phone_number || 'N/A',
            col1X + 90,
            personalStartY + 60,
          );

        doc
          .font('Helvetica-Bold')
          .text('Email ID:', col1X, personalStartY + 80);
        doc
          .font('Helvetica')
          .text(studentDetails.email || 'N/A', col1X + 90, personalStartY + 80);

        // Col 2
        doc.font('Helvetica-Bold').text('Father Name:', col2X, personalStartY);
        doc
          .font('Helvetica')
          .text(
            studentDetails.father_name || 'N/A',
            col2X + 90,
            personalStartY,
          );

        doc
          .font('Helvetica-Bold')
          .text('Mother Name:', col2X, personalStartY + 20);
        doc
          .font('Helvetica')
          .text(
            studentDetails.mother_name || 'N/A',
            col2X + 90,
            personalStartY + 20,
          );

        doc
          .font('Helvetica-Bold')
          .text('Parent Mobile:', col2X, personalStartY + 40);
        doc
          .font('Helvetica')
          .text(
            studentDetails.parent_number || 'N/A',
            col2X + 90,
            personalStartY + 40,
          );

        doc
          .font('Helvetica-Bold')
          .text('Address:', col1X, personalStartY + 110);
        doc
          .font('Helvetica')
          .text(
            studentDetails.currentAddress || 'N/A',
            col1X + 90,
            personalStartY + 110,
            { width: 400 },
          );

        // Section: Educational / Professional Details
        const eduY = personalStartY + 160;
        doc
          .strokeColor('#000000')
          .lineWidth(1)
          .moveTo(20, eduY - 10)
          .lineTo(575, eduY - 10)
          .stroke();

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#1F338C')
          .text('EDUCATIONAL / PROFESSIONAL DETAILS', 40, eduY);

        const eduStartY = eduY + 20;
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Qualification:', col1X, eduStartY);
        doc
          .font('Helvetica')
          .text(studentDetails.qualification || 'N/A', col1X + 90, eduStartY);

        // Section: Payment Details
        const payY = eduStartY + 40;
        doc
          .strokeColor('#000000')
          .lineWidth(1)
          .moveTo(20, payY - 10)
          .lineTo(575, payY - 10)
          .stroke();

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#1F338C')
          .text('PAYMENT DETAILS', 40, payY);

        const payStartY = payY + 20;
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Course Fee:', col1X, payStartY);
        doc
          .font('Helvetica')
          .text(
            studentDetails.course?.price
              ? String(studentDetails.course.price)
              : '0.00',
            col1X + 90,
            payStartY,
          );

        doc.font('Helvetica-Bold').text('Course Mode:', col2X, payStartY);
        doc
          .font('Helvetica')
          .text(studentDetails.course_mode || 'offline', col2X + 90, payStartY);

        // Declaration
        // const decY = payStartY + 40;
        // doc
        //   .strokeColor('#000000')
        //   .lineWidth(1)
        //   .moveTo(20, decY - 10)
        //   .lineTo(575, decY - 10)
        //   .stroke();

        // doc
        //   .fontSize(11)
        //   .font('Helvetica-Bold')
        //   .fillColor('#1F338C')
        //   .text('DECLARATION', 40, decY);
        // doc
        //   .font('Helvetica')
        //   .fontSize(9)
        //   .fillColor('#000000')
        //   .text(
        //     'I hereby confirm that the above information provided by me is true and correct. I agree to follow the rules and regulations of the training institute.',
        //     40,
        //     decY + 20,
        //     { width: 490 },
        //   );

        // // Signatures
        // const sigY = decY + 70;
        // doc
        //   .fontSize(10)
        //   .font('Helvetica')
        //   .text('_______________________', 40, sigY);
        // doc.text('Student Signature', 40, sigY + 15);

        // doc.text('_______________________', 380, sigY);
        // doc.text(
        //   `Admitted by: ${studentDetails.admittedBy || 'Admin'}`,
        //   380,
        //   sigY + 15,
        // );

        doc.end();
      });

      return pdfBuffer;
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'getApplication error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async getStudentReport() {
    const students = await this.studentRepo.find({
      where: { is_delete: false },
      select: ['uuid', 'student_name', 'student_id', 'phone_number', 'email'],
      order: { createdAt: 'DESC' },
    });
    return { success: true, data: students };
  }

  async generatePaymentExcel(studentId: string, res: Response): Promise<void> {
    try {
      const student = await this.studentRepo.findOne({
        where: { uuid: studentId },
        relations: ['course'],
      });
      if (!student) throw new NotFoundException('Student not found');
      const result: { data: string } = await lastValueFrom(
        this.FeeService.getStudentFees({ studentId }),
      );
      const feesData = result.data ? JSON.parse(result.data) : null;
      if (!feesData) throw new Error('Fees data not found');

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Payment History');
      sheet.columns = [
        { key: 'col1', width: 20 },
        { key: 'col2', width: 25 },
        { key: 'col3', width: 15 },
        { key: 'col4', width: 15 },
        { key: 'col5', width: 20 },
      ];
      const addInfoRow = (label: string, value: any) => {
        const row = sheet.addRow([label, value]);
        row.getCell(2).alignment = { horizontal: 'left' };
      };

      addInfoRow('Student Name:', student.student_name);
      addInfoRow('Student ID:', student.student_id);
      addInfoRow('Course:', student.course?.course_name || 'N/A');
      addInfoRow('Phone:', student.phone_number);
      sheet.addRow([]);
      sheet.addRow(['FEE SUMMARY']);
      const summaryTable = [
        ['Total Fees', Number(feesData.total_fees || 0)],
        ['Paid Amount', Number(feesData.paid_amount || 0)],
        ['Pending Amount', Number(feesData.pending_amount || 0)],
      ];
      summaryTable.forEach((item) => {
        const row = sheet.addRow([item[0], item[1]]);
        row.getCell(2).numFmt = '#,##0.00';
      });

      sheet.addRow([]);
      sheet.addRow(['SI.NO', 'Transaction ID', 'Date', 'Amount', 'Purpose']);
      (feesData.records || []).forEach((rec: any, i: number) => {
        const row = sheet.addRow([
          i + 1,
          rec.transaction_id,
          rec.date ? new Date(rec.date).toLocaleDateString() : '-',
          Number(rec.amount || 0),
          rec.paymentpurpose,
        ]);
        row.getCell(4).numFmt = '#,##0.00';
      });
      const safeStudentName = student.student_name
        ? student.student_name.replace(/\s+/g, '_')
        : 'Student';
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Payment_Report_${safeStudentName}.xlsx"`,
      });
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      Sentry.captureException(error);
      console.error('Excel Generation Error:', error);
      res
        .status(500)
        .json({ success: false, message: 'Failed to generate report' });
    }
  }

  async feesgetall() {
    try {
      const response: {
        success: boolean;
        message: string;
        data: any[];
        meta: any;
        stats?: any;
      } = await lastValueFrom(this.PaymentService.GetAllPayment({}));

      console.log(response);

      if (!response.success) {
        return response;
      }
      const combinedData = await Promise.all(
        response.data.map(async (pay) => {
          const student = await this.studentRepo.findOne({
            where: { uuid: pay.student_id },
            relations: ['course'],
          });
          return {
            studentID: student?.student_id || pay.student_id,
            uuid: pay.student_id,
            name: student?.student_name || pay.student_name,
            course: student?.course?.course_name || 'N/A',
            totalFee: pay.total_fees || 0,
            paidAmount: pay.paid_amount || 0,
            pendingAmount: pay.pending_amount || 0,
            status: pay.status,
            lastPayment: pay.payment_date || '-',
          };
        }),
      );
      return {
        success: true,
        message: 'payment data fetched',
        data: combinedData,
        stats: response.stats,
        meta: response.meta,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'feesgetall error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async generateStudentReportExcel(res: Response): Promise<void> {
    try {
      const students = await this.studentRepo.find({
        where: { is_delete: false },
        relations: ['course', 'batch'],
        order: { createdAt: 'DESC' },
      });
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Student Report');
      sheet.columns = [
        { header: 'SI.NO', key: 'sino', width: 10 },
        { header: 'Student Name', key: 'name', width: 25 },
        { header: 'Student ID', key: 'id', width: 20 },
        { header: 'Course', key: 'course', width: 20 },
        { header: 'Joined Date', key: 'date', width: 15 },
        { header: 'Joined Time', key: 'time', width: 15 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
      ];
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).alignment = { horizontal: 'center' };
      const groupedStudents: { [key: string]: StudentProfileEntity[] } = {};
      students.forEach((student) => {
        const date = student.batch?.startDate
          ? new Date(student.batch.startDate)
          : new Date(student.createdAt);
        const monthYear = date.toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        });
        if (!groupedStudents[monthYear]) {
          groupedStudents[monthYear] = [];
        }
        groupedStudents[monthYear].push(student);
      });
      Object.keys(groupedStudents).forEach((monthYear) => {
        const headerRow = sheet.addRow([monthYear]);
        headerRow.font = { bold: true, size: 12 };
        headerRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' },
        };
        sheet.mergeCells(headerRow.number, 1, headerRow.number, 8);
        groupedStudents[monthYear].forEach((student, index) => {
          const joinedDate = student.batch?.startDate
            ? new Date(student.batch.startDate)
            : new Date(student.createdAt);
          const joinedTime = new Date(student.createdAt);
          sheet.addRow({
            sino: index + 1,
            name: student.student_name,
            id: student.student_id,
            course: student.course?.course_name || 'N/A',
            date: joinedDate.toLocaleDateString('en-IN'),
            time: joinedTime.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            phone: student.phone_number,
            email: student.email,
          });
        });
        sheet.addRow([]);
      });
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Student_Report_${new Date().toISOString().split('T')[0]}.xlsx"`,
      });
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      Sentry.captureException(error);
      console.error('Student report generation error:', error);
      res
        .status(500)
        .json({ success: false, message: 'Failed to generate report' });
    }
  }

  async studentCount() {
    try {
      const student = await this.studentRepo.count();
      const pending = await this.studentRepo.count();
      return {
        data: {
          student,
          pending,
        },
      };
    } catch (error) {
      Sentry.captureException(error);
      console.log(error);
      return new InternalServerErrorException();
    }
  }

  async updatePlacementEligible(data: any[]) {
    try {
      for (const student of data) {
        await this.studentRepo.update(
          { uuid: student },
          { is_eligible_placement: true, is_no_due: true },
        );
      }

      return {
        success: true,
        message: 'status updated',
      };
    } catch (error) {
      Sentry.captureException(error);
      console.log(error);
      return {
        success: false,
        message: 'internal server error',
      };
    }
  }

  async getplacement(eligible: boolean) {
    try {
      const student = await this.studentRepo.find({
        where: eligible
          ? {
              is_eligible_placement: eligible,
              is_no_due: eligible,
            }
          : [{ is_eligible_placement: eligible }, { is_no_due: eligible }],
        relations: ['course', 'batch'],
      });
      return {
        success: true,
        data: student,
        message: 'student deleted successfully.',
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'delete staff error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async studentLocationUpdate(uuid: string, data: any) {
    try {
      if (!uuid) {
        throw new NotFoundException('Student id is not found');
      }
      await this.studentRepo.update(
        { uuid: uuid },
        { preferredLocations: data.locations },
      );
      return {
        success: true,
        message: 'location updated',
      };
    } catch (error) {
      Sentry.captureException(error);
      console.log(error);
      return {
        success: false,
        message: 'internal server error',
      };
    }
  }

  async update(uuid: string, data: any) {
    try {
      const student = await this.studentRepo.findOne({
        where: { uuid },
      });

      if (!student) {
        throw new NotFoundException({
          success: false,
          message: 'student not found',
        });
      }

      // Update fields if provided
      if (data.student_name !== undefined)
        student.student_name = data.student_name;
      if (data.email !== undefined) student.email = data.email;
      if (data.phone_number !== undefined)
        student.phone_number = data.phone_number;
      if (data.qualification !== undefined)
        student.qualification = data.qualification;
      if (data.currentAddress !== undefined)
        student.currentAddress = data.currentAddress;
      if (data.permantAddress !== undefined)
        student.permantAddress = data.permantAddress;

      const profile = await this.studentRepo.save(student);
      await this.redisCache.deleteUser(student.uuid);
      await this.redisCache.setUser(profile.uuid, profile);

      return {
        success: true,
        message: 'student updated successfully',
        data: profile,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'update student error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }
}
