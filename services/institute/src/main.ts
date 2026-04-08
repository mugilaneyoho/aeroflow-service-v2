import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: ['course', 'batch', 'common'],
      protoPath: [
        join(__dirname, './proto/course.proto'),
        join(__dirname, './proto/batch.proto'),
        join(__dirname, './proto/common.proto'),
      ],
      url: `0.0.0.0:${process.env.PORT_GRPC}`,
    },
  });

  await app.startAllMicroservices();

  const config = new DocumentBuilder()
    .setTitle('institute')
    .setDescription('API document for institute service')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3004);
}
void bootstrap();
