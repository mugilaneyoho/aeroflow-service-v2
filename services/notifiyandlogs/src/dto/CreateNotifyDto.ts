import { IsEnum, IsNotEmpty, IsNumber, IsString, IsUUID } from "class-validator";
import { NotificationType, NotificationPriority, NotificationRole } from "../entity/notify"


export class CreateNotifyDto{
    @IsString()
    @IsNotEmpty()
    title: string

    @IsString()
    @IsNotEmpty()
    message: string

    @IsUUID()
    userId: string

    @IsEnum(NotificationType)
    type: NotificationType

    @IsEnum(NotificationPriority)
    priority: NotificationPriority

    @IsEnum(NotificationRole)
    Role: NotificationRole

}