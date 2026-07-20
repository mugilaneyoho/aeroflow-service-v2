import * as Sentry from '@sentry/nestjs';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy, GrpcMethod } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { roles, rolesEntity } from 'src/entities/role.entity';
import { TelecallingEntity } from 'src/entities/telecalling.entity';
import { PassDecrypted } from 'src/utils/helpers';
import { PasswordUtils } from 'src/utils/password.utils';
import { Repository } from 'typeorm';
import { PasswordResetEntity } from '../entities/password_reset_token.entity';

@Injectable()
export class TelecallingService {
  constructor(
    @InjectRepository(TelecallingEntity)
    private TelecallerRepo: Repository<TelecallingEntity>,
    private JwtService: JwtService,

    @InjectRepository(rolesEntity)
    private roleRepo: Repository<rolesEntity>,

    @InjectRepository(PasswordResetEntity)
    private passwordResetRepo: Repository<PasswordResetEntity>,

    @Inject('mailservice')
    private readonly MailService: ClientProxy,
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

  async login(payload: string) {
    try {
      const { email, password } = PassDecrypted(payload);

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
      Sentry.captureException(error);
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
      Sentry.captureException(error);
      console.log(error, 'error create tele auth grpc');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async updatePassword(uuid: string, password: string, tokenUuid?: string) {
    try {
      if (tokenUuid) {
        const resetToken = await this.passwordResetRepo.findOne({ where: { uuid: tokenUuid } });
        if (!resetToken) {
          throw new BadRequestException({ success: false, message: 'Invalid token' });
        }
        if (resetToken.usedAt) {
          throw new BadRequestException({ success: false, message: 'Token has already been used' });
        }
        if (resetToken.expiresAt < new Date()) {
          throw new BadRequestException({ success: false, message: 'Token has expired' });
        }
        resetToken.usedAt = new Date();
        await this.passwordResetRepo.save(resetToken);
      }

      const user = await this.TelecallerRepo.findOne({ where: { uuid } });

      if (!user) {
        throw new BadRequestException({ success: false, message: 'User not found' });
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
      Sentry.captureException(error);
      console.log(error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException({ success: false, message: 'Internal server error' });
    }
  }

  async forgetPassword(email: string) {
    try {
      const user = await this.TelecallerRepo.findOne({ where: { email } });
      if (!user) {
        throw new NotFoundException({ success: false, message: 'User not found with this email' });
      }

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      const resetTokenRecord = this.passwordResetRepo.create({
        userId: user.uuid,
        token: '',
        expiresAt,
      });
      await this.passwordResetRepo.save(resetTokenRecord);

      const token = this.JwtService.sign(
        { uuid: user.uuid, tokenUuid: resetTokenRecord.uuid, email: user.email, type: 'telecaller' },
        { expiresIn: '15m' },
      );

      resetTokenRecord.token = token;
      await this.passwordResetRepo.save(resetTokenRecord);

      const resetUrl = `${process.env.RESET_URL || 'http://localhost:3000/auth'}/reset-page?token=${token}`;
      this.MailService.emit('mailservice.forgotpassword', {
        email: user.email,
        name: user.email.split('@')[0],
        resetUrl,
      });

      return { success: true, message: 'Password reset link sent to email.' };
    } catch (error) {
      Sentry.captureException(error);
      console.error('telecalling forget password error', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException({ success: false, message: 'Internal server error' });
    }
  }
}
