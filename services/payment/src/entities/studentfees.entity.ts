import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Generated,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PaymentEntiry } from './payment.entity';

@Entity('StudentFees')
export class StudentFeesEntity {
  @Column({ unique: true })
  @Generated('increment')
  id!: number;

  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column('uuid')
  studentId!: string;

  @Column()
  admissionFeesPay!: boolean;

  @Column()
  admissionFeesAmount!: number;

  @Column({ type: 'uuid', nullable: true })
  admissionFeesId!: string;

  @Column({ default: 0 })
  totalFees!: number;

  @Column({ default: 0 })
  paidAmount!: number;

  @Column()
  lastPaidDate!: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => PaymentEntiry, (payment) => payment.studentFeesId)
  payments!: PaymentEntiry[];
}
