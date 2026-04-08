import { Module } from '@nestjs/common';
import { TelecallingService } from './telecalling.service';
import { TelecallingController } from './telecalling.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelecallingEntity } from 'src/entities/telecalling.entity';
import { JwtModule } from '@nestjs/jwt';
import { rolesEntity } from 'src/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TelecallingEntity, rolesEntity]),
    JwtModule.register({
      secret: 'auth-key',
      signOptions: { expiresIn: '30d' },
    }),
  ],
  providers: [TelecallingService],
  controllers: [TelecallingController],
})
export class TelecallingModule {}
