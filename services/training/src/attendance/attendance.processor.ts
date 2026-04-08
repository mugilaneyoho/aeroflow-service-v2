/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Process, Processor } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import type { Job } from 'bull';
import {
  StatusRecordEntity,
  StatusRecordEnum,
} from 'src/entities/statusrecord.entity';
import { Repository } from 'typeorm';

@Processor('attendance-status')
export class AttendanceProcessor {
  constructor(
    @InjectRepository(StatusRecordEntity)
    private statusRepo: Repository<StatusRecordEntity>,
  ) {}

  @Process('assign')
  async handel(job: Job) {
    try {
      const data: {
        attendanceId: string;
        studentId: string;
        status: StatusRecordEnum;
        name: string;
        roleNo: string;
      } = job.data;
      const status = this.statusRepo.create({ ...data });
      await this.statusRepo.save(status);
    } catch (error) {
      console.log(error, 'attendance redis error!');
    }
  }
}
