import { IsEnum, IsString } from "class-validator";
import { MessageStatus, MessageType, MessageVisibility } from "src/entity/chat/enums";

export class SendMessageDto {
    @IsString()
    conversationId!: string;

    @IsString()
    senderId!: string;

    @IsString()
    message!: string;

    @IsEnum({type: 'enum', enum: MessageType})
    messageType!: MessageType;

    @IsEnum({type: 'enum', enum: MessageStatus})
    status!: MessageStatus;

    @IsEnum({type: 'enum', enum: MessageVisibility})
    visibility!: MessageVisibility;

    @IsString()
    replyMessageId!: string;

    @IsString()
    clientMessageId?: string;
}