import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CourseEntity } from './entities/course.entity';
import { Repository } from 'typeorm';
import { StudentProfileEntity } from './entities/student.entity';
import { BatchEntity } from './entities/batch.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(CourseEntity)
    private courseRepo: Repository<CourseEntity>,
    @InjectRepository(StudentProfileEntity)
    private studentRepo: Repository<StudentProfileEntity>,
    @InjectRepository(BatchEntity)
    private batchRepo: Repository<BatchEntity>,
  ) {}

  getHello(): string {
    return 'institute service running';
  }

  async getdashboard() {
    try {
      // const nowDate = new Date();
      const TotalCourse = await this.courseRepo.count({
        where: { is_delete: false },
      });
      const TotalStudent = await this.studentRepo.count({
        where: { is_delete: false },
      });

      const [BatchList, ActiveBatch] = await this.batchRepo.findAndCount({
        where: {
          // endDate: LessThanOrEqual(nowDate),
          isDelete: false,
        },
      });

      return {
        TotalCourse,
        ActiveBatch,
        TotalStudent,
        BatchList,
      };
    } catch (error) {
      console.log(error, 'dashboard grpc error.');
      throw new InternalServerErrorException('grpc server error');
    }
  }

  async masterDashboard() {
    try {
      const totalStudent = await this.studentRepo.count();
      const totalbatch = await this.batchRepo.count();
      // const totalfeescollect;
      // const totalmeeting;

      return {
        totalStudent,
        totalbatch,
      };
    } catch (error) {
      console.log(error, 'dashboard master.');
      throw new InternalServerErrorException('grpc server error');
    }
  }
}
