import { Module } from '@nestjs/common';
import { SentryModule } from '@sentry/nestjs/setup';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LeadsModule } from './leads/leads.module';
import { QueueModule } from './queue/queue.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsEntity } from './entities/leads.entity';
import { BullModule } from '@nestjs/bull';
import { EmployeeModule } from './employee/employee.module';
import { EmployeEntity } from './entities/employee.entity';
import { ConfigModule } from '@nestjs/config';
import { PaymentModule } from './payment/payment.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './role/role.guard';

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
      ssl: {
        rejectUnauthorized: false,
      },
      // host: process.env.DB_HOST, vvhRSnD23kdzuqKW
      // port: 3306,
      // username: process.env.DB_USER,
      // database: process.env.DB_NAME,
      // password: process.env.DB_PASS,
      entities: [LeadsEntity, EmployeEntity],
      synchronize: true,
      maxQueryExecutionTime: 20,
    }),
    TypeOrmModule.forFeature([LeadsEntity, EmployeEntity]),
    BullModule.forRoot({
      redis: {
        host: 'redis',
        port: 6379,
        maxRetriesPerRequest: null,
      },
    }),
    LeadsModule,
    QueueModule,
    EmployeeModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
