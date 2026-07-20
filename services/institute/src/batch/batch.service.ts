import * as Sentry from '@sentry/nestjs';
import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BatchEntity } from 'src/entities/batch.entity';
import { In, LessThan, Repository } from 'typeorm';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { StudentProfileEntity } from 'src/entities/student.entity';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { ClientProxy } from '@nestjs/microservices';
import axios from 'axios';

@Injectable()
export class BatchService implements OnModuleInit {
  constructor(
    @InjectRepository(BatchEntity)
    private batchRepo: Repository<BatchEntity>,
    @InjectRepository(StudentProfileEntity)
    private studentRepo: Repository<StudentProfileEntity>,
    @InjectQueue('batch-assign')
    private queue: Queue,
    @Inject('CHAT_SERVICE')
    private chatClient: ClientProxy,
  ) {}

  onModuleInit() {
    this.queue.on('error', (err) => {
      console.error('Redis connection error', err);
    });
  }

  async create(data: CreateBatchDto) {
    try {
      const nowDate = new Date();
      const exist = await this.batchRepo.findOne({
        where: { batchName: data.batchName },
      });

      if (exist) {
        return new ConflictException({
          success: false,
          message: 'batch name already taken to chose other name.',
        });
      }

      const batchCode =
        'PI' +
        nowDate.getMonth() +
        nowDate.getFullYear() +
        nowDate.getMilliseconds();

      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      const batch = this.batchRepo.create({
        ...data,
        batchCode,
        startDate,
        endDate,
      });

      await this.batchRepo.save(batch);

      const { data: staffs } = await axios.get(
        'http://training-service:3008/staff/staffs-get',
      );

      const staffMembers = staffs.map((staff: any) => ({
        userId: staff.uuid,
        name: staff.staff_name,
        role: 'STAFF',
      }));

      const { data: admins } = await axios.get(
        'http://authentication-service:3002/admins/get-admins',
      );

      const adminMembers = admins.map((admin: any) => ({
        userId: admin.uuid,
        name: admin.name,
        role: 'ADMIN',
      }));

      const students = await this.studentRepo.find({
        where: {
          uuid: In(data.studentIds),
        },
      });

      const studentMembers = students.map((student) => ({
        userId: student.uuid,
        name: student.student_name,
        role: 'STUDENT',
      }));

      const members = [...staffMembers, ...studentMembers, ...adminMembers];

      console.log('Unique Members', members);

      this.chatClient.emit('group.created', {
        name: batch.batchName,
        members: members,
      });

      // eslint-disable-next-line no-unsafe-optional-chaining
      for (const user of data?.studentIds) {
        await this.queue.add('assign', {
          batchId: batch.uuid,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          studentId: user,
        });
      }

      return {
        success: true,
        message: 'batch created successfully',
        data: batch,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'create batch error!');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error!',
      });
    }
  }

  async findOne(uuid: string) {
    try {
      const batch = await this.batchRepo.findOne({
        where: { uuid, isDelete: false },
        relations: ['students'],
      });

      if (!batch) {
        return new NotFoundException({
          success: false,
          message: 'batch not founded Or Maybe its deleted',
        });
      }

      const grpcBatch = {
        id: batch.id,
        uuid: batch.uuid,
        // instituteId: batch.instituteId,
        // branchId: batch.branchId,
        courseId: batch.courseId,
        batchName: batch.batchName,
        batchMode: batch.batchMode,
        classStartTime: batch.classStartTime,
        classEntTime: batch.classEndTime,
        totalStudent: batch.seatsFilled,
        students: batch.students?.map((s) => ({
          uuid: s.uuid,
          studentName: s.student_name,
          studentId: s.student_id,
        })),
      };

      return {
        success: true,
        message: 'batch details fetched',
        data: grpcBatch,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'find batch error!');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error!',
      });
    }
  }

  async findAll(query: { page: string; limit: string }) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const [batch, total] = await this.batchRepo.findAndCount({
        where: { isDelete: false },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
        relations: ['course'],
      });

      if (!batch) {
        return new NotFoundException({
          success: false,
          message: 'batch not founded',
        });
      }

      return {
        success: true,
        message: 'batch details fetched',
        data: batch,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'find batch error!');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error!',
      });
    }
  }

  async findAllBycourse(
    course_id: string,
    query: { page: string; limit: string },
  ) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;

      const [batchs, total] = await this.batchRepo.findAndCount({
        where: { courseId: course_id, isDelete: false },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      return {
        success: true,
        message: 'batch data fetched',
        data: batchs,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'find all by course batch error!');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error!',
      });
    }
  }

  async updateOne(uuid: string, data: UpdateBatchDto) {
    try {
      const batch = await this.batchRepo.findOne({ where: { uuid } });

      if (!batch) {
        return new NotFoundException({
          success: false,
          message: 'batch not founded',
        });
      }

      Object.assign(batch, data);

      await this.batchRepo.save(batch);

      return {
        success: true,
        message: 'batch updated',
        data: batch,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'update batch error!');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async softDelete(uuid: string) {
    try {
      await this.batchRepo.update({ uuid }, { isDelete: true });

      return {
        success: true,
        message: 'batch deleted successfully.',
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'soft delete batch error!');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server eroor',
      });
    }
  }

  async findAllBycourseNew(course_id: string) {
    try {
      const nowDate = new Date();

      const batches = await this.batchRepo.find({
        where: {
          courseId: course_id,
          startDate: LessThan(nowDate),
          isDelete: false,
        },
      });

      return {
        success: true,
        message: 'batch data fetched',
        data: batches,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'find all by course batch error!');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error!',
      });
    }
  }

  async finddropdownBycourse(course_id: string) {
    try {
      const data = await this.batchRepo.find({
        where: {
          courseId: course_id,
          isDelete: false,
        },
        select: ['batchName', 'uuid', 'batchCode'],
        order: { createdAt: 'DESC' },
      });

      return data;
    } catch (error) {
      Sentry.captureException(error);
      console.log(error);
    }
  }

  async findByStudntId(studentId: string) {
    try {
      const user = await this.studentRepo.findOne({
        where: { uuid: studentId },
      });
      const batch = await this.batchRepo.findOne({
        where: {
          uuid: user?.batch_id,
        },
      });

      if (!batch) {
        return new NotFoundException('batch not founded');
      }

      return {
        data: JSON.stringify(batch),
      };
    } catch (error) {
      Sentry.captureException(error);
      console.log(error);
    }
  }

  async reAllocationBatch(studentId: string, batchid: string) {
    try {
      const user = await this.studentRepo.findOne({
        where: { uuid: studentId },
      });

      if (!user) {
        return new NotFoundException('user not founded');
      }

      const batch = await this.batchRepo.findOne({
        where: {
          uuid: batchid,
        },
      });

      if (!batch) {
        return new NotFoundException('batch not founded');
      }

      Object.assign(user, { batch_id: batch.uuid });

      await this.studentRepo.save(user);

      return {
        message: 'student re-allocated success',
        sucess: true,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'update batch error!');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async completedbatch() {
    const nowDate = new Date();
    const data = await this.batchRepo.find({
      // where: { endDate: LessThan(nowDate) },
      relations: ['students'],
    });

    return { data: JSON.stringify(data) };
  }
}
