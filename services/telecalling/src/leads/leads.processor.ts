import * as Sentry from '@sentry/nestjs';
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Process, Processor } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import type { Job } from 'bull';
import { LeadsEntity } from 'src/entities/leads.entity';
import { Repository } from 'typeorm';

@Processor('lead-assign')
export class LeadProcessor {
  constructor(
    @InjectRepository(LeadsEntity)
    private leadsRepo: Repository<LeadsEntity>,
  ) {}

  @Process('assign')
  async handel(job: Job) {
    try {
      const { id, limit } = job.data;
      await this.leadsRepo.query(
        `WITH selected AS (
          SELECT id
          FROM leads
          WHERE "assignedTo" IS NULL
          LIMIT $2
        )
        UPDATE leads
        SET "assignedTo" = $1,
            "assignedAt" = CURRENT_TIMESTAMP,
            status = 'ASSIGNED'
        WHERE id IN (SELECT id FROM selected)
        `,
        [id, Number(limit)],
      );
      // await this.leadsRepo.query(
      //   `UPDATE leads
      //   SET assignedTo = ?,
      //       assignedAt = NOW(),
      //       status = 'ASSIGNED'
      //   WHERE id IN (
      //     SELECT id FROM (
      //       SELECT id
      //       FROM leads
      //       WHERE assignedTo IS NULL
      //       LIMIT ?
      //     ) AS temp
      //   )`,
      //   [id, Number(limit)],
      // );
    } catch (error) {
      Sentry.captureException(error);
      console.log(error, 'assign queue error');
    }
  }
}
