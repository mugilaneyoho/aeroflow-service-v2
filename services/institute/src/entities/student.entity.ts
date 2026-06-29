import {
  Entity,
  Column,
  Generated,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CourseEntity } from './course.entity';
import { BatchEntity } from './batch.entity';

@Entity('student_profile')
export class StudentProfileEntity {
  @Column({ unique: true })
  @Generated('increment')
  id!: number;

  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column('uuid')
  course_id!: string;
  @ManyToOne(() => CourseEntity, (course) => course.students)
  @JoinColumn({ name: 'course_id' })
  course!: CourseEntity;

  @Column({ type: 'uuid', nullable: true })
  batch_id!: string;
  @ManyToOne(() => BatchEntity, (batch) => batch.students, { nullable: true })
  @JoinColumn({ name: 'batch_id' })
  batch!: BatchEntity | null;

  @Column('uuid')
  admittedBy!: string;

  @Column({ type: 'uuid', nullable: true })
  leadId!: string;

  @Column({ length: 191 })
  student_name!: string;

  @Column({ length: 50 })
  student_id!: string;

  @Column({ length: 191 })
  email!: string;

  @Column({ length: 20 })
  phone_number!: string;

  @Column({ length: 20, nullable: true })
  parent_number!: string;

  @Column({ length: 191, nullable: false, default: '' })
  father_name!: string;

  @Column({ length: 191, nullable: false, default: '' })
  mother_name!: string;

  @Column({ type: 'timestamp', nullable: false, default: () => 'CURRENT_DATE' })
  dob!: Date;

  @Column({ length: 10 })
  gender!: string;

  @Column({ type: 'text', nullable: false, default: '' })
  currentAddress!: string;

  @Column({ type: 'text', nullable: false, default: '' })
  permantAddress!: string;

  @Column({ length: 100 })
  qualification!: string;

  @Column({ type: 'timestamp' })
  admission_date!: Date;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'boolean', default: false })
  is_delete!: boolean;

  @Column({ default: false })
  is_eligible_placement!: boolean;

  @Column({ default: false })
  is_approved!: boolean;

  @Column({ default: false })
  is_batch_assign!: boolean;

  @Column({ default: 'offline' })
  course_mode!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @Column({ type: 'text', array: true, nullable: true })
  preferredLocations?: string[];

  @Column({ default: false })
  is_no_due!: boolean;
}
