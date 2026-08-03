import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkSchedule } from '../../database/entities/work-schedule.entity';
import { Meeting, MeetingStatus } from '../../database/entities/meeting.entity';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/create-schedule.dto';

export interface AvailableSlotInfo {
  time: string; // e.g. "09:00"
  available: boolean;
  bookedCount: number;
  maxCapacity: number;
}

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(WorkSchedule)
    private readonly scheduleRepository: Repository<WorkSchedule>,
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
  ) {}

  async create(dto: CreateScheduleDto): Promise<WorkSchedule> {
    try {   

      const existing = await this.scheduleRepository.findOne({
        where: { workDate: dto.workDate },
      });
  
      if (existing) {
        throw new ConflictException(`Work schedule for date ${dto.workDate} already exists`);
      }
  
      const schedule = this.scheduleRepository.create({
        ...dto,
      });
  
      return this.scheduleRepository.save(schedule);
    } catch (error) {
      console.log(error)
      throw new InternalServerErrorException(error)
    }
  }

  async findAll(): Promise<WorkSchedule[]> {
    return this.scheduleRepository.find({
      relations: [ 'meetings'],
      order: { workDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<WorkSchedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: [ 'meetings'],
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID "${id}" not found`);
    }

    return schedule;
  }

  async getAvailableSlots(date?: string): Promise<{ schedule: WorkSchedule | null; slots: AvailableSlotInfo[] }> {
    const queryDate = date || new Date().toISOString().split('T')[0];
    const schedule = await this.scheduleRepository.findOne({
      where: { workDate: queryDate, isAvailable: true },
      relations: ['meetings'],
    });

    if (!schedule) {
      return { schedule: null, slots: [] };
    }

    const slots: AvailableSlotInfo[] = [];
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);

    let breakStartMins = -1;
    let breakEndMins = -1;
    if (schedule.breakStart && schedule.breakEnd) {
      const [bsH, bsM] = schedule.breakStart.split(':').map(Number);
      const [beH, beM] = schedule.breakEnd.split(':').map(Number);
      breakStartMins = bsH * 60 + bsM;
      breakEndMins = beH * 60 + beM;
    }

    let currentMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    // 30-minute interval slots
    while (currentMins < endMins) {
      const h = Math.floor(currentMins / 60);
      const m = currentMins % 60;
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

      // Check if slot falls in break time
      const isBreak = currentMins >= breakStartMins && currentMins < breakEndMins;

      if (!isBreak) {
        // Count active meetings (APPROVED or PENDING or CONFIRMED)
        const bookedCount = schedule.meetings.filter(
          (m) => m.meetingTime === timeStr && m.status !== MeetingStatus.REJECTED,
        ).length;

        const available = bookedCount < schedule.maxMeetingsPerSlot;
        slots.push({
          time: timeStr,
          available,
          bookedCount,
          maxCapacity: schedule.maxMeetingsPerSlot,
        });
      }

      currentMins += 30; // 30 min intervals
    }

    return { schedule, slots };
  }

  async update(id: string, dto: UpdateScheduleDto): Promise<WorkSchedule> {
    const schedule = await this.findOne(id);
    Object.assign(schedule, dto);
    return this.scheduleRepository.save(schedule);
  }

  async remove(id: string): Promise<void> {
    const schedule = await this.findOne(id);
    await this.scheduleRepository.remove(schedule);
  }
}
