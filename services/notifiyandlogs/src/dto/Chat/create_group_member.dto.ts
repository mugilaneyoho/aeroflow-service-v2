import { IsString } from "class-validator";

export class CreateGroupMemberDto {
    @IsString()
    userId!: string;
}