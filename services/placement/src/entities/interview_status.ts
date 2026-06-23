import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('interview_status')

export class InterviewStatus {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('uuid')
    interview_schedule_id!: string;

    @Column('uuid')
    student_id!: string;

    @Column()
    round_no?: number;

    @Column({default: 'PENDING'})
    status!: 'PENDING' | 'ATTENDED' | 'SELECTED' | 'REJECTED' | 'ON_HOLD' | 'NO_SHOW';

    @Column()
    interview_type!: 'VIRTUAL' | 'ON-SITE';

    @Column()
    remarks!: string;

    @Column('uuid')
    updated_by!: string;

    @Column('timestamptz')
    updated_at!: Date;
}