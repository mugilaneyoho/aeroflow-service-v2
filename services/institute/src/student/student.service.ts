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

  constructor(
    @InjectRepository(StudentProfileEntity)
    private studentRepo: Repository<StudentProfileEntity>,
    @InjectRepository(CourseEntity)
    private courseRepo: Repository<CourseEntity>,
    @InjectRepository(BatchEntity)
    private batchRepo: Repository<BatchEntity>,

    @Inject('student')
    private client: microservices.ClientGrpc,
    @Inject('payment')
    private paymentClient: microservices.ClientGrpc,
  ) {}

  onModuleInit() {
    this.AuthService = this.client.getService('StudentService');
    this.FeeService = this.paymentFeeClient.getService('FeeManagement');
    this.PaymentService = this.paymentRecordClient.getService('PaymentService');
  }

  async create(data: CreateStudentDto) {
    try {
      const nowDate = new Date();
      const exist = await this.studentRepo.findOne({
        where: { email: data.email },
      });

      if (exist) {
        return new ConflictException({
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

      await this.batchRepo
        .createQueryBuilder()
        .update()
        .set({ seatsFilled: () => 'seatsFilled + 1' })
        .where('uuid = :uuid', { uuid: data.batch_id })
        .execute();

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
      console.error(error, 'create student error!');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async findAll(query: { page: string; limit: string }) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;

      const [students, total] = await this.studentRepo.findAndCount({
        where: { is_delete: false },
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
      console.error(error, 'getall student error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async findOne(uuid: string) {
    try {
      const student = await this.studentRepo.findOne({
        where: { uuid },
        relations: ['course', 'batch'],
      });

      return {
        success: true,
        message: 'student fetched',
        data: student,
      };
    } catch (error) {
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
      return {
        success: true,
        message: 'student deleted successfully.',
      };
    } catch (error) {
      console.error(error, 'delete staff error');
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
      console.error(error, 'getStudentFees error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

}
