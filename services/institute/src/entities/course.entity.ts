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
import { BatchEntity } from './batch.entity';
import { StudentProfileEntity } from './student.entity';

@Entity('course')
@Index(['uuid', 'course_name'])
@Index(['is_delete'])
export class CourseEntity {
  @Column({ unique: true })
  @Generated('increment')
  id!: number;

  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column({ length: 191 })
  course_name!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ length: 191 })
  thumbnail!: string;

  @Column({ nullable: true })
  total_batches!: number;

  @Column()
  price!: number;

  @Column({ type: 'boolean', default: false })
  is_delete!: boolean;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => BatchEntity, (batch) => batch.course)
  batches!: BatchEntity[];

  @OneToMany(() => StudentProfileEntity, (student) => student.course_id)
  students!: StudentProfileEntity[];
}
