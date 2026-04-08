import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntiry } from './entities/payment.entity';
import { StudentFeesEntity } from './entities/studentfees.entity';
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
      database: process.env.DB_NAME,
      password: process.env.DB_PASS,
      entities: [StudentFeesEntity, PaymentEntiry],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([StudentFeesEntity, PaymentEntiry]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
