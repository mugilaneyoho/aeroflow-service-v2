import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  IsUUID,
} from 'class-validator';
import { FindOperator } from 'typeorm';

export class CreateStudentDto {
  [x: string]: string | FindOperator<string> | undefined;
  @ApiProperty({ example: 'course uuid' })
  @IsUUID()
  @IsNotEmpty()
  course_id!: string;

  @ApiProperty({ example: 'devilhackii' })
  @IsString()
  @IsNotEmpty()
  student_name!: string;

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

  @ApiProperty({ example: 'asdfg2345' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: 'male' })
  @IsString()
  @IsNotEmpty()
  gender!: string;

  @ApiProperty({ example: 'parents number' })
  @IsString()
  @IsNotEmpty()
  parent_number!: string;

  @ApiProperty({ example: 'father name' })
  @IsString()
  @IsNotEmpty()
  father_name!: string;

  @ApiProperty({ example: 'mother name' })
  @IsString()
  @IsNotEmpty()
  mother_name!: string;

  @ApiProperty({ example: '2026-02-06 16:58:45.130761' })
  @IsDateString()
  @IsNotEmpty()
  dob!: string;

  @ApiProperty({ example: 'current address' })
  @IsDateString()
  @IsNotEmpty()
  currentAddress!: string;

  @ApiProperty({ example: 'permanent address' })
  @IsDateString()
  @IsNotEmpty()
  permantAddress!: string;
}
