import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  Generated,
  OneToMany,
} from 'typeorm';
import { StatusRecordEntity } from './statusrecord.entity';

@Entity('attendance')
export class AttendanceEntity {
  @Column({ unique: true })
  @Generated('increment')
  id!: number;

  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column('uuid')
  classId!: string;

  @Column('uuid')
  staffId!: string;

  @Column({ type: 'timestamp' })
  date!: Date;

  @Column()
  present_count!: number;

  @Column()
  absent_count!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => StatusRecordEntity, (record) => record.attendance)
  records!: StatusRecordEntity[];
}
