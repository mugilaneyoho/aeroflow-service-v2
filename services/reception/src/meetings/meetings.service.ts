import { Injectable } from '@nestjs/common';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Meeting } from './entities/meeting.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MeetingsService {

  constructor(
    @InjectRepository(Meeting)
    private meetingsRepository: Repository<Meeting>,
  ) { }

  async create(createMeetingDto: CreateMeetingDto) {
    const newMeeting = this.meetingsRepository.create({ ...createMeetingDto })
    return await this.meetingsRepository.save(newMeeting);
  }

  async findAll() {
    return await this.meetingsRepository.find();
  }

  async update(id: number, updateData: Partial<Meeting>) {
    return await this.meetingsRepository.update(id, updateData);
  }

}
