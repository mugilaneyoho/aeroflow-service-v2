import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
  Index,
} from 'typeorm';

export enum LeadStatus {
  NEW = 'NEW',
  WAITING = 'WAITING',
  REJECTED = 'REJECTED',
  INTERESTED = 'INTERESTED',
  ADMITTED = 'ADMITTED',
}

@Entity('leads')
export class LeadsHistoryEntity {
  @Column({ unique: true })
  @Generated('increment')
  id: number;

  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column()
  name: string;

  @Index()
  @Column()
  phone: string;

  @Index()
  @Column({
    type: 'enum',
    enum: LeadStatus,
    default: LeadStatus.NEW,
  })
  status: LeadStatus;

  @Index()
  @Column({ type: 'char', length: 36, nullable: true })
  assignedTo: string;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt: Date;
}
