import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { CreateGroupConversationDto } from "src/dto/Chat/create_group_conversation.dto";
import { CreatePrivateConversationDto } from "src/dto/Chat/create_private_conversation.dto";

@Controller('chat')

export class ChatController {
    constructor (
        private chatService: ChatService
    ) {}

    @Get(':conversationId')
    async getConversationChats (@Param('conversationId') conversationId: string) {
        return this.chatService.getConversationChats(conversationId)
    }

    @Post('create-group')
    async createGroupConversation (@Body() dto: CreateGroupConversationDto) {
        return this.chatService.createGroupConversation(dto)
    }

    @Post('create-private')
    async createPrivateConversation (@Body() dto: CreatePrivateConversationDto) {
        return this.chatService.createPrivateConversation(dto)
    }
}