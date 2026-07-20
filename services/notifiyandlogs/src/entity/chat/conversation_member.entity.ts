import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

import { Conversation, ConversationRole } from './conversation.entity';

@Entity('chat_conversation_members')
@Index(['conversationId', 'userId'], {
  unique: true,
})
@Index(['userId'])
export class ConversationMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  conversationId!: string;

  @Column({ type: 'uuid', nullable: true })
  userId!: string;

  @Column({
    type: 'enum',
    enum: ConversationRole,
    enumName: 'conversationRole',
  })
  role!: ConversationRole;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  joinedAt!: Date;

  @Column({
    default: true,
  })
  isActive!: boolean;

  @Column({
    default: false,
  })
  isMuted!: boolean;

  @Column({
    nullable: true,
  })
  lastReadMessageId?: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'conversationId',
  })
  conversation!: Conversation;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ nullable: true })
  userName?: string;
}
