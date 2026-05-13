import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
  });
  // const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  //   AppModule,
  //   {
  //     transport: Transport.GRPC,
  //     options: {
  //       package: ['payment', 'fees'],
  //       protoPath: [
  //         join(__dirname, './proto/payment.proto'),
  //         join(__dirname, './proto/fees.proto'),
  //       ],
  //       url: `0.0.0.0:${process.env.GRPC_PORT}`,
  //     },
  //   },
  // );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: ['payment', 'fees'],
      protoPath: [
        join(__dirname, './proto/payment.proto'),
        join(__dirname, './proto/fees.proto'),
      ],
      url: `0.0.0.0:${process.env.GRPC_PORT ?? 3011}`,
    },
  });

  await app.startAllMicroservices();

  // await app.listen();
  await app.listen(process.env.PORT ?? 3021);
}
void bootstrap();
