import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminEntity } from 'src/entities/admins.entity';
import { rolesEntity } from 'src/entities/role.entity';
import { Repository } from 'typeorm';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { PasswordUtils } from 'src/utils/password.utils';
import { JwtService } from '@nestjs/jwt';
import { PassDecrypted } from 'src/utils/helpers';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(AdminEntity)
    private adminRepo: Repository<AdminEntity>,

    @InjectRepository(rolesEntity)
    private roleRepo: Repository<rolesEntity>,
    private JwtService: JwtService,
  ) {}

  async create(data: CreateAdminDto) {
    try {
      const role = await this.roleRepo.findOne({
        where: { role: data.role },
      });

      if (!role) {
        return new NotFoundException({
          success: false,
          message: 'role not founded',
        });
      }

      const hashpass = await PasswordUtils.hash(data.password);

      const admin = this.adminRepo.create({
        email: data.email,
        role_id: role.uuid,
        password: hashpass,
        name: data.name,
      });

      await this.adminRepo.save(admin);

      return {
        success: true,
        message: 'new admin created successfully',
        data: admin,
      };
    } catch (error) {
      console.error(error, 'admin create error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async findAll(query: { page: string; limit: string }) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;

      const [admins, total] = await this.adminRepo.findAndCount({
        where: { is_delete: false },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
        relations: ['role'],
      });

      return {
        success: true,
        message: 'admins fetched',
        data: admins,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error(error, 'admin create error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async update(uuid: string, data: UpdateAdminDto) {
    try {
      const admin = await this.adminRepo.findOne({ where: { uuid } });

      if (!admin) {
        return new NotFoundException({
          success: false,
          message: 'admin not founded',
        });
      }

      Object.assign(admin, data);

      await this.adminRepo.save(admin);

      return {
        success: true,
        message: 'admin updated successfully',
        data: admin,
      };
    } catch (error) {
      console.error(error, 'admin create error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async deleteOne(uuid: string) {
    try {
      await this.adminRepo.update({ uuid }, { is_delete: true });

      return {
        success: true,
        message: 'admin deleted successfully',
      };
    } catch (error) {
      console.error(error, 'admin create error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async login(payload: string) {
    try {
      const { email, password } = PassDecrypted(payload);

      const user = await this.adminRepo.findOne({ where: { email } });

      if (!user) {
        return {
          success: false,
          message: 'user not founded',
        };
      }

      const verify = await PasswordUtils.verify(user.password, password);

      if (!verify) {
        return new UnauthorizedException({
          success: false,
          message: 'your enter password are incorrect.',
        });
      }

      const role = await this.roleRepo.findOne({
        where: { uuid: user.role_id },
      });

      const token = await this.JwtService.signAsync(
        { ...user },
        { expiresIn: '7d' },
      );

      return {
        success: true,
        message: 'login successfully.',
        data: token,
        role: role?.role,
      };
    } catch (error) {
      console.error(error, 'admin login failed');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async getAdminsForChat() {
    return this.adminRepo.find({ where: { is_delete: false } });
  }
}
