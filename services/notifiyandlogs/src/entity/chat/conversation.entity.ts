import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { ConversationMember } from './conversation_member.entity';
import { Message } from './message.entity';

export enum ConversationType {
  ONE_TO_ONE = 'ONE_TO_ONE',
  GROUP = 'GROUP',
}

export enum  ConversationRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  STUDENT = 'STUDENT',
}

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

@Entity('chat_conversations')
@Index(['batchId'])
@Index(['type'])
@Index(['status'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    length: 150,
  })
  name!: string;

  @Column({
    nullable: true,
  })
  description?: string;

  @Column({
    nullable: true,
  })
  batchId?: string;

  @Column({
    type: 'enum',
    enum: ConversationType,
  })
  type!: ConversationType;

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.ACTIVE,
  })
  status!: ConversationStatus;

  @Column()
  createdBy!: string;

  @Column({
    nullable: true,
  })
  lastMessageId?: string;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  lastMessageAt?: Date;

  @OneToMany(
    () => ConversationMember,
    member => member.conversation,
  )
  members!: ConversationMember[];

  @OneToMany(
    () => Message,
    message => message.conversation,
  )
  messages!: Message[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}