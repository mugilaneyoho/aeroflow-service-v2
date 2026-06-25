import { IsString } from "class-validator";

export class PlacementInviteDto {
    @IsString()
    placementId!: string;

    @IsString()
    studentId?: string;

    @IsString()
    invitedBy?: string;
}