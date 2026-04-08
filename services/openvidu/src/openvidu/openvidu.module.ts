import { Module } from '@nestjs/common';
import { OpenViduController } from './openvidu.controller';
import { OpenViduService } from './openvidu.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomlistEntity } from 'src/entities/roomlist.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([RoomlistEntity])],
  controllers: [OpenViduController],
  providers: [OpenViduService],
  exports: [OpenViduService],
})
export class OpenviduModule {}
