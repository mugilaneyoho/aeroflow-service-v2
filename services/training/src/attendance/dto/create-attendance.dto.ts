/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { StatusRecordEnum } from 'src/entities/statusrecord.entity';

class AttenRec {
  @ApiProperty({ example: 'student uuid' })
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({ enum: StatusRecordEnum })
  @IsEnum(StatusRecordEnum)
  status!: StatusRecordEnum;
}

export class CreateAttendanceDto {
  @ApiProperty({ example: 'class uuid' })
  @IsNotEmpty()
  classId!: string;

  @ApiProperty({ example: 'online / offline' })
  @IsNotEmpty()
  class_mode!: string;

  @ApiProperty({ example: '2026-02-06 16:58:45.130761' })
  @IsDateString()
  @IsNotEmpty()
  date!: Date;

  @ApiProperty({ type: [AttenRec] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttenRec)
  records!: AttenRec[];
}
