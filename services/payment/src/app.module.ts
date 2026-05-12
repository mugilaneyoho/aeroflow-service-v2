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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: 3306,
      username: process.env.DB_USER,
      database: process.env.DB_NAME,
      password: process.env.DB_PASS,
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
  ],
  controllers: [AppController],
  providers: [AppService, PdfService],
})
export class AppModule {}
