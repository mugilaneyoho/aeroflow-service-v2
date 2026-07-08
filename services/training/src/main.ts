// ⚠️ instrument.ts MUST be the very first import — Sentry needs to load before NestJS
import './instrument';

import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SentryGlobalFilter } from './sentry-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: '*' });

  // Register Sentry global filter to catch and report ALL unhandled errors
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryGlobalFilter(httpAdapter));

  const config = new DocumentBuilder()
    .setTitle('training')
    .setDescription('API document for training service')
    .setVersion('1.0')
    .build();

  const docuemnt = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, docuemnt);

  await app.listen(process.env.PORT ?? 3008);
}
void bootstrap();
