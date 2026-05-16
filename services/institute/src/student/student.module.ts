import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentProfileEntity } from 'src/entities/student.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { CourseEntity } from 'src/entities/course.entity';
import { BatchEntity } from 'src/entities/batch.entity';
import { PdfService } from 'src/template/pdfService';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentProfileEntity, CourseEntity, BatchEntity]),
    ClientsModule.register([
      {
        name: 'student',
        transport: Transport.GRPC,
        options: {
          package: 'student',
          protoPath: join(__dirname, '../proto/student.proto'),
          url: 'authentication-service:3001',
          loader: {
            keepCase: true,
          },
        },
      },
      {
        name: 'payment_fee',
        transport: Transport.GRPC,
        options: {
          package: 'fees',
          protoPath: join(__dirname, '../proto/fees.proto'),
          url: 'payment-service:3011',
          loader: {
            keepCase: true,
          },
        },
      },
      {
        name: 'payment_record',
        transport: Transport.GRPC,
        options: {
          package: 'payment',
          protoPath: join(__dirname, '../proto/payment.proto'),
          url: 'payment-service:3011',
          loader: {
            keepCase: true,
          },
        },
      },
    ]),
  ],
  controllers: [StudentController],
  providers: [StudentService, PdfService],
})
export class StudentModule {}
