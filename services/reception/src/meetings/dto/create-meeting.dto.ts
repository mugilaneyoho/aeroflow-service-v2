import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateMeetingDto {
    @IsString()
    @IsNotEmpty()
    visitor: string;

    @IsString()
    @IsNotEmpty()
    mobileNumber: string;

    @IsString()
    @IsNotEmpty()
    purposeOfMeeting: string;

    @IsString()
    @IsNotEmpty()
    requestedTime: string;

    @IsString()
    date: string;

    @IsString()
    meetingId: string;

}