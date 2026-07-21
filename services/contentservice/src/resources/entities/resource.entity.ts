import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  topicName!: string;

  @Column()
  classId!: string;

  @Column({ type: 'enum', enum: ['online', 'offline'] })
  classType!: 'online' | 'offline';

  @Column()
  batch!: string;

  @Column({ type: 'enum', enum: ['staff', 'student'] })
  panel!: 'staff' | 'student';

  @Column({ type: 'enum', enum: ['NotePDF', 'PPT', 'DOC', 'MP4'] })
  materialType!: 'NotePDF' | 'PPT' | 'DOC' | 'MP4';

  @Column({ type: 'date', nullable: true })
  classDate!: string;

  @Column({ type: 'enum', enum: ['ongoing', 'completed'], default: 'ongoing' })
  status!: 'ongoing' | 'completed';

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
