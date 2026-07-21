import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

import { Message } from './message.entity';

@Entity('chat_message_reads')

@Index(['messageId', 'userId'], {
  unique: true,
})

@Index(['userId'])
export class MessageRead {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({type: 'uuid'})
  messageId!: string;

  @Column({type: 'uuid'})
  userId!: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  readAt!: Date;

  @ManyToOne(() => Message, message => message.reads, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'messageId',
  })
  message!: Message;

  @CreateDateColumn({type: 'timestamptz'})
  createdAt!: Date;
}