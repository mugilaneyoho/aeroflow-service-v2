/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsDateString,
} from 'class-validator';

export class UpdateStudentDto {
  @ApiProperty({ example: 'course uuid' })
  @IsUUID()
  @IsNotEmpty()
  course_id!: string;

  @ApiProperty({ example: 'batch uuid' })
  @IsUUID()
  @IsNotEmpty()
  batch_id!: string;

  @ApiProperty({ example: 'devilhackii' })
  @IsString()
  @IsNotEmpty()
  student_name!: string;

  @ApiProperty({ example: 'Stud002' })
  @IsString()
  @IsNotEmpty()
  student_id!: string;

  @ApiProperty({ example: 'hackii@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '9876543210' })
  @IsPhoneNumber()
  @IsNotEmpty()
  phone_number!: string;

  @ApiProperty({ example: 'b.tech' })
  @IsString()
  @IsNotEmpty()
  qualification!: string;

  @ApiProperty({ example: '2026-02-06 16:58:45.130761' })
  @IsDateString()
  @IsNotEmpty()
  admission_date!: string;
}
