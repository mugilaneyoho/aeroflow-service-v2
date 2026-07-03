import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ReadMessageDto } from "src/dto/Chat/read_message.dto";
import { SendMessageDto } from "src/dto/Chat/send_message.dto";
import { Message } from "src/entity/chat/message.entity";
import { MessageRead } from "src/entity/chat/message_read.entity";
import { NotificationPriority, NotificationRole, NotificationType } from "src/entity/notify";
import { NotificationService } from "src/notification/notification.service";
import { Repository } from "typeorm";
import { ChatGateway } from "./socket/chatsocket";

@Injectable()

export class ChatService {
    constructor(
        @InjectRepository(MessageRead) private messageReadRepo: Repository<MessageRead>,
        @InjectRepository(Message) private messageRepo: Repository<Message>,
        private notificationService: NotificationService,
        private socketService: ChatGateway
    ) { }

    async markAsRead(dto: ReadMessageDto) {

        await this.messageReadRepo.save({

            messageId: dto.messageId,

            userId: dto.userId

        });

    }

    async sendMessage(dto: SendMessageDto) {

        const message = this.messageRepo.create(dto);

        await this.messageRepo.save(message);

        // await this.notificationService.create({
        //     title: 'New Message',
        //     message: dto.message,
        //     userId: user.profile_id,
        //     type: NotificationType.INFO,
        //     priority: NotificationPriority.HIGH,
        //     Role: NotificationRole.ADMIN
        // })

        return message;
    }

    async getConversationChats(conversationId: string) {
        
    }


}