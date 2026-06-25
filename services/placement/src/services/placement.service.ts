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
import { Repository } from 'typeorm';

interface StudentGrpcService {
  PlacementEligible(data: { data: string[] }): Observable<any>;
}

@Injectable()
export class PlacementService implements OnModuleInit {
  private studentServiceGrpc: StudentGrpcService;

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
  ) {}

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

  async getAllInvitePlacements(page = 1, limit = 10) {
    try {
      const [placements, total] = await this.placementInviteRepo.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
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

  async invitePlacement(req: any, dto: PlacementInviteDto) {
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
            student_id: student.id,
            placement_id: dto.placementId,
          },
        });

        if (alreadyInvited) {
          continue;
        }

        const invite = this.placementInviteRepo.create({
          placement_id: dto.placementId,
          student_id: student.id,
          invited_by: dto.invitedBy,
          invited_at: new Date(),
        });

        await this.placementInviteRepo.save(invite);

        invites.push(invite);

        // Send notification
        this.notificationClient.emit('placement.invited', {
          userId: student.id,
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
    console.log('DtooSche', dto);
    try {
      const schedule = this.scheduleInterviewRepo.create({
        placement_id: dto.placementId,
        student_id: dto.studentId,
        round_no: dto.roundNo,
        round_name: dto.roundName,
        interview_type: dto.interviewType,
        venue: dto.interviewType === 'ON-SITE' ? dto.venue : undefined,
        meeting_link:
          dto.interviewType === 'ON-SITE' ? undefined : dto.meetLink,
        interviewer_name: dto.interviewer,
        scheduled_date: dto.scheduledDate,
        start_time: dto.startTime,
        end_time: dto.endTime,
        schedule_status: 'SCHEDULED',
      });

      await this.scheduleInterviewRepo.save(schedule);

      const status = this.interviewStatusRepo.create({
        interview_schedule_id: schedule.id,
        student_id: schedule.student_id,
        status: 'PENDING',
      });

      await this.interviewStatusRepo.save(status);

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
      const interviewStatusId = id;

      if (!interviewStatusId) {
        throw new NotFoundException('Interview Status Id is not found');
      }

      const updateStatus = await this.interviewStatusRepo.update(
        { id: interviewStatusId },
        {
          status: dto.status,
          remarks: dto.remarks,
          updated_at: new Date(),
        },
      );

      return {
        success: true,
        message: 'Interview status updated successfully',
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
      throw new HttpException(
        {
          success: false,
          message: error?.message || 'Failed to update student eligibility',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
