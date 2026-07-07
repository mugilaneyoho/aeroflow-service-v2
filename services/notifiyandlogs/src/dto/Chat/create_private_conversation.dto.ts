import { IsEnum, IsString } from "class-validator";
import { ConversationRole } from "src/entity/chat/chat_enum";

export class CreatePrivateConversationDto {
    @IsString()
    userId1!: string;

    @IsString()
    userId2!: string;

    @IsEnum(ConversationRole)
    role!: ConversationRole
}