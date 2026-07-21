import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { SendMessageDto } from "src/dto/Chat/send_message.dto";
import { ChatService } from "../chat.service";

@WebSocketGateway({
    cors: {
        origin: (origin: any, callback: any) => callback(null, true),
        methods: ["GET", "POST"],
        credentials: true
    },
})
export class ChatGateway {
    @WebSocketServer()
    server!: Server;

    constructor(
        private readonly messageService: ChatService,
    ) { }

    @SubscribeMessage('joinConversation')
    async joinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: { conversationId: string },
    ) {
        client.join(body.conversationId);
    }

    @SubscribeMessage('leaveConversation')
    async leaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: { conversationId: string },
    ) {
        client.leave(body.conversationId);
    }

    @SubscribeMessage('sendMessage')
    async sendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() dto: SendMessageDto,
    ) {
        const message = await this.messageService.sendMessage(dto);

        this.server
            .to(dto.conversationId)
            .emit('receiveMessage', message);
    }

    @SubscribeMessage('typing')
    typing(
        @ConnectedSocket() client: Socket,
        @MessageBody() body: {
            conversationId: string,
            userId: string
        }
    ) {
        client.to(body.conversationId)
            .emit('typing', body);
    }

    @SubscribeMessage('message:read')
    async readMessage(
        @ConnectedSocket() socket: Socket,
        @MessageBody() body: {
            conversationId: string;
            userId: string;
        }
    ) {
        const result = await this.messageService.markConversationAsRead(
            body.conversationId,
            body.userId
        )

        this.server
            .to(body.conversationId)
            .emit('message:read:update', {
                conversationId: body.conversationId,
                userId: body.userId,
                message: result.messageIds
            })
    }
}