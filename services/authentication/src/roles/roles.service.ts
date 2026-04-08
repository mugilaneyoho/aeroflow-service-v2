import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { rolesEntity } from 'src/entities/role.entity';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(rolesEntity)
    private roleRepo: Repository<rolesEntity>,
  ) {}

  create(createRoleDto: CreateRoleDto) {
    const role = this.roleRepo.create(createRoleDto);
    return this.roleRepo.save(role);
  }

  findAll() {
    return this.roleRepo.find();
  }

  async findOne(uuid: string) {
    const role = await this.roleRepo.findOne({ where: { uuid } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async update(uuid: string, updateRoleDto: UpdateRoleDto) {
    await this.findOne(uuid); // ensures it exists
    await this.roleRepo.update({ uuid }, updateRoleDto);
    return this.findOne(uuid);
  }

  async remove(uuid: string) {
    const role = await this.findOne(uuid);
    return this.roleRepo.remove(role);
  }
}
