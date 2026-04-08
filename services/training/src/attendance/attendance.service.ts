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

interface batchgrpc {
  GetById(data: { batchid: string }): Observable<any>;
  GetByStudentId(data: { studentId: string }): Observable<any>;
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
}
