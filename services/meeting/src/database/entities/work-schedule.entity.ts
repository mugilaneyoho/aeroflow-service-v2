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
import { Meeting } from './meeting.entity';

@Entity('work_schedules')
export class WorkSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  adminId: string;

  // @ManyToOne(() => User, (user) => user.schedules, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'adminId' })
  // admin: User;

  @Column({ type: 'date' })
  workDate: string; // YYYY-MM-DD

  @Column({ type: 'varchar', length: 10 })
  startTime: string; // HH:mm (e.g. "09:00")

  @Column({ type: 'varchar', length: 10 })
  endTime: string; // HH:mm (e.g. "17:00")

  @Column({ type: 'varchar', length: 10, nullable: true })
  breakStart: string; // HH:mm (e.g. "13:00")

  @Column({ type: 'varchar', length: 10, nullable: true })
  breakEnd: string; // HH:mm (e.g. "14:00")

  @Column({ type: 'int', default: 2 })
  maxMeetingsPerSlot: number;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Meeting, (meeting) => meeting.schedule)
  meetings: Meeting[];
}
