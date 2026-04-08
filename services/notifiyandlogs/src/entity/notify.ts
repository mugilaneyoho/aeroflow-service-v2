import { IsUUID } from "class-validator";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum NotificationType{
    INFO = 'INFO',
    SUCCESS = 'SUCCESS',
    PENDING = 'PENDING',
    DUE_AMOUNT = 'DUE_AMOUNT'
}

export enum NotificationPriority{
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH'
}

export enum NotificationRole {
    ADMIN = 'ADMIN',
    STUDENT = 'STUDENT',
    PAYMENT = 'PAYMENT',
    TELECALLING = 'TELECALLING',
    
}


@Entity('notification')
export class NotificationEntity{
    @PrimaryGeneratedColumn('uuid')
    uuid:string

    @Column()
    title: string

    @Column()
    message: string

    @IsUUID()
    userId: string

    @Column({type:'enum', enum:NotificationType, default:NotificationType.INFO})
    type: NotificationType
    
    @Column({type: 'enum',enum: NotificationRole, default:NotificationRole.PAYMENT})
    Role: NotificationRole
    
    @Column({ type: 'enum', enum: NotificationPriority, default: NotificationPriority.MEDIUM })
    priority: NotificationPriority;

    @Column({default:false})
    isRead: boolean

    @CreateDateColumn()
    CreateAt: Date

    @UpdateDateColumn()
    UpdateAt: Date


}