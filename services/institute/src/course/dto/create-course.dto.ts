import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({
    example:
      'institute uuid (use this default "4f93f601-2e2d-4912-b9b7-ef2831e1b27d")',
  })
  @IsUUID()
  @IsNotEmpty()
  institute_id!: string;

  @ApiProperty({
    example:
      'branch uuid (use this default "a174a521-e7a0-4015-bf9b-e1c95c6cbb58")',
  })
  @IsUUID()
  @IsNotEmpty()
  branch_id!: string;

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
