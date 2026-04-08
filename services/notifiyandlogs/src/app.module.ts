import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ActivelogModule } from './activelog/activelog.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogEntity } from './entity/activitylog';
import { NotificationModule } from './notification/notification.module';
import { NotificationEntity } from './entity/notify';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      // url: 'postgresql://patron_727o_user:vNL871u0UdD5lEwe01ZqngnTCDgO7NtE@dpg-d6bvqg7tn9qs73c7qcqg-a.singapore-postgres.render.com/patron_727o',
      // ssl: {
      //   rejectUnauthorized: false,
      // },
      host: process.env.DB_HOST,
      port: 3306,
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      entities: [ActivityLogEntity, NotificationEntity],
      synchronize: true,
    }),

    ActivelogModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
