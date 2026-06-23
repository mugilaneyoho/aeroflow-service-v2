import { IsNumber, IsString } from "class-validator";

export class ScheduleInterviewDto {
    @IsString()
    placementId!: string;

    @IsString()
    studentId!: string;

    @IsNumber()
    roundNo?: number;

    @IsString()
    roundName?: string;

    @IsString()
    interviewType!: 'VIRTUAL' | 'ON-SITE';

    @IsString()
    scheduledDate!: string;

    @IsString()
    startTime?: string;

    @IsString()
    endTime?: string;

    @IsString()
    venue!: string;

    @IsString()
    meetLink?: string;

    @IsString()
    interviewer?: string;
}