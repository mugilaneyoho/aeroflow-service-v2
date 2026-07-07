/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AttendanceEntity } from 'src/entities/attendance.entity';
import {
  StatusRecordEntity,
  StatusRecordEnum,
} from 'src/entities/statusrecord.entity';
import { Any, Between, Repository } from 'typeorm';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { OnlineClassesEntity } from 'src/entities/OnlineClass.entity';
import { OfflineClassesEntity } from 'src/entities/OfflineClass.entity';
import { lastValueFrom, Observable } from 'rxjs';
import * as microservices from '@nestjs/microservices';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

interface batchgrpc {
  GetById(data: { batchid: string }): Observable<any>;
  GetByStudentId(data: { studentId: string }): Observable<any>;
  GetcompleteBatch(data: {}): Observable<any>;
}

@Injectable()
export class AttendanceService implements OnModuleInit {
  private batchService: batchgrpc;

  constructor(
    @InjectRepository(AttendanceEntity)
    private attendanceRepo: Repository<AttendanceEntity>,
    @InjectRepository(OfflineClassesEntity)
    private offlineRepo: Repository<OfflineClassesEntity>,
    @InjectRepository(OnlineClassesEntity)
    private onlineRepo: Repository<OnlineClassesEntity>,
    @InjectRepository(StatusRecordEntity)
    private statusRepo: Repository<StatusRecordEntity>,
    @InjectQueue('attendance-status')
    private queue: Queue,
    @Inject('batch')
    private clientBatch: microservices.ClientGrpc,
  ) {}

  onModuleInit() {
    this.batchService = this.clientBatch.getService('BatchService');
    this.queue.client.on('error', (err) => {
      console.error('Redis connection error', err);
    });
  }

  selectMode(mode: string) {
    if (mode === 'ONLINE') {
      return this.onlineRepo;
    } else if (mode === 'OFFLINE') {
      return this.offlineRepo;
    } else {
      throw new NotFoundException('pass right class mode');
    }
  }

  async create(data: CreateAttendanceDto, req: { headers: { user: string } }) {
    try {
      const count = {
        present: 0,
        absent: 0,
      };

      const user: { profile_id: string } = JSON.parse(req.headers.user);

      const classRepo = this.selectMode(data.class_mode.toUpperCase());

      const classData = await classRepo.findOne({
        where: {
          uuid: data.classId,
        },
      });

      if (!classData) {
        return new NotFoundException('classes not founded');
      }

      const grpc_batch: {
        success: boolean;
        data: any;
      } = await lastValueFrom(
        this.batchService.GetById({
          batchid: classData.batch_id,
        }),
      );

      if (!grpc_batch.success) {
        console.error('grpc staff profile error.');
        return new InternalServerErrorException({
          success: false,
          message: 'internal server error.',
        });
      }

      const students: any[] = grpc_batch?.data.students;

      for (const status of data.records) {
        const d =
          status.status == StatusRecordEnum.PRESENT
            ? (count['present'] = count['present'] + 1)
            : (count['absent'] = count['absent'] + 1);
      }

      const attendance = this.attendanceRepo.create({
        classId: classData?.uuid,
        staffId: user.profile_id,
        date: classData?.start_date,
        present_count: count.present,
        absent_count: Math.abs(students?.length - count.present),
      });

      const update = await this.attendanceRepo.save(attendance);

      const presentStudents = new Set(data.records.map((rec) => rec.studentId));

      for (const student of students) {
        const ispresent = presentStudents.has(student.uuid as string);

        await this.queue.add('assign', {
          attendanceId: update.uuid,
          studentId: student.uuid,
          name: student.studentName,
          roleNo: student.studentId,
          status: ispresent
            ? StatusRecordEnum.PRESENT
            : StatusRecordEnum.ABSENT,
        });
      }

      await classRepo.update(
        { uuid: classData.uuid },
        {
          attendance: true,
          present_student: count.present,
        },
      );

      return {
        success: true,
        message: 'attendance uploaded',
      };
    } catch (error) {
      console.log(error, 'attendance error!.');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error.',
      });
    }
  }

  async findAll(classId: string) {
    try {
      const data = await this.attendanceRepo.findOne({
        where: { classId },
        relations: ['records'],
      });

      if (!data) {
        return new NotFoundException('no attendance added');
      }

      return {
        success: true,
        message: 'data fetched',
        data,
      };
    } catch (error) {
      console.error(error, 'find class error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async FindPendingClass(
    req: { headers: { user: string } },
    classid: string,
    classmode: string,
  ) {
    try {
      const user = JSON.parse(req.headers.user as unknown as string);
      // const online = await this.onlineRepo.find({
      //   where: { staff_id: user.profile_id, attendance: false },
      // });
      // const offline = await this.offlineRepo.find({
      //   where: { staff_id: user.profile_id, attendance: false },
      // });

      const classRepo = this.selectMode(classmode.toUpperCase());

      // const finalclass = [...online, ...offline];
      // const output: any[] = [];

      // for (const data of finalclass) {
      //   console.log(data.batch_id);
      //   const grpc_batch: {
      //     success: boolean;
      //     data: any;
      //   } = await lastValueFrom(
      //     this.batchService.GetById({
      //       batchid: data.batch_id,
      //     }),
      //   );

      //   if (!grpc_batch.success) {
      //     console.error('grpc staff profile error.');
      //     return new InternalServerErrorException({
      //       success: false,
      //       message: 'internal server error.',
      //     });
      //   }
      //   console.log(grpc_batch.data, 'check batches');

      //   const classes = { classData: data, batchData: grpc_batch.data };

      //   output.push(classes);
      // }

      const classData = await classRepo.findOne({
        where: { uuid: classid, staff_id: user.profile_id },
      });

      if (!classData) {
        return new NotFoundException('classes not founded');
      }

      const grpc_batch: {
        success: boolean;
        data: any;
      } = await lastValueFrom(
        this.batchService.GetById({
          batchid: classData.batch_id,
        }),
      );

      if (!grpc_batch.success) {
        console.error('grpc staff profile error.');
        return new InternalServerErrorException({
          success: false,
          message: 'internal server error.',
        });
      }

      const classes = { classData, batchData: grpc_batch.data };

      return {
        success: true,
        data: [classes],
      };
    } catch (error) {
      console.error(error, 'find staff class error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async FindStudentAttendance(
    req: { headers: { user: string } },
    date: string,
  ) {
    try {
      const user = JSON.parse(req.headers.user);
      const currentDate = new Date(date);

      const startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      const endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1,
      );

      console.log(startDate, endDate);

      const grpc_batch: {
        data: string;
      } = await lastValueFrom(
        this.batchService.GetByStudentId({
          studentId: user?.profile_id,
        }),
      );

      const batch = JSON.parse(grpc_batch.data);

      const classRepo = this.selectMode(batch?.batchMode as string);
      const classData = await classRepo.find({
        where: {
          batch_id: batch?.uuid,
          start_date: Between(startDate, endDate),
        },
      });

      const records: any = {};

      for (const data of classData) {
        const attendance = await this.attendanceRepo.findOne({
          where: {
            classId: data?.uuid,
          },
          relations: ['records'],
        });

        if (!attendance) {
          continue;
        }

        const rec = attendance?.records?.find(
          (item) => item.studentId === user?.profile_id,
        );

        if (!rec) {
          continue;
        }

        //     const attendanceData:any = {
        //   "2024-10-01": { status: 'present' },
        //   "2024-10-02": { status: 'present' },
        //   "2024-10-08": { status: 'absent' },
        //   "2024-10-14": { status: 'late', time: '8:15 AM' }, for future
        // };
        // const row = {
        //   ,
        // };

        if (rec) {
          records[attendance.date.toISOString().split('T')[0]] = {
            status: rec.status,
          };
        }
      }

      return {
        data: records,
      };
    } catch (error) {
      console.error(error, 'find student attendance');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async exportAttendanceReport(
    res: Response,
    studentId?: string,
    batchId?: string,
  ) {
    try {
      // 1. Fetch batches and students list from Grpc service
      const grpc_batches: { data: string } = await lastValueFrom(
        this.batchService.GetcompleteBatch({}),
      );
      const batchesData: any[] = JSON.parse(grpc_batches.data || '[]');

      // 2. Fetch all online and offline classes
      const onlineClasses = await this.onlineRepo.find();
      const offlineClasses = await this.offlineRepo.find();
      
      const classMap = new Map<string, { subject: string; class_mode: string; batch_id: string }>();
      for (const c of onlineClasses) {
        classMap.set(c.uuid, { subject: c.subject, class_mode: 'online', batch_id: c.batch_id });
      }
      for (const c of offlineClasses) {
        classMap.set(c.uuid, { subject: c.subject, class_mode: 'offline', batch_id: c.batch_id });
      }

      const workbook = new ExcelJS.Workbook();

      if (studentId) {
        // --- SINGLE STUDENT EXPORT ---
        let studentObj: any = null;
        let foundBatchName = 'Unknown Batch';
        for (const b of batchesData) {
          const student = b.students?.find((s: any) => s.uuid === studentId);
          if (student) {
            studentObj = student;
            foundBatchName = b.batchName;
            break;
          }
        }

        // Fetch all attendance status records for this student
        const records = await this.statusRepo.find({
          where: { studentId },
          relations: ['attendance'],
        });

        // Sort records by class date
        records.sort((a, b) => new Date(a.attendance.date).getTime() - new Date(b.attendance.date).getTime());

        const studentName = studentObj ? (studentObj.student_name || studentObj.studentName) : (records[0]?.name || 'Student');
        const roleNo = studentObj ? (studentObj.student_id || studentObj.studentId) : (records[0]?.roleNo || 'N/A');

        const totalSessions = records.length;
        const attended = records.filter(r => r.status === StatusRecordEnum.PRESENT).length;
        const absent = totalSessions - attended;
        const attendanceRate = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;

        const sheet = workbook.addWorksheet('Attendance Log');

        sheet.mergeCells('A1:E1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = 'AeroFlow - Student Attendance Detailed Report';
        titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 40;

        sheet.addRow([]);

        sheet.addRow(['Student Name:', studentName, '', 'Batch:', foundBatchName]);
        sheet.addRow(['Student ID:', roleNo, '', 'Attendance Rate:', `${attendanceRate}%`]);
        sheet.addRow(['Total Sessions:', totalSessions, '', 'Attended / Absent:', `${attended} / ${absent}`]);
        
        sheet.getRow(3).font = { bold: true };
        sheet.getRow(4).font = { bold: true };
        sheet.getRow(5).font = { bold: true };

        sheet.addRow([]);

        sheet.addRow(['Sl. No.', 'Date', 'Class Topic / Subject', 'Class Mode', 'Status']);
        
        const headerRow = sheet.getRow(8);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } };
        headerRow.alignment = { horizontal: 'center' };

        records.forEach((rec, idx) => {
          const classInfo = classMap.get(rec.attendance.classId);
          const subject = classInfo ? classInfo.subject : 'Curriculum Unit';
          const mode = classInfo ? classInfo.class_mode.toUpperCase() : 'ONLINE';
          const formattedDate = new Date(rec.attendance.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
          });

          sheet.addRow([
            idx + 1,
            formattedDate,
            subject,
            mode,
            rec.status
          ]);

          const rowNum = 9 + idx;
          const statusCell = sheet.getCell(`E${rowNum}`);
          if (rec.status === StatusRecordEnum.PRESENT) {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
            statusCell.font = { color: { argb: 'FF065F46' }, bold: true };
          } else {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
            statusCell.font = { color: { argb: 'FF991B1B' }, bold: true };
          }
        });

        sheet.eachRow((row, rowNum) => {
          if (rowNum >= 8) {
            row.eachCell(cell => {
              cell.border = {
                top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
              };
              if (cell.col !== 'C') {
                cell.alignment = { horizontal: 'center' };
              }
            });
          }
        });

        sheet.columns.forEach(column => {
          let maxLen = 0;
          column.eachCell!({ includeEmpty: true }, cell => {
            const valLen = cell.value ? cell.value.toString().length : 0;
            if (valLen > maxLen) maxLen = valLen;
          });
          column.width = Math.max(maxLen + 3, 12);
        });

      } else {
        // --- MULTIPLE STUDENTS EXPORT ---
        const allRecords = await this.statusRepo.find({
          relations: ['attendance'],
        });

        allRecords.sort((a, b) => new Date(a.attendance.date).getTime() - new Date(b.attendance.date).getTime());

        let targetStudents: any[] = [];
        const studentToBatchName = new Map<string, string>();

        batchesData.forEach(b => {
          if (!batchId || b.uuid === batchId || b.batchName === batchId) {
            b.students?.forEach((s: any) => {
              targetStudents.push({
                uuid: s.uuid,
                studentName: s.student_name || s.studentName || 'Student',
                studentId: s.student_id || s.studentId || 'N/A',
                batchName: b.batchName,
                batchId: b.uuid
              });
              studentToBatchName.set(s.uuid, b.batchName);
            });
          }
        });

        if (targetStudents.length === 0 && allRecords.length > 0) {
          const uniqueStudentIds = new Set(allRecords.map(r => r.studentId));
          uniqueStudentIds.forEach(id => {
            const studentRec = allRecords.find(r => r.studentId === id);
            if (studentRec) {
              targetStudents.push({
                uuid: id,
                studentName: studentRec.name,
                studentId: studentRec.roleNo,
                batchName: 'Unknown Batch',
                batchId: 'unknown'
              });
            }
          });
        }

        const studentStats = targetStudents.map(student => {
          const studentRecords = allRecords.filter(r => r.studentId === student.uuid);
          const total = studentRecords.length;
          const attended = studentRecords.filter(r => r.status === StatusRecordEnum.PRESENT).length;
          const absent = total - attended;
          const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

          return {
            ...student,
            total,
            attended,
            absent,
            rate
          };
        });

        studentStats.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));

        const summarySheet = workbook.addWorksheet('Summary Dashboard');
        
        summarySheet.mergeCells('A1:H1');
        const titleCell = summarySheet.getCell('A1');
        titleCell.value = batchId 
          ? `AeroFlow - Attendance Summary: ${batchId}` 
          : 'AeroFlow - Overall Attendance Summary Report';
        titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        summarySheet.getRow(1).height = 40;

        summarySheet.addRow([]);

        const totalEnrolled = studentStats.length;
        const avgAttendance = totalEnrolled > 0 
          ? Math.round(studentStats.reduce((acc, s) => acc + s.rate, 0) / totalEnrolled) 
          : 0;
        const regularCount = studentStats.filter(s => s.rate >= 85).length;
        const atRiskCount = studentStats.filter(s => s.rate < 75).length;

        summarySheet.addRow(['Total Enrolled:', totalEnrolled, '', 'Average Attendance:', `${avgAttendance}%`]);
        summarySheet.addRow(['Regular Students (>=85%):', regularCount, '', 'At-Risk Students (<75%):', atRiskCount]);
        summarySheet.getRow(3).font = { bold: true };
        summarySheet.getRow(4).font = { bold: true };

        summarySheet.addRow([]);

        summarySheet.addRow(['Sl. No.', 'Student ID', 'Student Name', 'Batch Name', 'Total Sessions', 'Attended', 'Absent', 'Attendance Rate (%)']);
        const summaryHeaderRow = summarySheet.getRow(6);
        summaryHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        summaryHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } };
        summaryHeaderRow.alignment = { horizontal: 'center' };

        studentStats.forEach((stat, idx) => {
          summarySheet.addRow([
            idx + 1,
            stat.studentId,
            stat.studentName,
            stat.batchName,
            stat.total,
            stat.attended,
            stat.absent,
            `${stat.rate}%`
          ]);

          const rowNum = 7 + idx;
          const rateCell = summarySheet.getCell(`H${rowNum}`);
          if (stat.rate >= 85) {
            rateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1FAE5' } };
            rateCell.font = { color: { argb: '065F46' }, bold: true };
          } else if (stat.rate < 75) {
            rateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
            rateCell.font = { color: { argb: '991B1B' }, bold: true };
          }
        });

        summarySheet.eachRow((row, rowNum) => {
          if (rowNum >= 6) {
            row.eachCell(cell => {
              cell.border = {
                top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
              };
              if (cell.col !== 'C' && cell.col !== 'D') {
                cell.alignment = { horizontal: 'center' };
              }
            });
          }
        });

        summarySheet.columns.forEach(column => {
          let maxLen = 0;
          column.eachCell!({ includeEmpty: true }, cell => {
            const valLen = cell.value ? cell.value.toString().length : 0;
            if (valLen > maxLen) maxLen = valLen;
          });
          column.width = Math.max(maxLen + 3, 12);
        });

        const logsSheet = workbook.addWorksheet('Detailed Daily Logs');
        
        logsSheet.mergeCells('A1:H1');
        const logsTitleCell = logsSheet.getCell('A1');
        logsTitleCell.value = 'AeroFlow - Daily Attendance Status Logs';
        logsTitleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        logsTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } };
        logsTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        logsSheet.getRow(1).height = 40;

        logsSheet.addRow([]);

        logsSheet.addRow(['Sl. No.', 'Date', 'Student ID', 'Student Name', 'Batch', 'Class Topic / Subject', 'Class Mode', 'Status']);
        const logsHeaderRow = logsSheet.getRow(3);
        logsHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        logsHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } };
        logsHeaderRow.alignment = { horizontal: 'center' };

        let rowIdx = 1;
        allRecords.forEach(rec => {
          const studentBatchName = studentToBatchName.get(rec.studentId);
          if (batchId && !studentBatchName) return;

          const classInfo = classMap.get(rec.attendance.classId);
          const subject = classInfo ? classInfo.subject : 'Curriculum Unit';
          const mode = classInfo ? classInfo.class_mode.toUpperCase() : 'ONLINE';
          const formattedDate = new Date(rec.attendance.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
          });

          logsSheet.addRow([
            rowIdx,
            formattedDate,
            rec.roleNo,
            rec.name,
            studentBatchName || 'Unknown Batch',
            subject,
            mode,
            rec.status
          ]);

          const rowNum = 3 + rowIdx;
          const statusCell = logsSheet.getCell(`H${rowNum}`);
          if (rec.status === StatusRecordEnum.PRESENT) {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
            statusCell.font = { color: { argb: 'FF065F46' }, bold: true };
          } else {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
            statusCell.font = { color: { argb: 'FF991B1B' }, bold: true };
          }

          rowIdx++;
        });

        logsSheet.eachRow((row, rowNum) => {
          if (rowNum >= 3) {
            row.eachCell(cell => {
              cell.border = {
                top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
              };
              if (cell.col !== 'D' && cell.col !== 'E' && cell.col !== 'F') {
                cell.alignment = { horizontal: 'center' };
              }
            });
          }
        });

        logsSheet.columns.forEach(column => {
          let maxLen = 0;
          column.eachCell!({ includeEmpty: true }, cell => {
            const valLen = cell.value ? cell.value.toString().length : 0;
            if (valLen > maxLen) maxLen = valLen;
          });
          column.width = Math.max(maxLen + 3, 12);
        });
      }

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      const filename = studentId ? `attendance_report_${studentId}.xlsx` : 'attendance_summary_report.xlsx';
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"`,
      );

      await workbook.xlsx.write(res);
      res.end();

    } catch (error: any) {
      console.error('Error generating Excel report:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error generating attendance report',
        error: error.message
      });
    }
  }

  async getRates() {
    try {
      // 1. Fetch all online and offline classes that are not deleted
      const onlineClasses = await this.onlineRepo.find({ where: { is_delete: false } });
      const offlineClasses = await this.offlineRepo.find({ where: { is_delete: false } });

      const batchClassCounts: { [batchId: string]: number } = {};
      for (const c of onlineClasses) {
        if (!c.batch_id) continue;
        if (!batchClassCounts[c.batch_id]) {
          batchClassCounts[c.batch_id] = 0;
        }
        batchClassCounts[c.batch_id] += 1;
      }
      for (const c of offlineClasses) {
        if (!c.batch_id) continue;
        if (!batchClassCounts[c.batch_id]) {
          batchClassCounts[c.batch_id] = 0;
        }
        batchClassCounts[c.batch_id] += 1;
      }

      // 2. Fetch all status records to count attended classes (status = PRESENT) per student
      const statusRecords = await this.statusRepo.find();
      const studentAttendedCounts: { [studentId: string]: number } = {};
      for (const rec of statusRecords) {
        if (!rec.studentId) continue;
        if (rec.status === StatusRecordEnum.PRESENT) {
          if (!studentAttendedCounts[rec.studentId]) {
            studentAttendedCounts[rec.studentId] = 0;
          }
          studentAttendedCounts[rec.studentId] += 1;
        }
      }

      // 3. Fetch all batches and students list from Grpc service
      let batchesData: any[] = [];
      try {
        const grpc_batches: { data: string } = await lastValueFrom(
          this.batchService.GetcompleteBatch({}),
        );
        batchesData = JSON.parse(grpc_batches.data || '[]');
      } catch (grpcErr) {
        console.error('Error fetching batches from gRPC in getRates:', grpcErr);
      }

      const data: any[] = [];
      const processedStudentIds = new Set<string>();

      // 4. Map students who are assigned to batches
      for (const batch of batchesData) {
        const batchId = batch.uuid;
        const totalClasses = batchClassCounts[batchId] || 0;

        if (batch.students && Array.isArray(batch.students)) {
          for (const student of batch.students) {
            if (!student.uuid) continue;
            const studentId = student.uuid;
            processedStudentIds.add(studentId);

            const attendedClasses = studentAttendedCounts[studentId] || 0;
            const absentClasses = totalClasses > attendedClasses ? totalClasses - attendedClasses : 0;
            const attendanceRate = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 100;

            data.push({
              studentId,
              totalClasses,
              attendedClasses,
              absentClasses,
              attendanceRate,
            });
          }
        }
      }

      // 5. Fallback for any other students who have status records but were not in the Grpc batch student lists
      const fallbackSummaryMap: { [studentId: string]: { total: number; attended: number } } = {};
      for (const rec of statusRecords) {
        if (!rec.studentId || processedStudentIds.has(rec.studentId)) continue;
        if (!fallbackSummaryMap[rec.studentId]) {
          fallbackSummaryMap[rec.studentId] = { total: 0, attended: 0 };
        }
        fallbackSummaryMap[rec.studentId].total += 1;
        if (rec.status === StatusRecordEnum.PRESENT) {
          fallbackSummaryMap[rec.studentId].attended += 1;
        }
      }

      for (const studentId of Object.keys(fallbackSummaryMap)) {
        const { total, attended } = fallbackSummaryMap[studentId];
        data.push({
          studentId,
          totalClasses: total,
          attendedClasses: attended,
          absentClasses: total - attended,
          attendanceRate: total > 0 ? Math.round((attended / total) * 100) : 100,
        });
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error in getRates:', error);
      throw new InternalServerErrorException('Failed to fetch attendance rates');
    }
  }

  async getStudentLog(studentId: string) {
    try {
      // 1. Fetch batches to find the student's batch
      let batchesData: any[] = [];
      try {
        const grpc_batches: { data: string } = await lastValueFrom(
          this.batchService.GetcompleteBatch({}),
        );
        batchesData = JSON.parse(grpc_batches.data || '[]');
      } catch (grpcErr) {
        console.error('Error fetching batches from gRPC in getStudentLog:', grpcErr);
      }

      let studentBatchId: string | null = null;
      for (const b of batchesData) {
        const student = b.students?.find((s: any) => s.uuid === studentId);
        if (student) {
          studentBatchId = b.uuid;
          break;
        }
      }

      // 2. Fetch all status records for this student
      const records = await this.statusRepo.find({
        where: { studentId },
        relations: ['attendance'],
      });
      const recordMap = new Map<string, StatusRecordEnum>();
      for (const rec of records) {
        if (rec.attendance?.classId) {
          recordMap.set(rec.attendance.classId, rec.status);
        }
      }

      let logs: any[] = [];

      if (studentBatchId) {
        // 3. Fetch all classes for this batch
        const onlineClasses = await this.onlineRepo.find({
          where: { batch_id: studentBatchId, is_delete: false },
        });
        const offlineClasses = await this.offlineRepo.find({
          where: { batch_id: studentBatchId, is_delete: false },
        });

        const allClasses = [...onlineClasses, ...offlineClasses];
        logs = allClasses.map(c => {
          const status = recordMap.get(c.uuid);
          return {
            date: c.start_date ? c.start_date.toISOString() : c.createdAt.toISOString(),
            sessionTopic: c.subject || 'Curriculum Unit',
            classMode: c.class_mode || 'online',
            status: status === StatusRecordEnum.PRESENT ? 'Present' : 'Absent',
          };
        });
      } else {
        // Fallback: If student has no assigned batch, use status records only
        logs = records.map(rec => {
          return {
            date: rec.attendance?.date ? rec.attendance.date.toISOString() : rec.createdAt.toISOString(),
            sessionTopic: 'Curriculum Unit',
            classMode: 'online',
            status: rec.status === StatusRecordEnum.PRESENT ? 'Present' : 'Absent',
          };
        });
      }

      // Sort by date descending
      logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        success: true,
        data: logs,
      };
    } catch (error) {
      console.error('Error in getStudentLog:', error);
      throw new InternalServerErrorException('Failed to fetch student log');
    }
  }
}
