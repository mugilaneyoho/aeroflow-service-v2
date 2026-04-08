import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { roles, rolesEntity } from 'src/entities/role.entity';
import { StaffEntity } from 'src/entities/staff.entity';
import { Repository } from 'typeorm';
import { CreateStaffDto } from './dto/create-staff.dto';
import {
  GeneratedRandomPassword,
  PasswordUtils,
} from 'src/utils/password.utils';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class StaffService implements OnModuleInit {
  constructor(
    @InjectRepository(StaffEntity)
    private staffRepo: Repository<StaffEntity>,
    @InjectRepository(rolesEntity)
    private roleRepo: Repository<rolesEntity>,
    private JwtService: JwtService,
    @Inject('mailservice')
    private readonly MailService: ClientKafka,
  ) {}

  async onModuleInit() {
    this.MailService.subscribeToResponseOf('mailservice');
    await this.MailService.connect();
  }

  async create(data: CreateStaffDto) {
    try {
      const role = await this.roleRepo.findOne({
        where: { role: roles.STAFF },
      });

      if (!role) {
        return new NotFoundException({
          success: false,
          message: 'role not founded',
        });
      }

      // const password = GeneratedRandomPassword();
      const password = 'patron';

      const hashpass = await PasswordUtils.hash(password);

      const staff = this.staffRepo.create({
        ...data,
        role_id: role.uuid,
        password: hashpass,
        profile_id: data.profileId,
      });

      await this.staffRepo.save(staff);

      this.MailService.emit('mailservice.welcomestaff', {
        email: staff.email,
        password,
      });

      return {
        success: true,
        message: 'new staff created successfully',
        data: staff,
      };
    } catch (error) {
      console.error(error, 'staff create error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async update(uuid: string, data: UpdateStaffDto) {
    try {
      const staff = await this.staffRepo.findOne({ where: { uuid } });

      if (!staff) {
        return new NotFoundException({
          success: false,
          message: 'staff not founded',
        });
      }

      const hashpass = await PasswordUtils.hash(data.password);

      Object.assign(staff, { password: hashpass });

      await this.staffRepo.save(staff);

      return {
        success: true,
        message: 'staff updated successfully',
        data: staff,
      };
    } catch (error) {
      console.error(error, 'staff create error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async login(email: string, password: string) {
    try {
      const user = await this.staffRepo.findOne({ where: { email } });

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

      const token = await this.JwtService.signAsync(
        { ...user },
        { expiresIn: '7d' },
      );

      return {
        success: true,
        message: 'login successfully.',
        data: token,
      };
    } catch (error) {
      console.error(error, 'staff login failed');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }
}
