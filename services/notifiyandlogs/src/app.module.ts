import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ActivelogModule } from './activelog/activelog.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogEntity } from './entity/activitylog';
import { NotificationModule } from './notification/notification.module';
import { NotificationEntity } from './entity/notify';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { Message } from './entity/chat/message.entity';
import { MessageRead } from './entity/chat/message_read.entity';
import { Conversation } from './entity/chat/conversation.entity';
import { ConversationMember } from './entity/chat/conversation_member.entity';
import { Attachment } from './entity/chat/attachment.entity';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: 'postgresql://postgres.zdecjomhcgznxutcrqzc:Wl0goP2dzzG905MX@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
      ssl: {
        rejectUnauthorized: false,
      },
      host: process.env.DB_HOST,
      port: 3306,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [ActivityLogEntity, NotificationEntity, Message, MessageRead, Conversation, ConversationMember, Attachment],
      synchronize: true,
    }),

    ActivelogModule,
    NotificationModule,
    ChatModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
