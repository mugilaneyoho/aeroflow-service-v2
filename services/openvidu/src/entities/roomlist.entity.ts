import {
  Entity,
  Column,
  Generated,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('roomlist')
export class RoomlistEntity {
  @Column({ unique: true })
  @Generated('increment')
  id!: number;

  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column()
  classId!: string;

  @Column()
  staffId!: string;

  @Column()
  roomName!: string;

  @Column({ type: 'boolean', default: false })
  isStarted!: boolean;

  @Column({ type: 'boolean', default: false })
  isEnded!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
