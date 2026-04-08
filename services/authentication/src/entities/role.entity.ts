import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Generated,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum roles {
  MASTER = 'MASTER',
  SUBADMIN = 'SUBADMIN',
  RECEPTION = 'RECEPTION',
  HOD = 'HOD',
  TELEADMIN = 'TELEADMIN',
  STAFF = 'STAFF',
  STUDENT = 'STUDENT',
  TELECALLER = 'TELECALLER',
}

@Entity('roles')
export class rolesEntity {
  @Column({ unique: true })
  @Generated('increment')
  id!: number;

  @PrimaryGeneratedColumn('uuid')
  uuid!: string;

  @Column({ type: 'enum', enum: roles, nullable: false, unique: true })
  role!: roles;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
