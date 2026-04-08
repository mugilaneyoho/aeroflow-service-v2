import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      // url: 'postgresql://patron_727o_user:vNL871u0UdD5lEwe01ZqngnTCDgO7NtE@dpg-d6bvqg7tn9qs73c7qcqg-a.singapore-postgres.render.com/patron_727o',
      // ssl: {
      //   rejectUnauthorized: false,
      // },
      host: process.env.DB_HOST,
      port: 3306,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
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
        host: 'host.docker.internal',
        port: 6379,
      },
    }),
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
