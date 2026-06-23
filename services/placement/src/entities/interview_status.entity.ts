import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('interview_status')

export class InterviewStatus {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('uuid')
    interview_schedule_id!: string;

    @Column('uuid')
    student_id!: string;

    @Column({default: 'PENDING'})
    status!: 'PENDING' | 'ATTENDED' | 'SELECTED' | 'REJECTED' | 'ON_HOLD' | 'NO_SHOW';

    @Column({nullable: true})
    remarks?: string;

    // @Column({type: 'uuid', nullable: true})
    // updated_by?: string;

    @Column({type: 'timestamptz', nullable: true})
    updated_at?: Date;

    @Column({default: true})
    is_active!: boolean;

    @Column({default: false})
    is_deleted!: boolean;
}