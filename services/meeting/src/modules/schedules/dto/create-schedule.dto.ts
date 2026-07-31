import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateScheduleDto {
  @ApiProperty({ example: '2026-08-01', description: 'Work Date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  workDate: string;

  @ApiProperty({ example: '09:00', description: 'Start Time (HH:mm)' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'startTime must be HH:mm format' })
  startTime: string;

  @ApiProperty({ example: '17:00', description: 'End Time (HH:mm)' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'endTime must be HH:mm format' })
  endTime: string;

  @ApiPropertyOptional({ example: '13:00', description: 'Break Start Time' })
  @IsString()
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'breakStart must be HH:mm format' })
  breakStart?: string;

  @ApiPropertyOptional({ example: '14:00', description: 'Break End Time' })
  @IsString()
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'breakEnd must be HH:mm format' })
  breakEnd?: string;

  @ApiProperty({ example: 2, description: 'Max Meetings Per Slot', default: 2 })
  @IsInt()
  @Min(1)
  maxMeetingsPerSlot: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  isAvailable?: boolean;
}

export class UpdateScheduleDto {
  @ApiPropertyOptional({ example: '09:00' })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ example: '17:00' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ example: '13:00' })
  @IsString()
  @IsOptional()
  breakStart?: string;

  @ApiPropertyOptional({ example: '14:00' })
  @IsString()
  @IsOptional()
  breakEnd?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxMeetingsPerSlot?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isAvailable?: boolean;
}
