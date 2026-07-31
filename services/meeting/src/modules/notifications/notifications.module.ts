import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email.service';
import { WhatsAppService } from './whatsapp.service';
import { NotificationLog } from '../../database/entities/notification-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationLog])],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService, WhatsAppService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
