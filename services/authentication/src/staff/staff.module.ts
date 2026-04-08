import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffEntity } from 'src/entities/staff.entity';
import { rolesEntity } from 'src/entities/role.entity';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([StaffEntity, rolesEntity]),
    JwtModule.register({
      secret: 'auth-key',
      signOptions: { expiresIn: '30d' },
    }),
    ClientsModule.register([
      {
        name: 'mailservice',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'mailservice',
            brokers: ['kafka:9092'],
          },
          consumer: {
            groupId: 'mailservice-consumer',
          },
        },
      },
    ]),
  ],
  providers: [StaffService],
  controllers: [StaffController],
})
export class StaffModule {}
