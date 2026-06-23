import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('interview_schedule')

export class InterviewSchedule {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('uuid')
    placement_id!: string;

    @Column('uuid')
    student_id!: string;

    @Column({nullable: true})
    round_no?: number;

    @Column({nullable: true})
    round_name?: string;

    @Column()
    interview_type!: 'VIRTUAL' | 'ON-SITE'

    @Column()
    scheduled_date!: Date;

    @Column({nullable: true})
    start_time?: string;

    @Column({nullable: true})
    end_time?: string;

    @Column({nullable: true})
    venue?: string;

    @Column({nullable: true})
    meeting_link?: string;

    @Column({nullable: true})
    interviewer_name?: string;

    @Column({type: 'uuid', nullable: true})
    scheduled_by?: string;

    @Column({default: 'SCHEDULED'})
    schedule_status!: 'SCHEDULED' | 'RESCHEDULED' | 'COMPLETED' | 'CANCELLED';

    @Column({default: true})
    is_active!: boolean;

    @Column({default: false})
    is_deleted!: boolean;
}