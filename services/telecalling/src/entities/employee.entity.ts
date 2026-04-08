import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Generated,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { LeadsEntity } from './leads.entity';

@Entity('employee')
export class EmployeEntity {
  @Column({ unique: true })
  @Generated('increment')
  id!: number;

  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column({ nullable: false })
  employee_name!: string;

  @Column({ nullable: false })
  emp_id!: string;

  @Column({ nullable: false })
  phone_number!: string;

  @Column()
  alter_number!: string;

  @Column()
  work_exp!: string;

  @Column()
  address!: string;

  @Column()
  education!: string;

  @Column({ unique: true, nullable: false })
  email!: string;

  @Column()
  image!: string;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'boolean', default: false })
  is_delete!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
  })
  updatedAt!: Date;

  @OneToMany(() => LeadsEntity, (lead) => lead.assignedTo)
  leads!: LeadsEntity[];
}
