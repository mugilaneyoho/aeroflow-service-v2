import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.KAFKA,
  //   options: {
  //     client: {
  //       clientId: 'notifyandlog',
  //       brokers: ['localhost:29092'],
  //     },
  //     consumer: {
  //       groupId: 'notifyandlog-consumer',
  //     },
  //     // producer: {
  //     //   allowAutoTopicCreation: true,
  //     // },
  //   },
  // });
  // await app.startAllMicroservices();

  await app.listen(3010);
}
void bootstrap();
