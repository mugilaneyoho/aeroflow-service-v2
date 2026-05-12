import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsEntity } from 'src/entities/leads.entity';
import { QueueModule } from 'src/queue/queue.module';
import { LeadProcessor } from './leads.processor';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeadsEntity]),
    ClientsModule.register([
      {
        name: 'activelog-service',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'notifyandlog',
            brokers: ['kafka:9092'],
          },
          consumer: {
            groupId: 'notifyandlog-consumer',
          },
        },
      },
    ]),
    QueueModule,
  ],
  controllers: [LeadsController],
  providers: [LeadsService, LeadProcessor],
})
export class LeadsModule {}
