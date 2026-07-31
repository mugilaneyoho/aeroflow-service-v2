import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotificationLog,
  NotificationType,
  NotificationStatus,
} from '../../database/entities/notification-log.entity';
import { Meeting } from '../../database/entities/meeting.entity';
import { EmailService } from './email.service';
import { WhatsAppService } from './whatsapp.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationLog)
    private readonly logRepository: Repository<NotificationLog>,
    private readonly emailService: EmailService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  async dispatchMeetingApprovalNotifications(meeting: Meeting) {
    // 1. Send Email Notification
    const emailRes = await this.emailService.sendMeetingConfirmation(
      meeting.visitorEmail,
      meeting.visitorName,
      meeting.meetingDate,
      meeting.meetingTime,
      meeting.meetingPurpose,
    );

    const emailLog = this.logRepository.create({
      meetingId: meeting.id,
      type: NotificationType.EMAIL,
      recipient: meeting.visitorEmail,
      status: emailRes.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
      response: emailRes.error ? emailRes.error : JSON.stringify(emailRes),
    });
    await this.logRepository.save(emailLog);

    // 2. Send WhatsApp Notification
    const waRes = await this.whatsAppService.sendMeetingConfirmationWhatsApp(
      meeting.visitorPhone,
      meeting.visitorName,
      meeting.meetingDate,
      meeting.meetingTime,
      meeting.meetingPurpose,
    );

    const waLog = this.logRepository.create({
      meetingId: meeting.id,
      type: NotificationType.WHATSAPP,
      recipient: meeting.visitorPhone,
      status: waRes.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
      response: waRes.error ? waRes.error : JSON.stringify(waRes),
    });
    await this.logRepository.save(waLog);

    return { emailLog, waLog };
  }

  async getAllLogs(): Promise<NotificationLog[]> {
    return this.logRepository.find({
      relations: ['meeting'],
      order: { sentAt: 'DESC' },
    });
  }

  async retryNotification(logId: string) {
    const log = await this.logRepository.findOne({ where: { id: logId }, relations: ['meeting'] });
    if (!log || !log.meeting) {
      throw new Error('Notification log or associated meeting record not found');
    }

    if (log.type === NotificationType.EMAIL) {
      const res = await this.emailService.sendMeetingConfirmation(
        log.meeting.visitorEmail,
        log.meeting.visitorName,
        log.meeting.meetingDate,
        log.meeting.meetingTime,
        log.meeting.meetingPurpose,
      );
      log.status = res.success ? NotificationStatus.SENT : NotificationStatus.FAILED;
      log.response = res.error || JSON.stringify(res);
    } else {
      const res = await this.whatsAppService.sendMeetingConfirmationWhatsApp(
        log.meeting.visitorPhone,
        log.meeting.visitorName,
        log.meeting.meetingDate,
        log.meeting.meetingTime,
        log.meeting.meetingPurpose,
      );
      log.status = res.success ? NotificationStatus.SENT : NotificationStatus.FAILED;
      log.response = res.error || JSON.stringify(res);
    }

    return this.logRepository.save(log);
  }
}
