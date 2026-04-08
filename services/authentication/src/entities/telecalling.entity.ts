import {
  Column,
  PrimaryGeneratedColumn,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { rolesEntity } from './role.entity';

@Entity('telecalling')
export class TelecallingEntity {
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
