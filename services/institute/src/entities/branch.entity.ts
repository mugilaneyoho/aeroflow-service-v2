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
import { CourseEntity } from './course.entity';
import { BatchEntity } from './batch.entity';

@Entity('branch')
@Index(['uuid', 'branch_name', 'email'])
export class BranchEntity {
  @Column({ unique: true })
  @Generated('increment')
  id!: number;

  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column('uuid')
  institute_id!: string;

  @ManyToOne(() => InstituteEntity, (institute) => institute.branches)
  @JoinColumn({ name: 'institute_id' })
  institute!: InstituteEntity;

  @Column({ length: 191 })
  branch_name!: string;

  @Column({ length: 20 })
  phone_number!: string;

  @Column({ length: 191 })
  email!: string;

  @Column({ length: 255 })
  address!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  // @OneToMany(() => CourseEntity, (course) => course.branch)
  // courses!: CourseEntity[];

  // @OneToMany(() => BatchEntity, (batch) => batch.branch)
  // batches!: BatchEntity[];
}
