/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateCourseDto {
  @ApiProperty({ example: 'full stack' })
  @IsString()
  @IsNotEmpty()
  course_name!: string;

  @ApiProperty({ example: 'learn frontend and backend both in one' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 'AWS upload image url' })
  @IsString()
  thumbnail!: string;

  @ApiProperty({ example: '200000' })
  @IsNumber()
  @IsNotEmpty()
  price!: number;
}
