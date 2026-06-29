import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Placements } from "./placement.entity";

@Entity('placement_invite')

export class PlacementInvite {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('uuid')
    placement_id!: string;

    @Column('uuid')
    student_id!: string;

    @Column({type: 'uuid', nullable: true})
    invited_by?: string;

    @Column()
    invited_at!: Date;

    @Column({default: 'PENDING'})
    response_status!: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

    @Column({nullable: true})
    response_date?: Date;

    @Column({default: false})
    scheduled?: boolean;

    @Column({nullable: true})
    reason?: string;

    @Column({default: true})
    is_active!: boolean;

    @Column({default: false})
    is_deleted!: boolean;

    @ManyToOne(()=> Placements, (placement)=> placement.invite)
    @JoinColumn({name: 'placement_id'})
    placement!: Placements

}