import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { EmployeEntity } from './employee.entity';

export enum LeadStatus {
  NEW = 'NEW',
  WAITING = 'WAITING',
  REJECTED = 'REJECTED',
  INTERESTED = 'INTERESTED',
  ADMITTED = 'ADMITTED',
  ASSIGNED = 'ASSIGNED',
}

@Entity('leads')
export class LeadsEntity {
  @Column({ unique: true })
  @Generated('increment')
  id!: number;

  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column({ nullable: true })
  name!: string;

  @Index()
  @Column()
  phone!: string;

  @Column({ nullable: true })
  notes!: string;

  @Index()
  @Column({
    type: 'enum',
    enum: LeadStatus,
    default: LeadStatus.NEW,
  })
  status!: LeadStatus;

  @Column({ type: 'uuid', nullable: true })
  batch_id!: string;

  @Column({ type: 'text', nullable: true })
  course_name!: string;

  @Column({ type: 'uuid', nullable: true })
  student_id!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  assignedTo!: string;
  @ManyToOne(() => EmployeEntity, (emp) => emp.leads)
  @JoinColumn({ name: 'assignedTo' })
  employee!: EmployeEntity;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt!: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt!: Date;
}
