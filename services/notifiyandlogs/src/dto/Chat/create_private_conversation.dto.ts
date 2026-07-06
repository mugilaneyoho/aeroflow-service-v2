import { IsEnum, IsString } from "class-validator";
import { ConversationRole } from "src/entity/chat/conversation.entity";

export class CreatePrivateConversationDto {
    @IsString()
    userId1!: string;

    @IsEnum(ConversationRole)
    role1!: ConversationRole;

    @IsString()
    userId2!: string;

    @IsEnum(ConversationRole)
    role2!: ConversationRole;
}