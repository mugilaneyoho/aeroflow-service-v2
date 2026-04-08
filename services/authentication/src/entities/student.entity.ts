import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Generated,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { rolesEntity } from './role.entity';

@Entity('students')
export class StudentEntity {
  @Column({ unique: true })
  @Generated('increment')
  id!: number;

  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column('uuid')
  role_id!: string;

  @Column({ type: 'char', length: 36 })
  profile_id!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt!: Date;

  @Column({ type: 'boolean', default: false })
  setPassword!: boolean;

  @ManyToOne(() => rolesEntity, { eager: false })
  @JoinColumn({ name: 'role_id' })
  role!: rolesEntity;
}
