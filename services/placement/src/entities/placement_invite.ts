import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('placement_invite')

export class PlacementInvite {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('uuid')
    placement_id!: string;

    @Column('uuid')
    student_id!: string;

    @Column('uuid')
    invited_by!: string;

    @Column()
    invited_at!: Date;

    @Column({default: 'PENDING'})
    response_status!: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

    @Column()
    response_date!: Date;

    @Column()
    reason!: string;
}