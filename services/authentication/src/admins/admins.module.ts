import { Module } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminEntity } from 'src/entities/admins.entity';
import { rolesEntity } from 'src/entities/role.entity';
import { PasswordResetEntity } from '../entities/password_reset_token.entity';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminEntity, rolesEntity, PasswordResetEntity]),
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
            reconnectTimeInSeconds: 3,
            heartbeatIntervalInSeconds: 5,
          },
        },
      },
    ]),
  ],
  providers: [AdminsService],
  controllers: [AdminsController],
})
export class AdminsModule {}
