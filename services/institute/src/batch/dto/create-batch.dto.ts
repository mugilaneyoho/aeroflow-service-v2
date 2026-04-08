import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { BatchMode } from 'src/entities/batch.entity';

export class CreateBatchDto {
  @ApiProperty({
    example:
      'institute uuid (use this default "4f93f601-2e2d-4912-b9b7-ef2831e1b27d")',
  })
  @IsUUID()
  @IsNotEmpty()
  instituteId!: string;

  @ApiProperty({
    example:
      'branch uuid (use this default "a174a521-e7a0-4015-bf9b-e1c95c6cbb58")',
  })
  @IsUUID()
  @IsNotEmpty()
  branchId!: string;

  @ApiProperty({
    example:
      'course uuid (use this for demo "48e45edc-e5a5-4bc1-98ac-c35c9ad2a200")',
  })
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

  @ApiProperty({ example: BatchMode.ONLINE })
  @IsEnum(BatchMode)
  @IsNotEmpty()
  batchMode!: BatchMode;
}
