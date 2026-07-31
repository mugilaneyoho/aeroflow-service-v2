import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { WorkSchedule } from './work-schedule.entity';
import { NotificationLog } from './notification-log.entity';

export enum MeetingStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONFIRMED = 'CONFIRMED',
}

@Entity('meetings')
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  receptionistId: string;

  // @ManyToOne(() => User, (user) => user.createdMeetings, { onDelete: 'SET NULL' })
  // @JoinColumn({ name: 'receptionistId' })
  // receptionist: User;

  @Column({ type: 'uuid' })
  scheduleId: string;

  @ManyToOne(() => WorkSchedule, (schedule) => schedule.meetings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scheduleId' })
  schedule: WorkSchedule;

  @Column({ type: 'varchar', length: 150 })
  visitorName: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  visitorCompany: string;

  @Column({ type: 'varchar', length: 30 })
  visitorPhone: string;

  @Column({ type: 'varchar', length: 150 })
  visitorEmail: string;

  @Column({ type: 'text' })
  meetingPurpose: string;

  @Column({ type: 'date' })
  meetingDate: string; // YYYY-MM-DD

  @Column({ type: 'varchar', length: 10 })
  meetingTime: string; // HH:mm

  @Column({
    type: 'enum',
    enum: MeetingStatus,
    default: MeetingStatus.PENDING,
  })
  status: MeetingStatus;

  @Column({ type: 'text', nullable: true })
  adminRemarks: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => NotificationLog, (log) => log.meeting)
  notificationLogs: NotificationLog[];
}
