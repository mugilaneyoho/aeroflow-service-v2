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
import { Conversation } from "src/entity/chat/conversation.entity";
import { ConversationType, ConversationStatus } from "src/entity/chat/enums";
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
        const members = await this.memberRepo.find({ where: { conversationId } });
        const memberMap = new Map(members.map(m => [m.userId, { userName: m.userName, role: m.role }]));

        const messages = await this.messageRepo.find({
            where: { conversationId },
            relations: ['reads'],
            order: { createdAt: 'ASC' },
        });

        return messages.map(msg => {
            const senderInfo = memberMap.get(msg.senderId);
            return {
                id: msg.id,
                conversationId: msg.conversationId,
                senderId: msg.senderId,
                message: msg.message,
                messageType: msg.messageType,
                status: msg.status,
                visibility: msg.visibility,
                replyMessageId: msg.replyMessageId,
                isEdited: msg.isEdited,
                editedAt: msg.editedAt,
                createdAt: msg.createdAt,
                updatedAt: msg.updatedAt,
                deletedAt: msg.deletedAt,
                userName: senderInfo?.userName || '',
                role: senderInfo?.role || '',
                reads: msg.reads || [],
            };
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

        const conversations = await this.conversationRepo.find({
            where: { id: In(conversationIds) },
            relations: ['members'],
            order: { lastMessageAt: 'DESC' }
        });

        const results = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await this.messageRepo
                    .createQueryBuilder('message')
                    .leftJoin('message.reads', 'reads', 'reads.userId = :userId', { userId })
                    .where('message.conversationId = :conversationId', { conversationId: conv.id })
                    .andWhere('message.senderId != :userId', { userId })
                    .andWhere('reads.id IS NULL')
                    .getCount();

                let lastMessage: Message | null = null;
                if (conv.lastMessageId) {
                    lastMessage = await this.messageRepo.findOne({ where: { id: conv.lastMessageId } });
                } else {
                    lastMessage = await this.messageRepo.findOne({
                        where: { conversationId: conv.id },
                        order: { createdAt: 'DESC' }
                    });
                }

                return {
                    ...conv,
                    unreadCount,
                    lastMessage: lastMessage ? lastMessage.message : null,
                };
            })
        );

        return results;
    }

    async createPrivateConversation(dto: CreatePrivateConversationDto) {
        const user1Convs = await this.memberRepo.find({
            where: { userId: dto.userId1 },
            select: ['conversationId'],
        });
        const convIds = user1Convs.map(c => c.conversationId);

        if (convIds.length > 0) {
            const existingMember = await this.memberRepo.findOne({
                where: {
                    conversationId: In(convIds),
                    userId: dto.userId2,
                    conversation: { type: ConversationType.ONE_TO_ONE },
                },
                relations: ['conversation'],
            });

            if (existingMember && existingMember.conversation) {
                return this.conversationRepo.findOne({
                    where: { id: existingMember.conversationId },
                    relations: ['members'],
                });
            }
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
                userName: dto.userName1 || 'Staff',
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
        const creatorId = typeof dto.members[0] === 'string'
            ? dto.members[0]
            : ((dto.members[0] as any)?.userId || 'system');

        const conversation = await this.conversationRepo.save({
            type: ConversationType.GROUP,
            name: dto.name,
            createdBy: creatorId,
            status: ConversationStatus.ACTIVE
        });

        if (dto.members && dto.members.length > 0) {
            await this.memberRepo.save(
                dto.members.map((member: any) => ({
                    conversation,
                    userId: typeof member === 'string' ? member : member.userId,
                    role: (typeof member === 'object' && member.role) ? member.role : 'STAFF',
                    userName: (typeof member === 'object' && (member.name || member.userName)) ? (member.name || member.userName) : (typeof member === 'string' ? member : member.userId)
                }))
            );
        }

        return this.conversationRepo.findOne({
            where: { id: conversation.id },
            relations: ['members']
        });
    }

    async getConversationMembers(conversationId: string) {
        return this.memberRepo.find({ where: { conversationId: conversationId, deletedAt: IsNull() } })
    }

    async markConversationAsRead(conversationId: string, userId: string) {
        const messages = await this.messageRepo
            .createQueryBuilder('message')
            .leftJoin('message.reads', 'reads', 'reads.userId = :userId', { userId })
            .where('message.conversationId = :conversationId', { conversationId })
            .andWhere('message.senderId != :userId', { userId })
            .andWhere('reads.id IS NULL')
            .getMany();

        if (messages.length === 0) {
            return { messageIds: [] };
        }

        await this.messageReadRepo
            .createQueryBuilder()
            .insert()
            .into(MessageRead)
            .values(
                messages.map((m) => ({
                    messageId: m.id,
                    userId
                })),
            )
            .orIgnore()
            .execute();

        return {
            messageIds: messages.map((m) => m.id)
        };
    }
}