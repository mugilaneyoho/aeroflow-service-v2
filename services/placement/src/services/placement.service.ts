import {
    BadRequestException,
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    NotFoundException,
    OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc, ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, Observable } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { CreatePlacementDto } from 'src/dto/create_placement.dto';
import { InterviewStatusDto } from 'src/dto/interview_status.dto';
import { PlacementInviteDto } from 'src/dto/placement_invite.dto';
import { ScheduleInterviewDto } from 'src/dto/schedule_interview.dto';
import { updatePlacementInviteDto } from 'src/dto/update_placement_invite.,dto';
import { InterviewSchedule } from 'src/entities/interview_schedule.entity';
import { InterviewStatus } from 'src/entities/interview_status.entity';
import { Placements } from 'src/entities/placement.entity';
import { PlacementInvite } from 'src/entities/placement_invite.entity';
import { PlacementStatus } from 'src/entities/placement_status.entity';
import { Repository, In } from 'typeorm';

interface StudentGrpcService {
    PlacementEligible(data: { data: string[] }): Observable<any>;
}

@Injectable()
export class PlacementService implements OnModuleInit {
    private studentServiceGrpc!: StudentGrpcService;

    constructor(
        @InjectRepository(Placements) private placementRepo: Repository<Placements>,
        @InjectRepository(PlacementStatus)
        private placementStatusRepo: Repository<PlacementStatus>,
        @InjectRepository(PlacementInvite)
        private placementInviteRepo: Repository<PlacementInvite>,
        @InjectRepository(InterviewSchedule)
        private scheduleInterviewRepo: Repository<InterviewSchedule>,
        @InjectRepository(InterviewStatus)
        private interviewStatusRepo: Repository<InterviewStatus>,
        @Inject('NOTIFICATION_SERVICE')
        private readonly notificationClient: ClientProxy,
        @Inject('STUDENT_GRPC_SERVICE')
        private readonly client: any,
    ) { }

    onModuleInit() {
        this.studentServiceGrpc = (
            this.client as ClientGrpc
        ).getService<StudentGrpcService>('StudentService');
    }

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
                message: 'Placement created successfully',
            };
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async updatePlacement(id: string, dto: CreatePlacementDto) {
        try {
            const placement = await this.placementRepo.findOne({
                where: { id },
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
                },
            );

            return {
                success: true,
                message: 'Placement updated successfully',
            };
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async getPlacementById(id: string) {
        try {
            const placement = await this.placementRepo.findOne({
                where: { id },
            });

            if (!placement) {
                throw new NotFoundException('Placement not found');
            }

            return {
                success: true,
                data: placement,
            };
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async getInvitePlacementById(id: string) {
        try {
            const placement = await this.placementInviteRepo.findOne({
                where: { id },
            });

            if (!placement) {
                throw new NotFoundException('Placement not found');
            }

            return {
                success: true,
                data: placement,
            };
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async getAllPlacements(page = 1, limit = 10) {
        try {
            const [placements, total] = await this.placementRepo.findAndCount({
                skip: (page - 1) * limit,
                take: limit,
                order: {
                    created_at: 'DESC',
                },
            });

            return {
                success: true,
                data: placements,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async getResponseStatusStudent(id: string) {
        try {
            // Get accepted students for a specific placement
            const placementInvites = await this.placementInviteRepo.find({
                where: {
                    placement_id: id,
                    response_status: 'ACCEPTED',
                    scheduled: false
                },
            });

            if (!placementInvites.length) {
                return [];
            }

            // Extract accepted student ids
            const studentIds = placementInvites.map(
                (invite) => invite.student_id
            );

            // Get all students from Student Service
            const { data: students } = await axios.get(
                'http://institute-service:3004/student/all'
            );

            console.log('Student', studentIds)
            console.log('StudentIds...', students)

            // Filter only accepted students
            const acceptedStudents = students?.data?.filter((student: any) =>
                studentIds.includes(student.uuid)
            );

            return acceptedStudents;
        } catch (error) {
            throw error;
        }
    }

    async getAllInvitePlacements(page = 1, limit = 10) {
        try {
            const [placements, total] = await this.placementInviteRepo.findAndCount({
                skip: (page - 1) * limit,
                take: limit,
                relations: {placement: true}
            });

            return {
                success: true,
                data: placements,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async deletePlacement(id: string) {
        try {
            const placement = await this.placementRepo.findOne({
                where: { id },
            });

            if (!placement) {
                throw new NotFoundException('Placement not found');
            }

            await this.placementRepo.delete({ id });

            return {
                success: true,
                message: 'Placement deleted successfully',
            };
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
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
                'http://institute-service:3004/student/all',
            );

            const students = studentResponse?.data?.data || [];

            const placementLocations = placementDetails.location;

            // Filter eligible students
            const eligibleStudents = students.filter((student) => {
                const preferredLocations = student.preferredLocations || [];

                const locationMatched = preferredLocations.some((location) =>
                    placementLocations.includes(location),
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
                    invited_at: new Date(),
                });

                await this.placementInviteRepo.save(invite);

                invites.push(invite);

                // Send notification
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



    async getInviteStatusWithquery(
        status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED',
        placementId?: string,
    ) {
        try {
            const whereClause: any = {
                response_status: status,
            };
            if (placementId) {
                whereClause.placement_id = placementId;
            }
            const getStudentStatus = await this.placementInviteRepo.find({
                where: whereClause,
            });

            const studentIds = getStudentStatus.map(
                (invite) => invite.student_id,
            );

            const studentResponse = await axios.get(
                'http://institute-service:3004/student/all',
            );

            const students = studentResponse.data.data;

            const matchedStudents = students.filter((student: any) =>
                studentIds.includes(student.uuid),
            );

            // Fetch InterviewStatus records for these students in this placement
            let interviewStatuses: InterviewStatus[] = [];
            if (placementId && studentIds.length > 0) {
                const schedules = await this.scheduleInterviewRepo.find({
                    where: {
                        placement_id: placementId,
                        is_deleted: false,
                    },
                    select: { id: true },
                });
                const scheduleIds = schedules.map(s => s.id);
                
                if (scheduleIds.length > 0) {
                    interviewStatuses = await this.interviewStatusRepo.find({
                        where: {
                            interview_schedule_id: In(scheduleIds),
                            student_id: In(studentIds),
                            is_deleted: false,
                        },
                    });
                }
            } else if (studentIds.length > 0) {
                interviewStatuses = await this.interviewStatusRepo.find({
                    where: {
                        student_id: In(studentIds),
                        is_deleted: false,
                    },
                });
            }

            const data = matchedStudents.map((student: any) => {
                const invite = getStudentStatus.find(i => i.student_id === student.uuid);
                const interviewStatus = interviewStatuses.find(is => is.student_id === student.uuid);
                
                return {
                    ...student,
                    invite_id: invite?.id,
                    invite_status: invite?.response_status,
                    invite_reason: invite?.reason,
                    interview_status_id: interviewStatus?.id || null,
                    interview_status: interviewStatus?.status || 'PENDING',
                    remarks: interviewStatus?.remarks || '',
                };
            });

            return {
                success: true,
                count: data.length,
                data: data,
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

    async updatePlacementInviteSchedule(id: string, studentId: string) {
        try {
            const placementInviteId = id;

            if (!placementInviteId) {
                throw new NotFoundException('Placement invite id is not found');
            }

            const updateInvite = await this.placementInviteRepo.update(
                { placement_id: placementInviteId, student_id: studentId },
                {
                    scheduled: true
                },
            );

            return {
                success: true,
                message: 'Placement invite schedule status updated successfully',
            };
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async updatePlacementInvite(id: string, dto: updatePlacementInviteDto) {
        try {
            const placementInviteId = id;

            if (!placementInviteId) {
                throw new NotFoundException('Placement invite id is not found');
            }

            const updateInvite = await this.placementInviteRepo.update(
                { id: placementInviteId },
                {
                    response_status: dto.responseStatus,
                    reason: dto.responseStatus === 'ACCEPTED' ? undefined : dto.reason,
                    response_date: new Date(),
                },
            );

            return {
                success: true,
                message: 'Placement invite status updated successfully',
            };
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
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

            const students = dto.studentId;

            for (const studentId of students) {
                const schedule = this.scheduleInterviewRepo.create({
                    placement_id: dto.placementId,
                    student_id: studentId,
                    round_no: dto.roundNo,
                    round_name: dto.roundName,
                    interview_type: dto.interviewType,
                    venue: dto.interviewType === 'OFFLINE' ? dto.venue : undefined,
                    meeting_link:
                        dto.interviewType === 'OFFLINE' ? undefined : dto.meetLink,
                    interviewer_name: dto.interviewer,
                    scheduled_date: dto.scheduledDate,
                    start_time: dto.startTime,
                    end_time: dto.endTime,
                    schedule_status: 'SCHEDULED',
                    instructions: dto.instructions,
                });

                await this.scheduleInterviewRepo.save(schedule);

                const status = this.interviewStatusRepo.create({
                    interview_schedule_id: schedule.id,
                    student_id: studentId,
                    status: 'PENDING',
                });

                await this.interviewStatusRepo.save(status);

                await this.updatePlacementInviteSchedule(schedule.placement_id, studentId)

                this.notificationClient.emit('placement.invited', {
                    userId: studentId,
                    title: `Interview Scheduled for ${placementDetails?.placement_code}`,
                    message: `Your interview for the position of ${placementDetails?.job_title} has been scheduled. Please check the interview details and be prepared to attend.`,
                    priority: 'HIGH',
                    type: 'INFO',
                    Role: 'STUDENT',
                });
            }

            return {
                success: true,
                message: 'Interview scheduled successfully',
            };
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async updateInterviewStatus(id: string, dto: InterviewStatusDto) {
        try {
            if (!id) {
                throw new NotFoundException('ID is not found');
            }

            // 1. Try to find by InterviewStatus primary key (UUID)
            let statusRecord = await this.interviewStatusRepo.findOne({
                where: { id, is_deleted: false }
            });

            // 2. If not found, try to find by student_id
            if (!statusRecord) {
                const schedules = await this.scheduleInterviewRepo.find({
                    where: { student_id: id, is_deleted: false },
                    order: { scheduled_date: 'DESC' }
                });
                
                if (schedules.length > 0) {
                    for (const schedule of schedules) {
                        statusRecord = await this.interviewStatusRepo.findOne({
                            where: { student_id: id, interview_schedule_id: schedule.id, is_deleted: false }
                        });
                        if (statusRecord) break;
                    }
                }
            }

            // 3. If still not found, create a default schedule and status record
            if (!statusRecord) {
                const studentId = id;
                const placementId = dto.placementId;
                
                if (!placementId) {
                    throw new BadRequestException('Placement ID is required to create a status record for this student');
                }
                
                const defaultSchedule = this.scheduleInterviewRepo.create({
                    placement_id: placementId,
                    student_id: studentId,
                    interview_type: 'ONLINE',
                    scheduled_date: new Date(),
                    schedule_status: 'SCHEDULED',
                });
                const savedSchedule = await this.scheduleInterviewRepo.save(defaultSchedule);
                
                statusRecord = this.interviewStatusRepo.create({
                    interview_schedule_id: savedSchedule.id,
                    student_id: studentId,
                    status: dto.status,
                    remarks: dto.remarks,
                });
                await this.interviewStatusRepo.save(statusRecord);
            } else {
                // Update existing record
                statusRecord.status = dto.status;
                statusRecord.remarks = dto.remarks;
                statusRecord.updated_at = new Date();
                await this.interviewStatusRepo.save(statusRecord);
            }

            return {
                success: true,
                message: 'Interview status updated successfully',
                data: statusRecord,
            };
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async getDrivesReport() {
        try {
            const placements = await this.placementRepo.find({
                order: {
                    created_at: 'DESC',
                },
            });
            return {
                success: true,
                data: placements,
            };
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async getStudentsReport() {
        try {
            const [invites, statuses] = await Promise.all([
                this.placementInviteRepo.find(),
                this.placementStatusRepo.find(),
            ]);

            const baseStudents = [
                {
                    id: 'ST-2024-001',
                    name: 'Jameson Doe',
                    email: 'jameson@email.com',
                    course: 'Full-Stack Dev',
                    gpa: '3.75',
                    standing: 'EXCELLENT',
                    fee: 'Paid',
                    pct: 95,
                },
                {
                    id: 'ST-2024-002',
                    name: 'Sarah Rogers',
                    email: 'sarah@email.com',
                    course: 'UI/UX Design',
                    gpa: '3.20',
                    standing: 'GOOD',
                    fee: 'Paid',
                    pct: 78,
                },
                {
                    id: 'ST-2024-003',
                    name: 'Michael Kim',
                    email: 'michael@email.com',
                    course: 'Data Science',
                    gpa: '3.90',
                    standing: 'EXCELLENT',
                    fee: 'Pending',
                    pct: 100,
                },
                {
                    id: 'ST-2024-004',
                    name: 'Aria Lee',
                    email: 'aria@email.com',
                    course: 'Full-Stack Dev',
                    gpa: '2.40',
                    standing: 'AVERAGE',
                    fee: 'Paid',
                    pct: 45,
                },
                {
                    id: 'ST-2024-005',
                    name: 'Ravi Menon',
                    email: 'ravi@email.com',
                    course: 'Cloud DevOps',
                    gpa: '3.65',
                    standing: 'EXCELLENT',
                    fee: 'Paid',
                    pct: 88,
                },
                {
                    id: 'ST-2024-006',
                    name: 'Priya Kapoor',
                    email: 'priya@email.com',
                    course: 'Data Science',
                    gpa: '3.10',
                    standing: 'GOOD',
                    fee: 'Pending',
                    pct: 62,
                },
                {
                    id: 'ST-2024-007',
                    name: 'Alex Harrison',
                    email: 'alex@email.com',
                    course: 'B.Tech Computer Science',
                    gpa: '3.82',
                    standing: 'EXCELLENT',
                    fee: 'Paid',
                    pct: 95,
                },
                {
                    id: 'ST-2024-008',
                    name: 'Maya Williams',
                    email: 'maya@email.com',
                    course: 'M.S. Data Analytics',
                    gpa: '3.45',
                    standing: 'GOOD',
                    fee: 'Pending',
                    pct: 88,
                },
                {
                    id: 'ST-2024-009',
                    name: 'Jordan Chen',
                    email: 'jordan@email.com',
                    course: 'B.E. Mechanical Eng.',
                    gpa: '2.90',
                    standing: 'AVERAGE',
                    fee: 'Paid',
                    pct: 62,
                },
                {
                    id: 'ST-2024-010',
                    name: 'Sarah Rodriguez',
                    email: 'sarah.r@email.com',
                    course: 'MBA Marketing',
                    gpa: '3.10',
                    standing: 'GOOD',
                    fee: 'Paid',
                    pct: 100,
                },
                {
                    id: 'ST-2024-011',
                    name: 'David Kim',
                    email: 'david@email.com',
                    course: 'B.Tech AI & ML',
                    gpa: '4.00',
                    standing: 'PERFECT',
                    fee: 'Paid',
                    pct: 100,
                },
            ];

            const reportData = baseStudents.map((student) => {
                const placementStatus = statuses.find(
                    (st) => st.student_id === student.id,
                );
                const studentInvites = invites.filter(
                    (inv) => inv.student_id === student.id,
                );

                let status = 'Ready';
                let company = '—';
                let eligibility = 'Eligible';
                let reason = '';

                if (
                    placementStatus &&
                    (placementStatus.result_status === 'SELECTED' ||
                        placementStatus.result_status === 'OFFER_ACCEPTED' ||
                        placementStatus.result_status === 'JOINED')
                ) {
                    status = 'Placed';
                    company = placementStatus.remarks || 'Assigned Company';
                } else if (studentInvites.length > 0) {
                    status = 'Interviewing';
                    company = 'Multiple Drives';
                } else if (student.pct < 60) {
                    status = 'Ineligible';
                    eligibility = 'Not Eligible';
                    reason = 'Course Incomplete';
                } else if (student.fee === 'Pending') {
                    status = 'Ready';
                    eligibility = 'Pending Review';
                    reason = 'Fees Due';
                }

                const originalFrontMatch = [
                    { id: 'ST-2024-001', company: 'Google Cloud', status: 'Placed' },
                    { id: 'ST-2024-002', company: 'Figma Inc.', status: 'Interviewing' },
                    { id: 'ST-2024-005', company: 'TCS NextStep', status: 'Placed' },
                    { id: 'ST-2024-006', company: 'Infosys', status: 'Interviewing' },
                ].find((m) => m.id === student.id);

                if (originalFrontMatch && status === 'Ready') {
                    status = originalFrontMatch.status;
                    company = originalFrontMatch.company;
                }

                return {
                    ...student,
                    status,
                    company,
                    eligibility,
                    reason,
                };
            });

            return {
                success: true,
                data: reportData,
            };
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async markStudentEligible(uuid: string) {
        try {
            const response = await lastValueFrom(
                this.studentServiceGrpc.PlacementEligible({ data: [uuid] }),
            );
            return response;
        } catch (error: any) {
            console.log(error)
            throw new HttpException(
                {
                    success: false,
                    message: error?.message || 'Failed to update student eligibility',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async getStudentInvitation(user : {profile_id: string}) {
        console.log('Userr', user)
        try {
            const placements = await this.placementInviteRepo.find({
                where: {student_id: user.profile_id},
                relations: {placement: true}
            });

            return {    
                success: true,
                data: placements,
            };
        } catch (error: any) {
            throw new HttpException(
                { success: false, message: error?.message },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
