import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('placement_status')

export class PlacementStatus {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('uuid')
    student_id!: string;

    @Column({default: 'WAITLISTED'})
    result_status!: 'SELECTED' | 'REJECTED' | 'WAITLISTED' | 'OFFER_RELEASED' | 'OFFER_REJECTED' | 'OFFER_ACCEPTED' | 'JOINED';

    @Column()
    selected_package!: string;

    @Column('timestamptz')
    joining_date?: Date;

    @Column()
    remarks!: string;

    @Column({default: true})
    is_active!: boolean;

    @Column({default: false})
    is_deleted!: boolean;
}