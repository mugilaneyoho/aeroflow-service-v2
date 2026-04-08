import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StudentEntity } from '../entities/student.entity';
import { Repository } from 'typeorm';
import { StudentBody } from '../types';
import { JwtService } from '@nestjs/jwt';
import { PasswordUtils } from 'src/utils/password.utils';
import { roles, rolesEntity } from 'src/entities/role.entity';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(StudentEntity)
    private StudentRepo: Repository<StudentEntity>,
    @InjectRepository(rolesEntity)
    private rolesRepo: Repository<rolesEntity>,
    private JwtService: JwtService,
  ) {}

  async create(data: { email: string; password: string; profileId: string }) {
    try {
      if (!data.email) {
        throw new NotFoundException({
          success: false,
          message: 'input missing',
        });
      }

      const exist = await this.StudentRepo.findOne({
        where: { email: data.email },
      });

      if (exist) {
        throw new ConflictException({
          success: false,
          message: 'email already exist',
        });
      }

      if (!data.password) {
        throw new NotFoundException({
          success: false,
          message: 'input missing',
        });
      }

      const role = await this.rolesRepo.findOne({
        where: { role: roles.STUDENT },
      });

      const hashpass: string = await PasswordUtils.hash('patron');

      const user = await this.StudentRepo.save({
        ...data,
        password: hashpass,
        role_id: role?.uuid,
        profile_id: data?.profileId,
      });

      if (!user) {
        throw new InternalServerErrorException({
          success: false,
          message: 'student auth created error',
        });
      }

      return { success: true, message: 'new user created' };
    } catch (error) {
      console.error('student created', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async login(data: StudentBody) {
    try {
      const user = await this.StudentRepo.findOne({
        where: { email: data.email },
      });

      if (!user) {
        return new NotFoundException({
          success: false,
          message: 'user not founded',
        });
      }

      const verify = await PasswordUtils.verify(user.password, data.password);

      if (!verify) {
        return new BadRequestException({
          success: false,
          message: 'enter password is not correct',
        });
      }

      const token = this.JwtService.sign(
        { uuid: user.uuid, role_id: user.role_id, profile_id: user.profile_id },
        {
          expiresIn: '7d',
        },
      );

      return { success: true, message: 'login success', data: token };
    } catch (error) {
      console.error('student created', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async findOne(uuid: string) {
    try {
      const user = await this.StudentRepo.findOne({
        where: { uuid },
        select: ['email', 'id', 'uuid'],
      });

      if (!user) {
        throw new NotFoundException({
          success: false,
          message: 'user not founded',
        });
      }

      return { success: true, message: 'user data fetched', data: user };
    } catch (error) {
      console.error('student find', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }
}
