import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeEntity } from 'src/entities/employee.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeEntity]),
    ClientsModule.register([
      {
        name: 'telecaller_auth',
        transport: Transport.GRPC,
        options: {
          package: 'telecaller_auth',
          protoPath: join(__dirname, '../proto/telecalling.proto'),
          url: process.env.AUTH_GRPC,
        },
      },
    ]),
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService],
})
export class EmployeeModule {}
