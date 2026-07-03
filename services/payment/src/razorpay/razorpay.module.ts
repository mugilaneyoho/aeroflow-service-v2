import { Module } from '@nestjs/common';
import { RazorpayController } from './razorpay.controller';
import { RazorpayService } from './razorpay.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntiry } from 'src/entities/payment.entity';
import { StudentFeesEntity } from 'src/entities/studentfees.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forFeature([PaymentEntiry, StudentFeesEntity]),
    ClientsModule.register([
      {
        name: 'student',
        transport: Transport.GRPC,
        options: {
          package: 'student',
          protoPath: join(__dirname, '../proto/student.proto'),
          url: 'institute-service:3003',
        },
      },
    ]),
  ],
  controllers: [RazorpayController],
  providers: [RazorpayService],
})
export class RazorpayModule {}
