// ⚠️ instrument.ts MUST be the very first import — Sentry needs to load before NestJS
import './instrument';

import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { SentryGlobalFilter } from './sentry-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Register Sentry global filter to catch and report ALL unhandled errors
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryGlobalFilter(httpAdapter));

  await app.listen(process.env.PORT ?? 3020);
  console.log('Placement service is listening');
}
bootstrap();
