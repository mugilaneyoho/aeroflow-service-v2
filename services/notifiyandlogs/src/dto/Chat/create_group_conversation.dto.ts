import { IsArray, IsString } from "class-validator";

export class CreateGroupConversationDto {
    @IsString()
    name!: string;

    @IsArray()
    members!: string[];
}