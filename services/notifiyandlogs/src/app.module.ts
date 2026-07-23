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
import { SentryModule } from '@sentry/nestjs/setup';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASS,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      //only for development
      // url: 'postgresql://postgres.zdecjomhcgznxutcrqzc:Wl0goP2dzzG905MX@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
      ssl: false,
      entities: [
        ActivityLogEntity,
        NotificationEntity,
        Message,
        MessageRead,
        Conversation,
        ConversationMember,
        Attachment,
      ],
      synchronize: true,
    }),

    ActivelogModule,
    NotificationModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
