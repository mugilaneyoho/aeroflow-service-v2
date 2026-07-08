// ⚠️ instrument.ts MUST be the very first import — Sentry needs to load before NestJS
import './instrument';

import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { SentryGlobalFilter } from './sentry-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: ['payment', 'fees'],
      protoPath: [
        join(__dirname, './proto/payment.proto'),
        join(__dirname, './proto/fees.proto'),
      ],
      url: `0.0.0.0:${process.env.GRPC_PORT ?? 3011}`,
      loader: {
          keepCase: true,
        },
    },
  });

  // Register Sentry global filter to catch and report ALL unhandled errors
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryGlobalFilter(httpAdapter));

  await app.startAllMicroservices();

  await app.listen(process.env.PORT ?? 3021);
}
void bootstrap();
