import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WorkSchedule } from './database/entities/work-schedule.entity';
import { Meeting } from './database/entities/meeting.entity';
import { NotificationLog } from './database/entities/notification-log.entity';
import { SeedClass } from './database/seed';
import { RolesGuard } from './role/role.guard';
import { APP_GUARD } from 'node_modules/@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'patron'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'root'),
        database: config.get<string>('DB_NAME', 'reception'),
        entities: [ WorkSchedule, Meeting, NotificationLog],
        synchronize: true, // Development auto sync
        logging: false,
      }),
    }),
    SchedulesModule,
    MeetingsModule,
    // NotificationsModule,
  ],
  providers: [
      {
        provide: APP_GUARD,
        useClass: RolesGuard,
      },
  ],
  // providers: [SeedClass]
})
export class AppModule {}
