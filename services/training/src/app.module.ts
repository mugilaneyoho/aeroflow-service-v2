import { Module } from '@nestjs/common';
import { SentryModule } from '@sentry/nestjs/setup';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffModule } from './staff/staff.module';
import { StaffProfileEntity } from './entities/staff.entity';
import { OfflineClassesEntity } from './entities/OfflineClass.entity';
import { OnlineClassesEntity } from './entities/OnlineClass.entity';
import { ClassesModule } from './classes/classes.module';
import { AttendanceEntity } from './entities/attendance.entity';
import { StatusRecordEntity } from './entities/statusrecord.entity';
import { AttendanceModule } from './attendance/attendance.module';
import { BullModule } from '@nestjs/bull';
import { QueueModule } from './queue/queue.module';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './role/role.guard';
import { ScheduleModule } from '@nestjs/schedule';

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
      //only for development
      // url: 'postgresql://postgres.zdecjomhcgznxutcrqzc:Wl0goP2dzzG905MX@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
      ssl: false,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASS,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      entities: [
        StaffProfileEntity,
        OfflineClassesEntity,
        OnlineClassesEntity,
        AttendanceEntity,
        StatusRecordEntity,
      ],
      synchronize: true,
    }),
    ClientsModule.register([
      {
        name: 'common',
        transport: Transport.GRPC,
        options: {
          package: 'common',
          protoPath: join(__dirname, './proto/common.proto'),
          url: 'institute-service:3003',
        },
      },
      {
        name: 'batch',
        transport: Transport.GRPC,
        options: {
          package: 'batch',
          protoPath: join(__dirname, './proto/batch.proto'),
          url: 'institute-service:3003',
        },
      },
      {
        name: 'student',
        transport: Transport.GRPC,
        options: {
          package: 'student',
          protoPath: join(__dirname, './proto/student.proto'),
          url: 'institute-service:3003',
        },
      },
    ]),
    TypeOrmModule.forFeature([
      OnlineClassesEntity,
      OfflineClassesEntity,
      StaffProfileEntity,
      AttendanceEntity,
      StatusRecordEntity,
    ]),
    BullModule.forRoot({
      redis: {
        host: 'redis',
        port: 6379,
      },
    }),
    ScheduleModule.forRoot(),
    StaffModule,
    ClassesModule,
    AttendanceModule,
    QueueModule,
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
export class AppModule {}
