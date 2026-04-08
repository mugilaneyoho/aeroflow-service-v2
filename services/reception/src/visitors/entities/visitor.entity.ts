import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Visitor {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    visitorName: string;

    @Column()
    mobileNumber: string;

    @Column()
    purposeOfVisit: string;

    @Column()
    visitType: string;

    @Column()
    date: string;

    @Column()
    requestedTime: string;

    @CreateDateColumn()
    createdAt: Date;
}