import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('password_reset_token')
export class PasswordResetEntity {
  @Column({ unique: true })
  @Generated('increment')
  id!: number;

  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column()
  @Index()
  userId!: string;

  @Column({ type: 'text' })
  token!: string;

  @Column()
  expiresAt!: Date;

  @Column({ nullable: true })
  usedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
