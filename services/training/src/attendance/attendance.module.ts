import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceEntity } from 'src/entities/attendance.entity';
import { StatusRecordEntity } from 'src/entities/statusrecord.entity';
import { QueueModule } from 'src/queue/queue.module';
import { OnlineClassesEntity } from 'src/entities/OnlineClass.entity';
import { OfflineClassesEntity } from 'src/entities/OfflineClass.entity';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AttendanceProcessor } from './attendance.processor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forFeature([
      StatusRecordEntity,
      AttendanceEntity,
      OnlineClassesEntity,
      OfflineClassesEntity,
    ]),
    ClientsModule.register([
      {
        name: 'batch',
        transport: Transport.GRPC,
        options: {
          package: 'batch',
          protoPath: join(__dirname, '../proto/batch.proto'),
          url: 'institute-service:3003',
        },
      },
    ]),
    QueueModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceProcessor],
})
export class AttendanceModule {}
