import { IsEnum, IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';
import {
  NotificationType,
  NotificationPriority,
  NotificationRole,
} from '../entity/notify';

export class CreateNotifyDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsEnum(NotificationPriority)
  priority!: NotificationPriority;

  @IsEnum(NotificationRole)
  Role!: NotificationRole;
}
