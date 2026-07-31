import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { WorkSchedule } from '../../database/entities/work-schedule.entity';
import { Meeting } from '../../database/entities/meeting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkSchedule, Meeting])],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
