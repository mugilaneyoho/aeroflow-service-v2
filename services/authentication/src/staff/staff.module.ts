import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffEntity } from 'src/entities/staff.entity';
import { rolesEntity } from 'src/entities/role.entity';
import { PasswordResetEntity } from '../entities/password_reset_token.entity';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([StaffEntity, rolesEntity, PasswordResetEntity]),
    JwtModule.register({
      secret: 'auth-key',
      signOptions: { expiresIn: '30d' },
    }),
    ClientsModule.register([
      {
        name: 'mailservice',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://guest:guest@rabbitmq:5672'],
          queue: 'mail_queue',
          queueOptions: {
            durable: true,
          },
          sosocketOptions: {
            reconnectTimeInSeconds: 5,
            heartbeatIntervalInSeconds: 10,
          },
        },
      },
    ]),
  ],
  providers: [StaffService],
  controllers: [StaffController],
})
export class StaffModule {}
