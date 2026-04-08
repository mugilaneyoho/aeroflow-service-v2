import {
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  Generated,
} from 'typeorm';
import { CourseEntity } from './course.entity';
import { BatchEntity } from './batch.entity';
import { BranchEntity } from './branch.entity';

@Entity('institute')
export class InstituteEntity {
  @Column({ unique: true })
  @Generated('increment')
  id!: number;

  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column({ length: 191 })
  institute_name!: string;

  @Column({ length: 20 })
  phone_number!: string;

  @Column({ length: 191 })
  email!: string;

  @Column({ length: 191 })
  logo!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => BranchEntity, (branch) => branch.institute)
  branches!: BranchEntity[];

  // @OneToMany(() => CourseEntity, (course) => course.institute)
  // courses!: CourseEntity[];

  // @OneToMany(() => BatchEntity, (batch) => batch.institute)
  // batches!: BatchEntity[];
}
