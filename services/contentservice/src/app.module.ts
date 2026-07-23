import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SentryModule } from '@sentry/nestjs/setup';
import { ResourcesModule } from './resources/resources.module';
import { Note } from './resources/entities/resource.entity';
import { FileuploadModule } from './fileupload/fileupload.module';

@Module({
  imports: [
    // ⚠️ SentryModule MUST be first so it hooks in before other modules
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASS,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      //only for developement
      // url: 'postgresql://postgres.zdecjomhcgznxutcrqzc:Wl0goP2dzzG905MX@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
      ssl: false,
      entities: [Note],
      synchronize: true,
    }),
    ResourcesModule,
    FileuploadModule,
  ],
})
export class AppModule {}
