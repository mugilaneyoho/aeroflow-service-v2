import {
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
  Generated,
} from 'typeorm';
import { InstituteEntity } from './institute.entity';
import { BranchEntity } from './branch.entity';
import { CourseEntity } from './course.entity';
import { StudentProfileEntity } from './student.entity';

export enum BatchMode {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

@Entity('batch')
@Index(['batchName', 'courseId', 'uuid'])
@Index(['isDelete'])
export class BatchEntity {
  @Column({ unique: true })
  @Generated('increment')
  id!: number;

  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column({ type: 'uuid' })
  courseId!: string;
  @ManyToOne(() => CourseEntity, (course) => course.batches)
  @JoinColumn({ name: 'courseId' })
  course!: CourseEntity;

  @Column({ type: 'varchar', length: 191 })
  batchName!: string;

  @Column({ type: 'enum', enum: BatchMode, default: BatchMode.OFFLINE })
  batchMode!: BatchMode;

  @Column({ type: 'varchar', length: 191 })
  batchCode!: string;

  @Column({ default: 0 })
  seatsFilled!: number;

  @Column({ type: 'integer' })
  totalSeats!: number;

  @Column({ type: 'timestamptz', nullable: true })
  startDate!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endDate!: Date;

  @Column({ type: 'integer' })
  duration!: number;

  @Column({ type: 'varchar', length: 50 })
  durationType!: string;

  @Column({ type: 'varchar', length: 50 })
  classStartTime!: string;

  @Column({ type: 'varchar', length: 50 })
  classEndTime!: string;

  @Column({ type: 'boolean', default: false })
  isDelete!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => StudentProfileEntity, (student) => student.batch)
  students!: StudentProfileEntity[];
}
