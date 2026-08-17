import { Module } from '@nestjs/common';
import { TelecallingService } from './telecalling.service';
import { TelecallingController } from './telecalling.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelecallingEntity } from 'src/entities/telecalling.entity';
import { JwtModule } from '@nestjs/jwt';
import { rolesEntity } from 'src/entities/role.entity';
import { PasswordResetEntity } from '../entities/password_reset_token.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([TelecallingEntity, rolesEntity, PasswordResetEntity]),
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
  providers: [TelecallingService],
  controllers: [TelecallingController],
})
export class TelecallingModule {}
