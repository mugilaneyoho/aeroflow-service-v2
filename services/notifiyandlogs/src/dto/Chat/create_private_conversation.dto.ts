import { IsEnum, IsString } from "class-validator";
import { ConversationRole } from "src/entity/chat/enums";

export class CreatePrivateConversationDto {
    @IsString()
    userId1!: string;

    @IsEnum(ConversationRole)
    role1!: ConversationRole;

    @IsString()
    userId2!: string;

    @IsEnum(ConversationRole)
    role2!: ConversationRole;

    @IsString()
    userName1?: string;

    @IsString()
    userName2!: string;
}