import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { rolesEntity } from 'src/entities/role.entity';
import { RedisCacheService } from 'src/redis/redis.service';

@Module({
  imports: [TypeOrmModule.forFeature([rolesEntity])],
  controllers: [RolesController],
  providers: [RolesService, RedisCacheService],
})
export class RolesModule {}
