import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from '../entity/notify';
import { NotificationGateway } from './socket/notificationsocket';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity]),

    ClientsModule.register([
      {
        name: 'notify',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@rabbitmq:5672'],
          queue: 'notifications',
          queueOptions: {
            durable: true,
          },
          sosocketOptions: {
            reconnectTimeInSeconds: 5,
            heartbeatIntervalInSeconds: 10,
          },
        },
      },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway]
})
export class NotificationModule {}
