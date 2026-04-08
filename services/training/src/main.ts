import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
  });

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
