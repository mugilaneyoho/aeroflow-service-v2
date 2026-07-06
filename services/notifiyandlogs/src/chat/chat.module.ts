import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Attachment } from "src/entity/chat/attachment.entity";
import { Conversation } from "src/entity/chat/conversation.entity";
import { ConversationMember } from "src/entity/chat/conversation_member.entity";
import { Message } from "src/entity/chat/message.entity";
import { MessageRead } from "src/entity/chat/message_read.entity";
import { ChatGateway } from "./socket/chatsocket";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";

@Module({
    imports: [TypeOrmModule.forFeature([Message, Conversation, ConversationMember, MessageRead, Attachment])],
    providers: [ChatGateway, ChatService],
    controllers: [ChatController],
    exports: [ChatService]
})

export class ChatModule {}