import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './tickets/ticket.entity';
import { TicketsModule } from './tickets/tickets.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './role/role.guard';
import { ConfigModule } from '@nestjs/config';
import { SentryModule } from '@sentry/nestjs/setup';

@Module({
  imports: [
    // ⚠️ SentryModule MUST be first so it hooks in before other modules
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: 'postgresql://postgres.zdecjomhcgznxutcrqzc:Wl0goP2dzzG905MX@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
      ssl: { rejectUnauthorized: false },
      entities: [Ticket],
      synchronize: true,
    }),
    TicketsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: RolesGuard }],
})
export class AppModule {}
