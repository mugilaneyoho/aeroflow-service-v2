import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
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
  });

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://guest:guest@rabbitmq:5672'],
        queue: 'notifications',
        queueOptions: {
          durable: true,
        },
      },
    },
  )

  await app.startAllMicroservices();

  await app.listen(3010);
}
void bootstrap();
