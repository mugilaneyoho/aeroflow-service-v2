import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { Note } from './entities/resource.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Note])],
  controllers: [ResourcesController],
  providers: [ResourcesService],
})
export class ResourcesModule {}