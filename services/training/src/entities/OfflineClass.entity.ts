import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StaffProfileEntity } from './staff.entity';

@Entity('offlineclasses')
export class OfflineClassesEntity {
  @Column({ unique: true })
  @Generated('increment')
  id!: number;

  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column({ type: 'uuid' })
  batch_id!: string;

  @Column({ type: 'uuid' })
  staff_id!: string;
  @ManyToOne(() => StaffProfileEntity, (staff) => staff.offline_class)
  @JoinColumn({ name: 'staff_id' })
  staff!: StaffProfileEntity;

  @Column()
  subject!: string;

  @Column({ type: 'text', nullable: true })
  location!: string;

  @Column({ type: 'simple-array', nullable: true })
  notes!: string[];

  @Column({ type: 'timestamptz' })
  start_date!: Date;

  @Column({ type: 'timestamptz' })
  start_time!: Date;

  @Column({ type: 'timestamptz' })
  end_time!: Date;

  @Column()
  batch_name!: string;

  @Column({ type: 'varchar', length: 10, default: 'offline' })
  class_mode!: string;

  @Column({ type: 'integer', default: 0 })
  total_student!: number;

  @Column({ type: 'integer', default: 0 })
  present_student!: number;

  @Column({ type: 'boolean', default: false })
  attendance!: boolean;

  @Column({ type: 'boolean', default: false })
  is_delete!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
