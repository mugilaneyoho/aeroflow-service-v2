import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { PlacementInvite } from "./placement_invite.entity";

@Entity('placements')

export class Placements {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    placement_code!: string;

    @Column()
    company_id!: string;

    @Column()
    job_title!: string;

    @Column()
    job_description!: string;

    @Column()
    job_type!: 'Full-Time' | 'Contract' | 'Part-Time';

    @Column({ type: 'text', array: true })
    location!: string[];

    @Column()
    salary_package!: string;

    @Column()
    openings?: number;

    @Column({})
    eligibility_criteria?: string;

    @Column('date')
    application_start_date?: Date;

    @Column('date')
    application_end_date?: Date;

    @Column({ default: 'DRAFT' })
    placement_status!: 'DRAFT' | 'OPEN' | 'CLOSED' | 'COMPLETED';

    @Column({ type: 'uuid', nullable: true })
    created_by?: string;

    @Column({ default: true })
    is_active!: boolean;

    @Column({ default: false })
    is_deleted!: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at?: Date;

    @UpdateDateColumn({ type: 'timestamptz', nullable: true })
    updated_at?: Date;

    @OneToMany(() => PlacementInvite, (invite) => invite.placement)
    invite!: PlacementInvite[];
}