// src/openvidu/dto/join-classroom.dto.ts
import { IsString, IsIn, IsNotEmpty, IsOptional } from 'class-validator';

export class JoinClassroomDto {
  // @IsString()
  // @IsNotEmpty()
  // sessionId!: string;

  // @IsString()
  // @IsNotEmpty()
  // participantName!: string;

  // @IsIn(['STAFF', 'STUDENT'])
  // role!: 'STAFF' | 'STUDENT';
  @IsString()
  @IsNotEmpty()
  classId!: string;

  @IsOptional()
  @IsIn(['interactive'])
  mode?: 'interactive';
}
