import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminEntity } from 'src/entities/admins.entity';
import { roles, rolesEntity } from 'src/entities/role.entity';
import { In, Repository } from 'typeorm';
import roleData from './data/roles.json';
import adminData from './data/admins.json';
import { PasswordUtils } from 'src/utils/password.utils';

@Injectable()
export class SeedingService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(rolesEntity)
    private roleRepo: Repository<rolesEntity>,

    @InjectRepository(AdminEntity)
    private adminRepo: Repository<AdminEntity>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedRoles();
    await this.seedAdmins();
  }

  private async seedRoles() {
    try {
      const existRole = await this.roleRepo.find({
        where: {
          role: In(roleData.map((r) => r.role)),
        },
      });

      const existingRole = existRole.map((r) => ({
        role: r.role,
      }));

      const newRoles = roleData.filter(
        (r) => !existingRole.includes(r as { role: roles }),
      );

      if (newRoles.length > 0) {
        for (const role of newRoles) {
          const data = this.roleRepo.create({ role: role.role as roles });
          await this.roleRepo.save(data);
        }
      }
    } catch (error) {
      console.log(error, 'role db seeding');
    }
  }

  private async seedAdmins() {
    try {
      for (const admin of adminData) {
        const exist = await this.adminRepo.findOne({
          where: { email: admin.email },
        });

        if (!exist) {
          const role = await this.roleRepo.findOne({
            where: {
              role: admin.role as roles,
            },
          });

          if (!role) {
            continue;
          }

          const hashpass = await PasswordUtils.hash(admin.password);

          const user = this.adminRepo.create({
            email: admin.email,
            role_id: role.uuid,
            password: hashpass,
            name: admin.name as string,
          });

          await this.adminRepo.save(user);
        }
      }
    } catch (error) {
      console.log(error, 'admin db seeding');
    }
  }
}
