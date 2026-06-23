import { IsNumber, IsString } from "class-validator";

export class CreatePlacementDto {
    @IsString()
    placementCode!: string;

    @IsString()
    companyId?: string;

    @IsString()
    jobTitle!: string;

    @IsString()
    jobDescription!: string;

    @IsString()
    jobType!: 'Full-Time' | 'Contract' | 'Part-Time';

    @IsString()
    location!: string[];

    @IsString()
    salaryPackage!: string;

    @IsNumber()
    openings?: number;

    @IsString()
    eligibilityCriteria?: string;

    @IsString()
    applicationStartDate?: Date;

    @IsString()
    applicationEndDate?: Date;

    @IsString()
    placementStatus?: 'DRAFT' | 'OPEN' | 'CLOSED' | 'COMPLETED';
}