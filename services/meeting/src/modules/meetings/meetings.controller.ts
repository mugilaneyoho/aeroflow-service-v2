import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto, ApproveRejectMeetingDto } from './dto/create-meeting.dto';
import { Roles } from '../../role/role.decorator';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { MeetingStatus } from '../../database/entities/meeting.entity';
import { Role } from 'src/role/role.enum';

@ApiTags('Meetings')
@ApiBearerAuth()
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  @Roles([Role.RECEPTION])
  @ApiOperation({ summary: 'Create a meeting request (Receptionist/Admin)' })
  create(@Req() user: string, @Body() dto: CreateMeetingDto) {
    const data = JSON.parse(user)
    return this.meetingsService.create(data.uuid, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all meetings with optional status and date filters' })
  @ApiQuery({ name: 'status', enum: MeetingStatus, required: false })
  @ApiQuery({ name: 'date', required: false, example: '2026-08-01' })
  findAll(@Query('status') status?: MeetingStatus, @Query('date') date?: string) {
    return this.meetingsService.findAll(status, date);
  }

  @Get('pending')
  @Roles([])
  @ApiOperation({ summary: 'Get all pending meetings (Master Admin)' })
  findPending() {
    return this.meetingsService.findPending();
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today\'s meetings' })
  findToday() {
    return this.meetingsService.findToday();
  }

  @Get('analytics')
  @Roles([])
  @ApiOperation({ summary: 'Get dashboard analytics stats for Master Admin' })
  getAnalytics() {
    return this.meetingsService.getDashboardAnalytics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get meeting details by ID' })
  findOne(@Param('id') id: string) {
    return this.meetingsService.findOne(id);
  }

  @Patch(':id/approve')
  @Roles([])
  @ApiOperation({ summary: 'Approve meeting request (Master Admin)' })
  approve(
    @Param('id') id: string,
    @Req() user: string,
    @Body() dto: ApproveRejectMeetingDto,
  ) {
    const data = JSON.parse(user)
    return this.meetingsService.approve(id, data.uuid, dto);
  }

  @Patch(':id/reject')
  @Roles([])
  @ApiOperation({ summary: 'Reject meeting request (Master Admin)' })
  reject(
    @Param('id') id: string,
    @Req() user: string,
    @Body() dto: ApproveRejectMeetingDto,
  ) {
    const data = JSON.parse(user)
    return this.meetingsService.reject(id,data.uuid, dto);
  }
}
