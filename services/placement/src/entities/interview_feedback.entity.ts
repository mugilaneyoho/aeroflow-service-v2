import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('interview_feedback')

export class InterviewFeedback {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('uuid')
    interview_schedule_id!: string;

    @Column('uuid')
    student_id!: string;

    @Column('uuid')
    interviewer_id!: string;

    @Column()
    ratings!: string;

    @Column()
    comments!: string;

    @Column({default: true})
    is_active!: boolean;

    @Column({default: false})
    is_deleted!: boolean;
}