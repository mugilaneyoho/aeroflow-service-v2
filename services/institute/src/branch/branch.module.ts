import { Module } from '@nestjs/common';
import { BranchService } from './branch.service';
import { BranchController } from './branch.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchEntity } from 'src/entities/branch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BranchEntity])],
  providers: [BranchService],
  controllers: [BranchController],
})
export class BranchModule {}
