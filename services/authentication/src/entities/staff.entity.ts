import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { rolesEntity } from './role.entity';

@Entity('staffs')
export class StaffEntity {
  @Column({ unique: true })
  @Generated('increment')
  id: number;

  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column('uuid')
  role_id: string;

  @Column({ type: 'char', length: 36 })
  profile_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt: Date;

  @ManyToOne(() => rolesEntity, { eager: false })
  @JoinColumn({ name: 'role_id' })
  role: rolesEntity;
}
