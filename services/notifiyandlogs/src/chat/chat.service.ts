import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ReadMessageDto } from "src/dto/Chat/read_message.dto";
import { SendMessageDto } from "src/dto/Chat/send_message.dto";
import { Message } from "src/entity/chat/message.entity";
import { MessageRead } from "src/entity/chat/message_read.entity";
import { NotificationPriority, NotificationRole, NotificationType } from "src/entity/notify";
import { NotificationService } from "src/notification/notification.service";
import { Repository, In } from "typeorm";
import { CreatePrivateConversationDto } from "src/dto/Chat/create_private_conversation.dto";
import { Conversation, ConversationType, ConversationStatus } from "src/entity/chat/conversation.entity";
import { ConversationMember } from "src/entity/chat/conversation_member.entity";
import { CreateGroupConversationDto } from "src/dto/Chat/create_group_conversation.dto";

@Injectable()

export class ChatService {
    constructor(
        @InjectRepository(MessageRead) private messageReadRepo: Repository<MessageRead>,
        @InjectRepository(Message) private messageRepo: Repository<Message>,
        @InjectRepository(Conversation) private conversationRepo: Repository<Conversation>,
        @InjectRepository(ConversationMember) private memberRepo: Repository<ConversationMember>,
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

        // Update the conversation with the last message info
        await this.conversationRepo.update(dto.conversationId, {
            lastMessageId: message.id,
            lastMessageAt: message.createdAt
        });

        return message;
    }

    async getConversationChats(conversationId: string) {
        return this.messageRepo.find({
            where: { conversationId },
            order: { createdAt: 'ASC' },
            relations: ['attachments']
        });
    }

    async getUserConversations(userId: string) {
        const memberConversations = await this.memberRepo.find({
            where: { userId },
            select: ['conversationId']
        });

        if (memberConversations.length === 0) {
            return [];
        }

        const conversationIds = memberConversations.map(mc => mc.conversationId);

        return this.conversationRepo.find({
            where: { id: In(conversationIds) },
            relations: ['members'],
            order: { lastMessageAt: 'DESC' }
        });
    }

    async createPrivateConversation(dto: CreatePrivateConversationDto) {
        // Query to find an existing ONE_TO_ONE conversation between the two users
        const conversation = await this.conversationRepo.createQueryBuilder('conversation')
            .innerJoin('conversation.members', 'm1')
            .innerJoin('conversation.members', 'm2')
            .where('conversation.type = :type', { type: ConversationType.ONE_TO_ONE })
            .andWhere('m1.userId = :userId1', { userId1: dto.userId1 })
            .andWhere('m2.userId = :userId2', { userId2: dto.userId2 })
            .leftJoinAndSelect('conversation.members', 'member')
            .getOne();

        if (conversation) {
            return conversation;
        }

        const newConversation = await this.conversationRepo.save({
            type: ConversationType.ONE_TO_ONE,
            name: `Private_${dto.userId1}_${dto.userId2}`,
            createdBy: dto.userId1,
            status: ConversationStatus.ACTIVE
        });

        await this.memberRepo.save([
            {
                conversation: newConversation,
                userId: dto.userId1,
                role: dto.role1
            },
            {
                conversation: newConversation,
                userId: dto.userId2,
                role: dto.role2
            }
        ]);

        return this.conversationRepo.findOne({
            where: { id: newConversation.id },
            relations: ['members']
        });
    }

    async createGroupConversation(dto: CreateGroupConversationDto) {
        const conversation = await this.conversationRepo.save({
            type: ConversationType.GROUP,
            name: dto.name,
            createdBy: dto.members[0] || 'system',
            status: ConversationStatus.ACTIVE
        });

        await this.memberRepo.save(
            dto?.members?.map(userId => ({
                conversation,
                userId,
                role: 'STUDENT' as any // Default role inside group members
            }))
        );

        return this.conversationRepo.findOne({
            where: { id: conversation.id },
            relations: ['members']
        });
    }
}