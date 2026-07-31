import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meeting, MeetingStatus } from '../../database/entities/meeting.entity';
import { WorkSchedule } from '../../database/entities/work-schedule.entity';
import { CreateMeetingDto, ApproveRejectMeetingDto } from './dto/create-meeting.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(WorkSchedule)
    private readonly scheduleRepository: Repository<WorkSchedule>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(receptionistId: string, dto: CreateMeetingDto): Promise<Meeting> {
    // 1. Verify schedule exists and date matches
    const schedule = await this.scheduleRepository.findOne({
      where: { id: dto.scheduleId },
      relations: ['meetings'],
    });

    if (!schedule) {
      throw new NotFoundException(`Work schedule with ID "${dto.scheduleId}" not found`);
    }

    if (!schedule.isAvailable) {
      throw new BadRequestException(`Master Admin schedule for ${schedule.workDate} is marked as unavailable`);
    }

    if (schedule.workDate !== dto.meetingDate) {
      throw new BadRequestException(
        `Selected date ${dto.meetingDate} does not match schedule date ${schedule.workDate}`,
      );
    }

    // 2. Validate double booking / capacity limits
    const existingSlotMeetings = schedule.meetings.filter(
      (m) => m.meetingTime === dto.meetingTime && m.status !== MeetingStatus.REJECTED,
    );

    if (existingSlotMeetings.length >= schedule.maxMeetingsPerSlot) {
      throw new ConflictException(
        `Time slot ${dto.meetingTime} has reached maximum capacity (${schedule.maxMeetingsPerSlot})`,
      );
    }

    const meeting = this.meetingRepository.create({
      ...dto,
      receptionistId,
      status: MeetingStatus.PENDING,
    });

    return this.meetingRepository.save(meeting);
  }

  async findAll(status?: MeetingStatus, date?: string): Promise<Meeting[]> {
    const query = this.meetingRepository
      .createQueryBuilder('meeting')
      .leftJoinAndSelect('meeting.schedule', 'schedule')
      .leftJoinAndSelect('meeting.notificationLogs', 'notificationLogs')
      .orderBy('meeting.createdAt', 'DESC');

    if (status) {
      query.andWhere('meeting.status = :status', { status });
    }

    if (date) {
      query.andWhere('meeting.meetingDate = :date', { date });
    }

    return query.getMany();
  }

  async findPending(): Promise<Meeting[]> {
    return this.findAll(MeetingStatus.PENDING);
  }

  async findToday(): Promise<Meeting[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.findAll(undefined, today);
  }

  async findOne(id: string): Promise<Meeting> {
    const meeting = await this.meetingRepository.findOne({
      where: { id },
      relations: ['schedule', 'notificationLogs'],
    });

    if (!meeting) {
      throw new NotFoundException(`Meeting with ID "${id}" not found`);
    }

    return meeting;
  }

  async approve(id: string, adminId: string, dto: ApproveRejectMeetingDto): Promise<Meeting> {
    const meeting = await this.findOne(id);

    if (meeting.status === MeetingStatus.APPROVED || meeting.status === MeetingStatus.CONFIRMED) {
      throw new BadRequestException('Meeting is already approved');
    }

    meeting.status = MeetingStatus.CONFIRMED; // Sets to CONFIRMED upon approval
    meeting.adminRemarks = dto.adminRemarks || 'Approved by Master Admin';
    meeting.approvedBy = adminId;
    meeting.approvedAt = new Date();

    const saved = await this.meetingRepository.save(meeting);

    // Trigger WhatsApp & Email notifications asynchronously
    await this.notificationsService.dispatchMeetingApprovalNotifications(saved);

    return this.findOne(id);
  }

  async reject(id: string, adminId: string, dto: ApproveRejectMeetingDto): Promise<Meeting> {
    const meeting = await this.findOne(id);

    meeting.status = MeetingStatus.REJECTED;
    meeting.adminRemarks = dto.adminRemarks || 'Rejected by Master Admin';
    meeting.approvedBy = adminId;
    meeting.approvedAt = new Date();

    return this.meetingRepository.save(meeting);
  }

  async getDashboardAnalytics() {
    const todayStr = new Date().toISOString().split('T')[0];

    const allMeetings = await this.meetingRepository.find();
    const todayMeetings = allMeetings.filter((m) => m.meetingDate === todayStr);

    const pendingCount = allMeetings.filter((m) => m.status === MeetingStatus.PENDING).length;
    const confirmedCount = allMeetings.filter(
      (m) => m.status === MeetingStatus.CONFIRMED || m.status === MeetingStatus.APPROVED,
    ).length;
    const rejectedCount = allMeetings.filter((m) => m.status === MeetingStatus.REJECTED).length;

    const upcomingMeetings = allMeetings.filter(
      (m) => m.meetingDate >= todayStr && (m.status === MeetingStatus.CONFIRMED || m.status === MeetingStatus.PENDING),
    );

    const totalSlotsUsed = confirmedCount + pendingCount;
    const utilizationRate = Math.min(100, Math.round((totalSlotsUsed / (allMeetings.length || 1)) * 100));

    return {
      todayTotalMeetings: todayMeetings.length,
      pendingApprovals: pendingCount,
      confirmedMeetings: confirmedCount,
      rejectedMeetings: rejectedCount,
      upcomingMeetingsCount: upcomingMeetings.length,
      scheduleUtilizationPercent: utilizationRate,
      statusBreakdown: [
        { name: 'Pending', count: pendingCount, color: '#EA580C' },
        { name: 'Confirmed', count: confirmedCount, color: '#16A34A' },
        { name: 'Rejected', count: rejectedCount, color: '#DC2626' },
      ],
    };
  }
}
