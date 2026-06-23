/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Process, Processor } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import type { Job } from 'bull';
import { StudentProfileEntity } from 'src/entities/student.entity';
import { Repository } from 'typeorm';

@Processor('batch-assign')
export class BatchProcessor {
  constructor(
    @InjectRepository(StudentProfileEntity)
    private studentRepo: Repository<StudentProfileEntity>,
  ) {}

  @Process('assign')
  async handel(job: Job) {
    try {
      const { batchId, studentId } = job.data;
      await this.studentRepo.update(
        { uuid: studentId },
        {
          batch_id: batchId,
          is_batch_assign: true,
        },
      );
      console.log("assign")
    } catch (error) {
      console.log(error, 'assign queue error');
    }
  }
}
