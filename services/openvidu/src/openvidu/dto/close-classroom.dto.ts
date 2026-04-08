import { IsString, IsNotEmpty } from 'class-validator';

export class CloseClassroomDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;
}
