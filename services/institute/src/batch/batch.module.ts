import { Module } from '@nestjs/common';
import { BatchController } from './batch.controller';
import { BatchService } from './batch.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchEntity } from 'src/entities/batch.entity';
import { StudentProfileEntity } from 'src/entities/student.entity';
import { BullModule } from '@nestjs/bull';
import { QueueModule } from 'src/queue/queue.module';
import { BatchProcessor } from './batch.processor';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([BatchEntity, StudentProfileEntity]),
    BullModule.forRoot({
      redis: {
        host: 'redis',
        port: 6379,
        maxRetriesPerRequest: null,
      },
    }),
    QueueModule,
    ClientsModule.register([
      {
        name: 'CHAT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@rabbitmq:5672'],
          queue: 'chats',
          queueOptions: {
            durable: true
          },
          sosocketOptions: {
            reconnectTimeInSeconds: 5,
            heartbeatIntervalInSeconds: 10,
          },
        }
      },
    ])
  ],
  controllers: [BatchController],
  providers: [BatchService, BatchProcessor],
})
export class BatchModule { }
