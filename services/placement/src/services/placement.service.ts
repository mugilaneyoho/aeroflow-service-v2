import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import axios from "axios";
import { CreatePlacementDto } from "src/dto/create_placement.dto";
import { InterviewStatusDto } from "src/dto/interview_status.dto";
import { PlacementInviteDto } from "src/dto/placement_invite.dto";
import { ScheduleInterviewDto } from "src/dto/schedule_interview.dto";
import { updatePlacementInviteDto } from "src/dto/update_placement_invite.,dto";
import { InterviewSchedule } from "src/entities/interview_schedule.entity";
import { InterviewStatus } from "src/entities/interview_status.entity";
import { Placements } from "src/entities/placement.entity";
import { PlacementInvite } from "src/entities/placement_invite.entity";
import { Repository } from "typeorm";

@Injectable()

export class PlacementService {
    constructor(
        @InjectRepository(Placements) private placementRepo: Repository<Placements>,
        @InjectRepository(PlacementInvite) private placementInviteRepo: Repository<PlacementInvite>,
        @InjectRepository(InterviewSchedule) private scheduleInterviewRepo: Repository<InterviewSchedule>,
        @InjectRepository(InterviewStatus) private interviewStatusRepo: Repository<InterviewStatus>,
        @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
    ) { }

    async createPlacement(req: any, dto: CreatePlacementDto) {
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

            await this.invitePlacement({ placementId: placement.id })

            return {
                success: true,
                message: 'Placement created successfully'
            }
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR
            )
        }
    }

    async updatePlacement(id: string, dto: CreatePlacementDto) {
        try {
            const placement = await this.placementRepo.findOne({
                where: { id }
            });

            if (!placement) {
                throw new NotFoundException('Placement not found');
            }

            await this.placementRepo.update(
                { id },
                {
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
                }
            );

            return {
                success: true,
                message: 'Placement updated successfully'
            };
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getPlacementById(id: string) {
        try {
            const placement = await this.placementRepo.findOne({
                where: { id }
            });

            if (!placement) {
                throw new NotFoundException('Placement not found');
            }

            return {
                success: true,
                data: placement
            };
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getInvitePlacementById(id: string) {
        try {
            const placement = await this.placementInviteRepo.findOne({
                where: { id },
                relations: { placement: true }
            });

            if (!placement) {
                throw new NotFoundException('Placement not found');
            }

            return {
                success: true,
                data: placement
            };
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getAllPlacements(page = 1, limit = 10) {
        try {
            const [placements, total] = await this.placementRepo.findAndCount({
                skip: (page - 1) * limit,
                take: limit,
                order: {
                    created_at: 'DESC'
                },
            });

            return {
                success: true,
                data: placements,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getAllInvitePlacements(page = 1, limit = 10) {
        try {
            const [placements, total] = await this.placementInviteRepo.findAndCount({
                skip: (page - 1) * limit,
                take: limit,
                relations: { placement: true }
            });

            return {
                success: true,
                data: placements,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async deletePlacement(id: string) {
        try {
            const placement = await this.placementRepo.findOne({
                where: { id }
            });

            if (!placement) {
                throw new NotFoundException('Placement not found');
            }

            await this.placementRepo.delete({ id });

            return {
                success: true,
                message: 'Placement deleted successfully'
            };
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async invitePlacement(dto: PlacementInviteDto) {
        try {
            const placementDetails = await this.placementRepo.findOne({
                where: {
                    id: dto.placementId,
                    is_deleted: false,
                },
            });

            if (!placementDetails) {
                throw new BadRequestException('Placement not found');
            }

            const studentResponse = await axios.get(
                'http://institute-service:3004/student/all'
            );

            const students = studentResponse?.data?.data || [];

            const placementLocations = placementDetails.location

            const eligibleStudents = students.filter((student) => {
                const preferredLocations = student.preferredLocations || [];

                const locationMatched = preferredLocations.some((location) =>
                    placementLocations.includes(location)
                );

                return (
                    student.is_no_due === true &&
                    student.is_eligible_placement === true &&
                    locationMatched
                );
            });

            const invites: PlacementInvite[] = [];

            for (const student of eligibleStudents) {
                const alreadyInvited = await this.placementInviteRepo.findOne({
                    where: {
                        student_id: student.uuid,
                        placement_id: dto.placementId,
                    },
                });

                if (alreadyInvited) {
                    continue;
                }

                const invite = this.placementInviteRepo.create({
                    placement_id: dto.placementId,
                    student_id: student.uuid,
                    invited_by: dto.invitedBy,
                    invited_at: new Date(),
                });

                await this.placementInviteRepo.save(invite);

                invites.push(invite);

                this.notificationClient.emit('placement.invited', {
                    userId: student.uuid,
                    title: 'New Placement Invitation',
                    message: `${placementDetails.job_title} has invited you for a placement opportunity.`,
                    priority: 'HIGH',
                    type: 'INFO',
                    Role: 'STUDENT',
                });
            }

            return {
                success: true,
                invitedCount: invites.length,
                message: `${invites.length} eligible students invited successfully`,
            };
        } catch (error: any) {
            throw new HttpException(
                {
                    success: false,
                    message: error?.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async updatePlacementInvite(id: string, dto: updatePlacementInviteDto) {
        try {
            const placementInviteId = id;

            if (!placementInviteId) {
                throw new NotFoundException('Placement invite id is not found')
            }

            const updateInvite = await this.placementInviteRepo.update(
                { id: placementInviteId },
                {
                    response_status: dto.responseStatus,
                    reason: dto.responseStatus === 'ACCEPTED' ? undefined : dto.reason,
                    response_date: new Date()
                }
            );

            return {
                success: true,
                message: 'Placement invite status updated successfully'
            }
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async scheduleInterview(req: any, dto: ScheduleInterviewDto) {
        try {
            const placementDetails = await this.placementRepo.findOne({
                where: {
                    id: dto.placementId,
                    is_deleted: false,
                },
            });

            const students = dto.studentId

            for (let studentId of students) {

                const schedule = this.scheduleInterviewRepo.create({
                    placement_id: dto.placementId,
                    student_id: studentId,
                    round_no: dto.roundNo,
                    round_name: dto.roundName,
                    interview_type: dto.interviewType,
                    venue: dto.interviewType === 'ON-SITE' ? dto.venue : undefined,
                    meeting_link: dto.interviewType === 'ON-SITE' ? undefined : dto.meetLink,
                    interviewer_name: dto.interviewer,
                    scheduled_date: dto.scheduledDate,
                    start_time: dto.startTime,
                    end_time: dto.endTime,
                    schedule_status: 'SCHEDULED'
                })

                await this.scheduleInterviewRepo.save(schedule);

                const status = this.interviewStatusRepo.create({
                    interview_schedule_id: schedule.id,
                    student_id: studentId,
                    status: 'PENDING'
                })

                await this.interviewStatusRepo.save(status);

                this.notificationClient.emit('placement.invited', {
                    userId: studentId,
                    title: `Interview Scheduled for ${placementDetails?.placement_code}`,
                    message: `Your interview for the position of ${placementDetails?.job_title} has been scheduled. Please check the interview details and be prepared to attend.`,
                    priority: 'HIGH',
                    type: 'INFO',
                    Role: 'STUDENT',
                })
            }

            return {
                success: true,
                message: 'Interview scheduled successfully'
            }
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async updateInterviewStatus(id: string, dto: InterviewStatusDto) {
        try {
            const interviewStatusId = id;

            if (!interviewStatusId) {
                throw new NotFoundException('Interview Status Id is not found');
            }

            const updateStatus = await this.interviewStatusRepo.update(
                { id: interviewStatusId },
                {
                    status: dto.status,
                    remarks: dto.remarks,
                    updated_at: new Date()
                }
            )

            return {
                success: true,
                message: 'Interview status updated successfully'
            }
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}