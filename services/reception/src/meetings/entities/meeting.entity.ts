import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

@Entity()
export class Meeting {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    mobileNumber: string;

    @Column()
    visitor: string;

    @Column()
    purposeOfMeeting: string;

    @Column()
    requestedTime: string;

    @Column()
    date: string;

    @Column({ nullable: true})
    meetingId: string;

    @Column({ default: 'Normal' })
    priority: string;

    @Column({ default: 'Pending' })
    status: string;

    @CreateDateColumn()
    createdAt: string;
}