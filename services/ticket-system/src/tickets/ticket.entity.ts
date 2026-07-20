import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { roles } from './auth/roles.enum';

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  senderId!: string;

  @Column({ default: '' })
  email!: string;

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

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({
    type: 'enum',
    enum: roles,
    default: roles.MASTER,
  })
  assignedToRole!: roles;
}
