import { IsString } from "class-validator";

export class updatePlacementInviteDto {
    @IsString()
    responseStatus?: 'ACCEPTED' | 'REJECTED';

    @IsString()
    reason?: string;
}