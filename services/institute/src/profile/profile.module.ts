import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstituteEntity } from 'src/entities/institute.entity';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { BranchEntity } from 'src/entities/branch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InstituteEntity, BranchEntity])],
  providers: [ProfileService],
  controllers: [ProfileController],
})
export class ProfileModule {}
