import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LeadsModule } from './leads/leads.module';
import { QueueModule } from './queue/queue.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsEntity } from './entities/leads.entity';
import { BullModule } from '@nestjs/bull';
import { EmployeeModule } from './employee/employee.module';
import { EmployeEntity } from './entities/employee.entity';
import { ConfigModule } from '@nestjs/config';
import { PaymentModule } from './payment/payment.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './role/role.guard';

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
      entities: [LeadsEntity, EmployeEntity],
      synchronize: true,
      maxQueryExecutionTime: 20,
    }),
    TypeOrmModule.forFeature([LeadsEntity, EmployeEntity]),
    BullModule.forRoot({
      redis: {
        host: 'host.docker.internal',
        port: 6379,
        maxRetriesPerRequest: null,
      },
    }),
    LeadsModule,
    QueueModule,
    EmployeeModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
