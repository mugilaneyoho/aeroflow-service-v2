import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMeetingDto {
  @ApiProperty({ example: 'uuid-schedule-id', description: 'Associated WorkSchedule ID' })
  @IsUUID()
  @IsNotEmpty()
  scheduleId: string;

  @ApiProperty({ example: 'Alice Smith', description: 'Visitor/Client Full Name' })
  @IsString()
  @IsNotEmpty()
  visitorName: string;

  @ApiPropertyOptional({ example: 'Acme Corp', description: 'Visitor Company' })
  @IsString()
  @IsOptional()
  visitorCompany?: string;

  @ApiProperty({ example: '+19876543210', description: 'Visitor Phone' })
  @IsString()
  @IsNotEmpty()
  visitorPhone: string;

  @ApiProperty({ example: 'alice@acme.com', description: 'Visitor Email' })
  @IsEmail()
  @IsNotEmpty()
  visitorEmail: string;

  @ApiProperty({ example: 'Discuss Q3 Software Vendor Agreement', description: 'Meeting Purpose' })
  @IsString()
  @IsNotEmpty()
  meetingPurpose: string;

  @ApiProperty({ example: '2026-08-01', description: 'Meeting Date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  meetingDate: string;

  @ApiProperty({ example: '10:30', description: 'Meeting Time Slot (HH:mm)' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'meetingTime must be HH:mm format' })
  meetingTime: string;
}

export class ApproveRejectMeetingDto {
  @ApiPropertyOptional({ example: 'Approved, room 302 assigned.' })
  @IsString()
  @IsOptional()
  adminRemarks?: string;
}
