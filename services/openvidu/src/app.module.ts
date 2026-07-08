import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OpenViduService } from './openvidu/openvidu.service';
import { OpenviduModule } from './openvidu/openvidu.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomlistEntity } from './entities/roomlist.entity';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './role/role.guard';
import { ZoomModule } from './zoom/zoom.module';
import { SentryModule } from '@sentry/nestjs/setup';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: 'postgresql://postgres.zdecjomhcgznxutcrqzc:Wl0goP2dzzG905MX@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
      ssl: {
        rejectUnauthorized: false,
      },
      entities: [RoomlistEntity],
      synchronize: true,
    }),
    OpenviduModule,
    TypeOrmModule.forFeature([RoomlistEntity]),
    ZoomModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    OpenViduService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
