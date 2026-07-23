import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntiry } from './entities/payment.entity';
import { StudentFeesEntity } from './entities/studentfees.entity';
import { ConfigModule } from '@nestjs/config';
import { PdfService } from './template/pdf.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { RazorpayModule } from './razorpay/razorpay.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './role/role.guard';
import { IncoiveService } from './template/export.service';
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
      // only for development
      // url: 'postgresql://postgres.zdecjomhcgznxutcrqzc:Wl0goP2dzzG905MX@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres',
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASS,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      ssl: false,
      entities: [StudentFeesEntity, PaymentEntiry],
      synchronize: true,
    }),
    ClientsModule.register([
      {
        name: 'student',
        transport: Transport.GRPC,
        options: {
          package: 'student',
          protoPath: join(__dirname, './proto/student.proto'),
          url: 'institute-service:3003',
        },
      },
    ]),
    TypeOrmModule.forFeature([StudentFeesEntity, PaymentEntiry]),
    RazorpayModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PdfService,
    IncoiveService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
