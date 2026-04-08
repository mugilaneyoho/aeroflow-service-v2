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

@Entity('admins')
export class AdminEntity {
  @Column({ unique: true })
  @Generated('increment')
  id!: number;

  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column('uuid')
  role_id!: string;

  @Column({ type: 'boolean', default: false })
  is_delete!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt!: Date;

  @ManyToOne(() => rolesEntity, { eager: false })
  @JoinColumn({ name: 'role_id' })
  role!: rolesEntity;
}
