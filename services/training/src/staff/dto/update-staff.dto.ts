/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsPhoneNumber,
  // MinLength,
  IsOptional,
  IsNumberString,
} from 'class-validator';

export class UpdateStaffDto {
  @ApiProperty({ example: 'mugilane@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  // @ApiProperty({ example: 'asdfg123456' })
  // @IsString()
  // @MinLength(4)
  // @IsNotEmpty()
  // password!: string;

  @ApiProperty({ example: 'STAFF001' })
  @IsString()
  @IsNotEmpty()
  staff_id!: string;

  @ApiProperty({ example: 'mugilane' })
  @IsString()
  @IsNotEmpty()
  staff_name!: string;

  @ApiProperty({ example: '9360096656' })
  @IsPhoneNumber('IN') // change country code if needed
  @IsNotEmpty()
  phone_number!: string;

  @ApiProperty({ example: 'keelkattalai, chennai, tamilnadu' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ example: '2' })
  @IsNumberString()
  @IsNotEmpty()
  experience!: string;

  @ApiProperty({ example: 'Full Time' })
  @IsString()
  @IsNotEmpty()
  employee_type!: string;

  @ApiProperty({ example: 'B.Tech' })
  @IsString()
  @IsNotEmpty()
  qualification!: string;

  @ApiProperty({ example: 'Backend development, NestJS' })
  @IsString()
  @IsOptional()
  expertise?: string;
}
