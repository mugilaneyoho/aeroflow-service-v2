import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class UpdateBatchDto {
  @ApiProperty({ example: 'institute uuid (use this default "default")' })
  @IsUUID()
  @IsNotEmpty()
  instituteId!: string;

  @ApiProperty({ example: 'branch uuid (use this default "default")' })
  @IsUUID()
  @IsNotEmpty()
  branchId!: string;

  @ApiProperty({ example: 'course uuid' })
  @IsUUID()
  @IsNotEmpty()
  courseId!: string;

  @ApiProperty({ example: 'summer batch' })
  @IsString()
  @IsNotEmpty()
  batchName!: string;

  @ApiProperty({ example: 40 })
  @IsNumber()
  @IsNotEmpty()
  totalSeats!: number;

  @ApiProperty({ example: '2026-02-06 16:58:45.130761' })
  @IsDateString()
  @IsNotEmpty()
  startDate!: Date;

  @ApiProperty({ example: '2026-02-06 16:58:45.130761' })
  @IsDateString()
  @IsNotEmpty()
  endDate!: Date;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @IsNotEmpty()
  duration!: number;

  @ApiProperty({ example: 'month' })
  @IsString()
  @IsNotEmpty()
  durationType!: string;

  @ApiProperty({ example: '2026-02-06 16:58:45.130761' })
  @IsDateString()
  @IsNotEmpty()
  classStartTime!: string;

  @ApiProperty({ example: '2026-02-06 16:58:45.130761' })
  @IsDateString()
  @IsNotEmpty()
  classEndTime!: string;
}
