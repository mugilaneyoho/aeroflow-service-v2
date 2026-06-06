import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GrpcMethod } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { roles, rolesEntity } from 'src/entities/role.entity';
import { TelecallingEntity } from 'src/entities/telecalling.entity';
import { PasswordUtils } from 'src/utils/password.utils';
import { Repository } from 'typeorm';

@Injectable()
export class TelecallingService {
  constructor(
    @InjectRepository(TelecallingEntity)
    private TelecallerRepo: Repository<TelecallingEntity>,
    private JwtService: JwtService,

    @InjectRepository(rolesEntity)
    private roleRepo: Repository<rolesEntity>,
  ) {}

  async findOne(uuid: string) {
    const user = await this.TelecallerRepo.findOne({
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
  }

  async login(email: string, password: string) {
    try {
      const user = await this.TelecallerRepo.findOne({ where: { email } });

      if (!user) {
        return new NotFoundException({
          success: false,
          message: 'user not founded',
        });
      }

      const verify = await PasswordUtils.verify(user.password, password);

      if (!verify) {
        return new UnauthorizedException({
          success: false,
          message: 'your enter password are incorrect.',
        });
      }

      // if (!user.mustChangePassword) {
      //   const token = this.JwtService.sign(
      //     {
      //       uuid: user.uuid,
      //       email: user.email,
      //     },
      //     {
      //       expiresIn: '10m',
      //     },
      //   );

      //   return {
      //     success: true,
      //     changepass: true,
      //     token,
      //     message: 'reset default password',
      //   };
      // }

      const token = await this.JwtService.signAsync(
        {
          role_id: user.role_id,
          email: user.email,
          uuid: user.uuid,
          profile_id: user.profile_id,
        },
        { expiresIn: '7d' },
      );

      return {
        success: true,
        message: 'login successfully.',
        data: token,
        profid: user?.profile_id,
      };
    } catch (error) {
      console.error(error, 'staff login failed');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  @GrpcMethod('telecallerService', 'GetUserById')
  async getUserById(data: { id: number }) {
    return await this.TelecallerRepo.findOne({ where: { id: data.id } });
  }

  async CreateUSer(data: {
    email: string;
    password: string;
    profileId: string;
  }) {
    try {
      if (!data.email) {
        throw new NotFoundException({
          success: false,
          message: 'input missing',
        });
      }

      const exist = await this.TelecallerRepo.findOne({
        where: { email: data.email },
      });

      if (exist) {
        throw new ConflictException({
          success: false,
          message: 'email already exist',
        });
      }

      const role = await this.roleRepo.findOne({
        where: { role: roles.TELECALLER },
      });

      if (!role) {
        return {
          success: false,
          message: 'role not founded',
        };
      }

      const hasspass = await PasswordUtils.hash(data.password);

      const user = await this.TelecallerRepo.save({
        ...data,
        password: hasspass,
        role_id: role?.uuid,
        profile_id: data.profileId,
      });

      if (!user) {
        throw new InternalServerErrorException({
          success: false,
          message: 'student auth created error',
        });
      }

      return { success: true, message: 'new user created' };
    } catch (error) {
      console.log(error, 'error create tele auth grpc');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async updatePassword(uuid: string, password: string) {
    try {
      const user = await this.TelecallerRepo.findOne({ where: { uuid } });

      if (!user) {
        return new BadRequestException();
      }

      user.password = await PasswordUtils.hash(password);
      user.mustChangePassword = true;

      await this.TelecallerRepo.save(user);

      const token = this.JwtService.sign(
        { uuid: user.uuid, role_id: user.role_id, profile_id: user.profile_id },
        {
          expiresIn: '7d',
        },
      );

      return {
        success: true,
        data: token,
        message: 'password updated successfully',
      };
    } catch (error) {
      console.log(error);
      return new InternalServerErrorException();
    }
  }
}
