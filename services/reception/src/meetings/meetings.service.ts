import * as Sentry from '@sentry/nestjs';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Meeting } from './entities/meeting.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meeting)
    private meetingsRepository: Repository<Meeting>,
  ) {}

  async create(createMeetingDto: CreateMeetingDto) {
    const newMeeting = this.meetingsRepository.create({ ...createMeetingDto });
    return await this.meetingsRepository.save(newMeeting);
  }

  async findAll(status: string) {
    if (status === 'all') {
      return await this.meetingsRepository.find({order: {createdAt: 'DESC'}});
    } else {
      return await this.meetingsRepository.find({
        where: { status: status === 'completed' ? 'completed' : 'pending' },
      });
    }
  }

  async update(id: number, updateData: Partial<Meeting>) {
    return await this.meetingsRepository.update(id, updateData);
  }

  async MeetingCount() {
    try {
      const MeetingCount = await this.meetingsRepository.count();

      const meeting = await this.meetingsRepository.find();
      return {
        data: {
          meeting,
          MeetingCount,
        },
      };
    } catch (error) {
      Sentry.captureException(error);
      console.log(error);
      return new InternalServerErrorException();
    }
  }
}
