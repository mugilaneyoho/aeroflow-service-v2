import { Module } from '@nestjs/common';
import { VisitorsModule } from './visitors/visitors.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingsModule } from './meetings/meetings.module';
import { Visitor } from './visitors/entities/visitor.entity';
import { Meeting } from './meetings/entities/meeting.entity';
import { ConfigModule } from '@nestjs/config';
import { SentryModule } from '@sentry/nestjs/setup';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
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
      entities: [Visitor, Meeting],
      synchronize: true,
    }),
    VisitorsModule,
    MeetingsModule,
  ],
})
export class AppModule {}
