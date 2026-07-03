import { Controller, Get, Param } from "@nestjs/common";
import { ChatService } from "./chat.service";

@Controller('chat')

export class ChatController {
    constructor (
        private chatService: ChatService
    ) {}

    @Get(':conversationId')
    async getConversationChats (@Param('conversationId') conversationId: string) {
        return this.chatService.getConversationChats(conversationId)
    }
}