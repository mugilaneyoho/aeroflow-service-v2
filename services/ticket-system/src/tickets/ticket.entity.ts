import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { roles } from './auth/roles.enum';

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  senderId!: string;

  @Column()
  senderRole!: roles;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column({ default: 'open' })
  status!: string;

  @Column({ default: 'medium' })
  priority!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({
    type: 'enum',
    enum: roles,
    default: roles.MASTER,
  })
  assignedToRole!: roles;
}
