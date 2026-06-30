import { IsOptional, IsString } from "class-validator";

export class InterviewStatusDto {
    @IsString()
    status!: 'PENDING' | 'ATTENDED' | 'SELECTED' | 'REJECTED' | 'ON_HOLD' | 'NO_SHOW';

    @IsString()
    remarks!: string;

    @IsString()
    updatedBy?: string;

    @IsString()
    @IsOptional()
    placementId?: string;
}