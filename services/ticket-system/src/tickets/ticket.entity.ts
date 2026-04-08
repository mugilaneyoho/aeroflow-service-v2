import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn,ManyToOne } from 'typeorm';
import {roles} from './auth/roles.enum';

@Entity()
export class Ticket {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column('text')
    description: string;

    @Column({ default: 'open' })
    status: string;

    @Column({ default: 'medium' })
    priority: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({
        type: 'enum',
        enum: roles,
        default: roles.MASTER,
    })
    assignedToRole: roles;

    @ManyToOne(() => User, (user) => user.tickets)
    creator: User;
}
