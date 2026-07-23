import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

import { Conversation } from './conversation.entity';
import { Attachment } from './attachment.entity';
import { MessageRead } from './message_read.entity';

import { MessageType, MessageStatus, MessageVisibility } from './enums';

@Entity('chat_messages')
@Index(['conversationId', 'createdAt'])
@Index(['senderId'])
@Index(['visibility'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  conversationId!: string;

  @Column({ type: 'uuid' })
  senderId!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  message!: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  messageType!: MessageType;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  status!: MessageStatus;

  @Column({
    type: 'enum',
    enum: MessageVisibility,
    default: MessageVisibility.ALL,
  })
  visibility!: MessageVisibility;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  replyMessageId?: string;

  @Column({
    default: false,
  })
  isEdited!: boolean;

  @Column({
    nullable: true,
  })
  editedAt?: Date;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation!: Conversation;

  @OneToMany(() => Attachment, (attachment) => attachment.message)
  attachments?: Attachment[];

  @OneToMany(() => MessageRead, (read) => read.message)
  reads!: MessageRead[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
