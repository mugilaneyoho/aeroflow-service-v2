import { Module } from '@nestjs/common';
import { BatchController } from './batch.controller';
import { BatchService } from './batch.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchEntity } from 'src/entities/batch.entity';
import { StudentProfileEntity } from 'src/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BatchEntity, StudentProfileEntity])],
  controllers: [BatchController],
  providers: [BatchService],
})
export class BatchModule {}
