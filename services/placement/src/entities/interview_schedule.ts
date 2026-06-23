import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('interview_schedule')

export class InterviewSchedule {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('uuid')
    placement_id!: string;

    @Column('uuid')
    student_id!: string;

    @Column()
    round_no?: number;

    @Column()
    round_name!: string;

    @Column()
    interview_type!: 'VIRTUAL' | 'ON-SITE'

    @Column()
    scheduled_date!: Date;

    @Column()
    start_time!: string;

    @Column()
    end_time!: string;

    @Column()
    venue!: string;

    @Column()
    meeting_link!: string;

    @Column()
    interviewer_name!: string;

    @Column('uuid')
    scheduled_by!: string;

    @Column()
    schedule_status!: 'SCHEDULED' | 'RESCHEDULED' | 'COMPLETED' | 'CANCELLED';
}