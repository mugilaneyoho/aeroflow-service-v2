import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ReadMessageDto } from "src/dto/Chat/read_message.dto";
import { SendMessageDto } from "src/dto/Chat/send_message.dto";
import { Message } from "src/entity/chat/message.entity";
import { MessageRead } from "src/entity/chat/message_read.entity";
import { NotificationPriority, NotificationRole, NotificationType } from "src/entity/notify";
import { NotificationService } from "src/notification/notification.service";
import { Repository, In, IsNull } from "typeorm";
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

        await this.conversationRepo.update(dto.conversationId, {
            lastMessageId: message.id,
            lastMessageAt: message.createdAt,
        });

        const member = await this.memberRepo.findOne({
            where: {
                conversationId: dto.conversationId,
                userId: dto.senderId,
            },
        });

        return {
            id: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            userName: member?.userName,
            role: member?.role,
            message: message.message,
            messageType: message.messageType,
            status: message.status,
            visibility: message.visibility,
            replyMessageId: message.replyMessageId,
            isEdited: message.isEdited,
            editedAt: message.editedAt,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
            deletedAt: message.deletedAt,
            clientMessageId: dto?.clientMessageId
        };
    }

    async getConversationChats(conversationId: string) {
        const messages = await this.messageRepo
            .createQueryBuilder('message')
            .leftJoin(
                ConversationMember,
                'member',
                '"member"."userId" = "message"."senderId" AND "member"."conversationId" = "message"."conversationId"',
            )
            .select([
                'message.id',
                'message.conversationId',
                'message.senderId',
                'message.message',
                'message.messageType',
                'message.status',
                'message.visibility',
                'message.replyMessageId',
                'message.isEdited',
                'message.editedAt',
                'message.createdAt',
                'message.updatedAt',
                'message.deletedAt',
            ])
            .addSelect('member.userName', 'userName')
            .addSelect('member.role', 'role')
            .where('message.conversationId = :conversationId', { conversationId })
            .orderBy('message.createdAt', 'ASC')
            .getRawMany();

        return messages.map(message => ({
            id: message.message_id,
            conversationId: message.message_conversationId,
            senderId: message.message_senderId,
            userName: message.userName,
            role: message.role,
            message: message.message_message,
            messageType: message.message_messageType,
            status: message.message_status,
            visibility: message.message_visibility,
            replyMessageId: message.message_replyMessageId,
            isEdited: message.message_isEdited,
            editedAt: message.message_editedAt,
            createdAt: message.message_createdAt,
            updatedAt: message.message_updatedAt,
            deletedAt: message.message_deletedAt,
        }));
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
            relations: ['members','messages'],
            order: { lastMessageAt: 'DESC' }
        });
    }

    async createPrivateConversation(dto: CreatePrivateConversationDto) {
        // Check whether a private conversation already exists
        const existingConversation = await this.conversationRepo
            .createQueryBuilder('conversation')
            .innerJoin('conversation.members', 'member')
            .where('conversation.type = :type', {
                type: ConversationType.ONE_TO_ONE,
            })
            .andWhere('member.userId IN (:...userIds)', {
                userIds: [dto.userId1, dto.userId2],
            })
            .groupBy('conversation.id')
            .having('COUNT(member.id) = 2')
            .andHaving('COUNT(DISTINCT member.userId) = 2')
            .getOne();

        if (existingConversation) {
            return this.conversationRepo.findOne({
                where: { id: existingConversation.id },
                relations: ['members'],
            });
        }

        // Create new conversation
        const conversation = await this.conversationRepo.save({
            type: ConversationType.ONE_TO_ONE,
            name: dto.userName2,
            createdBy: dto.userId1,
            status: ConversationStatus.ACTIVE,
        });

        await this.memberRepo.save([
            {
                conversation,
                userId: dto.userId1,
                userName: dto.userName1,
                role: dto.role1,
            },
            {
                conversation,
                userId: dto.userId2,
                userName: dto.userName2,
                role: dto.role2,
            },
        ]);

        return this.conversationRepo.findOne({
            where: { id: conversation.id },
            relations: ['members'],
        });
    }

    async createGroupConversation(dto: CreateGroupConversationDto) {
        console.log("Dto....", dto)
        const conversation = await this.conversationRepo.save({
            type: ConversationType.GROUP,
            name: dto.name,
            createdBy: dto.members[0] || 'system',
            status: ConversationStatus.ACTIVE
        });

        await this.memberRepo.save(
            dto?.members?.map((member: any) => ({
                conversation,
                userId: member.userId,
                role: member.role,
                userName: member.name
            }))
        );

        return this.conversationRepo.findOne({
            where: { id: conversation.id },
            relations: ['members']
        });
    }

    async getConversationMembers (conversationId: string) {
        return this.memberRepo.find({where: {conversationId: conversationId, deletedAt: IsNull()}})
    }
}