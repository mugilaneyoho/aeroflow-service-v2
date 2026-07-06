import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ReadMessageDto } from "src/dto/Chat/read_message.dto";
import { SendMessageDto } from "src/dto/Chat/send_message.dto";
import { Message } from "src/entity/chat/message.entity";
import { MessageRead } from "src/entity/chat/message_read.entity";
import { NotificationPriority, NotificationRole, NotificationType } from "src/entity/notify";
import { NotificationService } from "src/notification/notification.service";
import { Repository } from "typeorm";
import { CreatePrivateConversationDto } from "src/dto/Chat/create_private_conversation.dto";
import { Conversation, ConversationType } from "src/entity/chat/conversation.entity";
import { ConversationMember } from "src/entity/chat/conversation_member.entity";
import { CreateGroupConversationDto } from "src/dto/Chat/create_group_conversation.dto";

@Injectable()

export class ChatService {
    constructor(
        @InjectRepository(MessageRead) private messageReadRepo: Repository<MessageRead>,
        @InjectRepository(Message) private messageRepo: Repository<Message>,
        @InjectRepository(Conversation) private conversationRepo: Repository<Conversation>,
        @InjectRepository(ConversationMember) private memberRepo: Repository<ConversationMember>,
        // private notificationService: NotificationService,
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

    async createPrivateConversation(dto: CreatePrivateConversationDto) {
        const conversation = await this.conversationRepo.createQueryBuilder('conversation').leftJoinAndSelect('conversation.members', 'member').where('conversation.type = :type', { type: 'private' }).andWhere('members.userId IN (:...ids)', { ids: [dto.userId1, dto.userId2], }).getOne();

        if (conversation) {
            return conversation;
        }

        const newConversation = await this.conversationRepo.save({
            type: ConversationType.ONE_TO_ONE
        });

        await this.memberRepo.save([
            {
                conversation: newConversation,
                userId: dto.userId1,
                role: dto.role
            },
            {
                conversation: newConversation,
                userId: dto.userId2,
                role: dto.role
            }
        ]);

        return newConversation
    }

    async createGroupConversation(dto: CreateGroupConversationDto) {
        const conversation = await this.conversationRepo.save({
            type: ConversationType.GROUP,
            name: dto.name
        })

        await this.memberRepo.save(
            dto?.members?.map(userId => ({
                conversation,
                userId
            }))
        )

        return conversation;
    }
}