import {
  Entity,
  Column,
  Generated,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OfflineClassesEntity } from './OfflineClass.entity';
import { OnlineClassesEntity } from './OnlineClass.entity';

@Entity('staffprofile')
export class StaffProfileEntity {
  @Column({ unique: true })
  @Generated('increment')
  id!: number;

  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column()
  staff_id!: string;

  @Column()
  staff_name!: string;

  @Column()
  phone_number!: string;

  @Column()
  address!: string;

  @Column()
  email!: string;

  @Column()
  experience!: string;

  @Column()
  employee_type!: string;

  @Column()
  qualification!: string;

  @Column()
  expertise!: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean = false;

  @Column({ type: 'boolean', default: false })
  is_delete: boolean = false;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: string;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: string;

  @OneToMany(() => OfflineClassesEntity, (classes) => classes.staff)
  offline_class!: OfflineClassesEntity[];

  @OneToMany(() => OnlineClassesEntity, (classes) => classes.staff)
  online_class!: OnlineClassesEntity[];
}
