import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateStudentDto {
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

  @ApiProperty({ example: 'hackii@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '9876543210' })
  @IsPhoneNumber()
  @IsNotEmpty()
  phone_number!: string;

  @ApiProperty({ example: '9876543210' })
  @IsPhoneNumber()
  @IsNotEmpty()
  alter_number!: string;

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

  @ApiProperty({ example: 'address' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ example: 'city' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: 'state' })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty({ example: 'pincode' })
  @IsString()
  @IsNotEmpty()
  pincode!: string;
}
