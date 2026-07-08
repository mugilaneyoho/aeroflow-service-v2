import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { CreateGroupConversationDto } from "src/dto/Chat/create_group_conversation.dto";
import { CreatePrivateConversationDto } from "src/dto/Chat/create_private_conversation.dto";
import { EventPattern, Payload } from "@nestjs/microservices";

@Controller('chat')

export class ChatController {
    constructor (
        private chatService: ChatService
    ) {}

    @Post('group')
    async createGroupConversation (@Body() dto: CreateGroupConversationDto) {
        return this.chatService.createGroupConversation(dto)
    }

    @Get(':conversationId')
    async getConversationChats (@Param('conversationId') conversationId: string) {
        return this.chatService.getConversationChats(conversationId)
    }

    @Get('user/:userId')
    async getUserConversations (@Param('userId') userId: string) {
        return this.chatService.getUserConversations(userId)
    }

    @Post('create-private')
    async createPrivateConversation (@Body() dto: CreatePrivateConversationDto) {
        return this.chatService.createPrivateConversation(dto)
    }

    @EventPattern('group.created')
    async groupChatCreate(@Payload() data: any) {
        return this.chatService.createGroupConversation(data)
    }
}