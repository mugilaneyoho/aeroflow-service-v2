import { IsString } from "class-validator";

export class ReadMessageDto {
    @IsString()
    userId!: string;

    @IsString()
    messageId!: string;
}