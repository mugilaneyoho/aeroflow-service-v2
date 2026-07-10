import { Logger, Module } from '@nestjs/common';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfflineClassesEntity } from 'src/entities/OfflineClass.entity';
import { OnlineClassesEntity } from 'src/entities/OnlineClass.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forFeature([OfflineClassesEntity, OnlineClassesEntity]),
    ClientsModule.register([
      {
        name: 'course',
        transport: Transport.GRPC,
        options: {
          package: 'course',
          protoPath: join(__dirname, '../proto/course.proto'),
          url: 'institute-service:3003',
        },
      },
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
    ClientsModule.register([
      {
        name: 'notifyandlogs',
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
  controllers: [ClassesController],
  providers: [ClassesService, Logger],
})
export class ClassesModule {}
