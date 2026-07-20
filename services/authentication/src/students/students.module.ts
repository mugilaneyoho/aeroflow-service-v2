import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentEntity } from '../entities/student.entity';
import { rolesEntity } from 'src/entities/role.entity';
import { PasswordResetEntity } from '../entities/password_reset_token.entity';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentEntity, rolesEntity, PasswordResetEntity]),
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
        },
      },
    ]),
  ],
  providers: [StudentsService],
  controllers: [StudentsController],
})
export class StudentsModule {}
