import * as Sentry from '@sentry/nestjs';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StudentEntity } from '../entities/student.entity';
import { Repository } from 'typeorm';
import { StudentBody } from '../types';
import { JwtService } from '@nestjs/jwt';
import { PasswordUtils } from 'src/utils/password.utils';
import { roles, rolesEntity } from 'src/entities/role.entity';
import { ClientProxy } from '@nestjs/microservices';
import { PassDecrypted } from 'src/utils/helpers';
import { PasswordResetEntity } from '../entities/password_reset_token.entity';

@Injectable()
export class StudentsService implements OnModuleInit {
  constructor(
    @InjectRepository(StudentEntity)
    private StudentRepo: Repository<StudentEntity>,
    @InjectRepository(rolesEntity)
    private rolesRepo: Repository<rolesEntity>,
    @InjectRepository(PasswordResetEntity)
    private passwordResetRepo: Repository<PasswordResetEntity>,
    private JwtService: JwtService,
    @Inject('mailservice')
    private readonly MailService: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.MailService.connect().catch((reason: { err: object }) => {
      if (reason.err) {
        console.log('connecting error, to restart again');
        process.exit(-1);
      }
    });
  }

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

      const password = 'patron'

      const hashpass: string = await PasswordUtils.hash(password);

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

      this.MailService.emit('mailservice.welcomestudent', {
        email: user.email,
        password,
      });

      this.MailService.emit('whatsapp', {
        to: '9360096656',
        message: 'testing message',
      });

      return { success: true, message: 'new user created' };
    } catch (error) {
      Sentry.captureException(error);
      console.error('student created', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async login(body: { payload: string }) {
    try {
      const data = PassDecrypted(body.payload);

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

      if (!user.mustChangePassword) {
        const token = this.JwtService.sign(
          {
            uuid: user.uuid,
            email: user.email,
          },
          {
            expiresIn: '10m',
          },
        );

        return {
          success: true,
          changepass: true,
          token,
          message: 'reset default password',
        };
      }

      const token = this.JwtService.sign(
        { uuid: user.uuid, role_id: user.role_id, profile_id: user.profile_id },
        {
          expiresIn: '7d',
        },
      );

      return { success: true, message: 'login success', data: token };
    } catch (error) {
      Sentry.captureException(error);
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
      Sentry.captureException(error);
      console.error('student find', error);
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

      const user = await this.StudentRepo.findOne({ where: { uuid } });

      if (!user) {
        throw new BadRequestException({ success: false, message: 'User not found' });
      }

      user.password = await PasswordUtils.hash(password);
      user.mustChangePassword = true;

      await this.StudentRepo.save(user);

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
      const user = await this.StudentRepo.findOne({ where: { email } });
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
        { uuid: user.uuid, tokenUuid: resetTokenRecord.uuid, email: user.email, type: 'student' },
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
      console.error('student forget password error', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException({ success: false, message: 'Internal server error' });
    }
  }
}
