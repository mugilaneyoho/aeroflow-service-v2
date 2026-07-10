import { Module } from '@nestjs/common';
import { ActivelogController } from './activelog.controller';
import { ActivelogService } from './activelog.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogEntity } from '../entity/activitylog';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityLogEntity]),
    ClientsModule.register([
      {
        name: 'activelog',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@localhost:5672'],
          queue: 'notifications',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [ActivelogController],
  providers: [ActivelogService],
})
export class ActivelogModule {}
