import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CreatePlacementDto } from "src/dto/create_placement.dto";
import { Placements } from "src/entities/placement.entity";
import { Repository } from "typeorm";

@Injectable()

export class PlacementService {
    constructor (
        @InjectRepository(Placements) private placementRepo: Repository <Placements>
    ) {}

    async createPlacement (req: any, dto: CreatePlacementDto) {
        try {
            const placement = this.placementRepo.create({
                company_id: dto.companyId,
                placement_code: dto.placementCode,
                job_title: dto.jobTitle,
                job_description: dto.jobDescription,
                job_type: dto.jobType,
                location: dto.location,
                salary_package: dto.salaryPackage,
                openings: dto.openings,
                eligibility_criteria: dto.eligibilityCriteria,
                application_start_date: dto.applicationStartDate,
                application_end_date: dto.applicationEndDate,
                placement_status: dto.placementStatus,
            });

            await this.placementRepo.save(placement);

            return {
                success: true,
                message: 'Placement created successfully'
            }
        } catch (error: any) {
            throw new HttpException (
                { success: false, message: error?.message},
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }
}