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
import { StudentFeesEntity } from './studentfees.entity';

export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentPerpose {
  ADMISSIONFEE = 'ADMISSIONFEE',
  COURSEFEE = 'COURSEFEE',
  OTHERFEE = 'OTHERFEE',
}

@Entity('payment')
export class PaymentEntiry {
  @Column({ unique: true })
  @Generated('increment')
  id!: number;

  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column('uuid')
  studentFeesId!: string;
  @ManyToOne(() => StudentFeesEntity, (fees) => fees.payments)
  @JoinColumn({ name: 'studentFeesId' })
  studentFees!: StudentFeesEntity;

  @Column({ type: 'text', nullable: true })
  phoneNumber!: string;

  @Column()
  amount!: number;

  @Column({ type: 'datetime' })
  paymentDate!: Date;

  @Column()
  paymentMode!: string;

  @Column()
  receiptNumber!: string;

  @Column()
  transactionId!: string;

  @Column({ nullable: true })
  collectedBy!: string;

  @Column('uuid')
  studentId!: string;

  @Column()
  studentName!: string;

  @Column()
  notes!: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentPerpose,
    default: PaymentPerpose.COURSEFEE,
  })
  paymentPerpose!: PaymentPerpose;

  @Column({ default: '' })
  razorOrderId!: string;

  @Column({ default: '' })
  razorPaymentId!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
