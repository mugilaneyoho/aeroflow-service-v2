import * as Sentry from '@sentry/nestjs';
import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Meeting } from './entities/meeting.entity';
import { Repository, In } from 'typeorm';

@Injectable()
export class MeetingsService implements OnModuleInit {
  private notifiedOverdue = new Set<number>();
  private notifiedReached = new Set<number>();

  constructor(
    @InjectRepository(Meeting)
    private meetingsRepository: Repository<Meeting>,
  ) {}

  onModuleInit() {
    // Run every 60 seconds
    setInterval(() => {
      this.checkMeetingDeadlines();
    }, 60000);
  }

  async sendNotification(payload: {
    title: string;
    message: string;
    role: string;
    type: string;
    priority: string;
  }) {
    try {
      const response = await fetch('http://localhost:3010/notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: payload.title,
          message: payload.message,
          Role: payload.role,
          type: payload.type,
          priority: payload.priority,
          userId: '00000000-0000-0000-0000-000000000000',
        }),
      });
      if (!response.ok) {
        console.error(`Failed to send notification: ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  }

  async checkMeetingDeadlines() {
    try {
      const now = new Date();
      // Fetch all Pending or Approved meetings
      const activeMeetings = await this.meetingsRepository.find({
        where: [
          { status: 'Pending' },
          { status: 'pending' },
          { status: 'Approved' },
          { status: 'approved' }
        ]
      });

      for (const meeting of activeMeetings) {
        if (!meeting.date || !meeting.requestedTime) continue;
        const [year, month, day] = meeting.date.split('-').map(Number);
        const [hours, minutes] = meeting.requestedTime.split(':').map(Number);
        if (!year || !hours) continue;

        const meetingTime = new Date(year, month - 1, day, hours, minutes);
        
        // 1. Reached
        if (now >= meetingTime && !this.notifiedReached.has(meeting.id)) {
          const diffMinutes = (now.getTime() - meetingTime.getTime()) / 60000;
          if (diffMinutes >= 0 && diffMinutes <= 15) {
            this.notifiedReached.add(meeting.id);
            await this.sendNotification({
              title: 'Meeting Started',
              message: `The scheduled meeting with ${meeting.visitor} (ID: ${meeting.meetingId}) has reached its time.`,
              role: 'RECEPTION',
              type: 'INFO',
              priority: 'HIGH'
            });
            await this.sendNotification({
              title: 'Meeting Started',
              message: `The scheduled meeting with ${meeting.visitor} (ID: ${meeting.meetingId}) has reached its time.`,
              role: 'MASTER',
              type: 'INFO',
              priority: 'HIGH'
            });
          }
        }

        // 2. Overdue
        if (!this.notifiedOverdue.has(meeting.id)) {
          const diffMinutes = (now.getTime() - meetingTime.getTime()) / 60000;
          if (diffMinutes > 15) {
            this.notifiedOverdue.add(meeting.id);
            await this.sendNotification({
              title: 'Meeting Overdue',
              message: `Meeting with ${meeting.visitor} (ID: ${meeting.meetingId}) is overdue by ${Math.round(diffMinutes)} minutes.`,
              role: 'RECEPTION',
              type: 'DUE_AMOUNT',
              priority: 'MEDIUM'
            });
            await this.sendNotification({
              title: 'Meeting Overdue',
              message: `Meeting with ${meeting.visitor} (ID: ${meeting.meetingId}) is overdue by ${Math.round(diffMinutes)} minutes.`,
              role: 'MASTER',
              type: 'DUE_AMOUNT',
              priority: 'MEDIUM'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking deadlines:', error);
    }
  }

  async create(createMeetingDto: CreateMeetingDto) {
    const newMeeting = this.meetingsRepository.create({ ...createMeetingDto });
    const saved = await this.meetingsRepository.save(newMeeting);
    try {
      await this.sendNotification({
        title: 'New Meeting Request',
        message: `A new meeting request has been submitted for ${saved.visitor}.`,
        role: 'MASTER',
        type: 'PENDING',
        priority: 'MEDIUM'
      });
    } catch (err) {
      console.error(err);
    }
    return saved;
  }

  async findAll(status: string, page?: number, limit?: number) {
    const statusLower = status ? status.toLowerCase() : 'all';
    
    let targetStatuses: string[] = [];
    let isAll = false;
    if (statusLower === 'all') {
      isAll = true;
    } else if (statusLower === 'completed') {
      targetStatuses = ['Completed', 'completed'];
    } else if (statusLower === 'ongoing') {
      targetStatuses = ['Ongoing', 'ongoing'];
    } else if (statusLower === 'upcoming') {
      targetStatuses = ['Pending', 'pending', 'Approved', 'approved'];
    } else if (statusLower === 'rejected') {
      targetStatuses = ['Rejected', 'rejected', 'Reject', 'reject'];
    } else {
      const capitalized = status.charAt(0).toUpperCase() + status.slice(1);
      targetStatuses = [status, statusLower, capitalized];
    }

    const whereCondition = isAll ? {} : { status: In(targetStatuses) };

    if (page !== undefined && limit !== undefined) {
      const skip = (page - 1) * limit;
      const [data, total] = await this.meetingsRepository.findAndCount({
        where: whereCondition,
        order: { createdAt: 'DESC' },
        skip,
        take: limit
      });
      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } else {
      return await this.meetingsRepository.find({
        where: whereCondition,
        order: { createdAt: 'DESC' }
      });
    }
  }

  async update(id: number, updateData: Partial<Meeting>) {
    const original = await this.meetingsRepository.findOne({ where: { id } });
    const result = await this.meetingsRepository.update(id, updateData);
    
    if (original && updateData.status) {
      const oldStatus = original.status?.toLowerCase();
      const newStatus = updateData.status.toLowerCase();
      
      if (oldStatus !== newStatus) {
        if (newStatus === 'ongoing' || newStatus === 'approved') {
          await this.sendNotification({
            title: 'Meeting Approved',
            message: `Meeting request with ${original.visitor} has been approved.`,
            role: 'RECEPTION',
            type: 'SUCCESS',
            priority: 'HIGH'
          });
        } else if (newStatus === 'rejected') {
          const remarks = updateData.remarks || 'No remarks provided.';
          await this.sendNotification({
            title: 'Meeting Rejected',
            message: `Meeting request with ${original.visitor} has been rejected. Remarks: ${remarks}`,
            role: 'RECEPTION',
            type: 'DUE_AMOUNT',
            priority: 'HIGH'
          });
        } else if (newStatus === 'pending' && (oldStatus === 'rejected' || oldStatus === 'reject')) {
          await this.sendNotification({
            title: 'Meeting Rescheduled',
            message: `Meeting request for ${original.visitor} has been rescheduled and awaits review.`,
            role: 'MASTER',
            type: 'PENDING',
            priority: 'MEDIUM'
          });
        }
      }
    }
    return result;
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
