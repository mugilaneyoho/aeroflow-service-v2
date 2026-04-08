import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class UpdateClassDto {
  @ApiProperty({ example: 'batch uuid' })
  @IsNotEmpty()
  batch_id!: string;

  @ApiProperty({ example: 'staff uuid' })
  @IsNotEmpty()
  staff_id!: string;

  @ApiProperty({ example: 'javascript' })
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({ example: '2026-02-06 16:58:45.130761' })
  @IsDateString()
  @IsNotEmpty()
  start_date!: Date;

  @ApiProperty({ example: '2026-02-06 16:58:45.130761' })
  @IsDateString()
  @IsNotEmpty()
  start_time!: Date;

  @ApiProperty({ example: '2026-02-06 16:58:45.130761' })
  @IsDateString()
  @IsNotEmpty()
  end_time!: Date;

  @ApiProperty({ example: 'online' })
  @IsNotEmpty()
  mode!: string;
}
