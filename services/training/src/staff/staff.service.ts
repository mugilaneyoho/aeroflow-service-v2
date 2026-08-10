import * as Sentry from '@sentry/nestjs';
import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StaffProfileEntity } from 'src/entities/staff.entity';
import {
  And,
  Between,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { CreateStaffDto } from './dto/create-staff.dto';
import { lastValueFrom, Observable } from 'rxjs';
import * as microservices from '@nestjs/microservices';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { OfflineClassesEntity } from 'src/entities/OfflineClass.entity';
import { OnlineClassesEntity } from 'src/entities/OnlineClass.entity';
import { RedisUserCache } from 'src/redis/redis.service';

interface staffgrpc {
  CreateStaff(data: {
    email: string;
    password: string;
    profileId: string;
  }): Observable<any>;
}

@Injectable()
export class StaffService implements OnModuleInit {
  private AuthService: staffgrpc;
  constructor(
    @InjectRepository(StaffProfileEntity)
    private staffRepo: Repository<StaffProfileEntity>,
    @InjectRepository(OfflineClassesEntity)
    private offlineRepo: Repository<OfflineClassesEntity>,
    @InjectRepository(OnlineClassesEntity)
    private onlineRepo: Repository<OnlineClassesEntity>,

    @Inject('staff')
    private client: microservices.ClientGrpc,
    private readonly redisCache: RedisUserCache,
  ) {}

  onModuleInit() {
    this.AuthService = this.client.getService('StaffService');
  }

  async create(data: CreateStaffDto) {
    try {
      const exits = await this.staffRepo.findOne({
        where: { email: data.email, phone_number: data.phone_number },
      });

      if (exits) {
        throw new ConflictException({
          success: false,
          message: 'user already exist this email.',
        });
      }

      const user = this.staffRepo.create(data);

      const staff = await this.staffRepo.save(user);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const grpc_res: { success: boolean; message: string } =
        await lastValueFrom(
          this.AuthService.CreateStaff({
            email: staff.email,
            password: data.password,
            profileId: staff.uuid,
          }),
        );

      if (!grpc_res.success) {
        console.error('grpc staff profile error.');
        return new InternalServerErrorException({
          success: false,
          message: 'internal server error.',
        });
      }

      return {
        success: true,
        message: 'profile created successfully',
        data: staff,
      };
    } catch (error:any) {
      Sentry.captureException(error);
      console.error(error, 'create staff error');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.status == 409) {
        throw new ConflictException({
          success: false,
          message: 'user already exist this email.',
        })
      }
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

      const [staffs, total] = await this.staffRepo.findAndCount({
        where: { is_delete: false },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      return {
        success: true,
        message: 'staff fetched',
        data: staffs,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'create staff error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async findOne(uuid: string) {
    try {
      const cache = await this.redisCache.getUser(uuid);

      if (cache) {
        return {
          success: true,
          message: 'staff fetched',
          data: cache,
        };
      }

      const staff = await this.staffRepo.findOne({
        where: { uuid },
      });

      if (!staff) {
        throw new NotFoundException();
      }

      await this.redisCache.setUser(staff.uuid, staff)

      return {
        success: true,
        message: 'staff fetched',
        data: staff,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'find staff error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async deleteOne(uuid: string) {
    try {
      await this.staffRepo.update({ uuid }, { is_delete: true });
      return {
        success: true,
        message: 'staff deleted successfully.',
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'delete staff error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async update(uuid: string, data: UpdateStaffDto) {
    try {
      const exist = await this.staffRepo.findOne({ where: { uuid } });

      if (!exist) {
        return new NotFoundException({
          success: false,
          message: 'classes not founded.',
        });
      }

      Object.assign(exist, data);

      await this.redisCache.deleteUser(exist.uuid);

      const staff = await this.staffRepo.save(exist);

      await this.redisCache.setUser(staff.uuid, staff);

      return {
        staff,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'update staff error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async dashboard(staffUuid?: string) {
    try {
      const nowDate = new Date();

      const online = await this.onlineRepo.find({
        where: { is_delete: false },
      });
      const offline = await this.offlineRepo.find({
        where: { is_delete: false },
      });
      const allClasses = [...online, ...offline];

      const staffClasses = staffUuid
        ? allClasses.filter((c) => c.staff_id === staffUuid)
        : allClasses;

      const todayclasses = staffClasses.filter(
        (c) => new Date(c.start_date) <= nowDate && new Date(c.end_time) >= nowDate
      );

      const totalAssignedClasses = staffClasses.length;
      const attendanceMarkedCount = staffClasses.filter((c) => c.attendance === true).length;
      const materialsUploadedCount = staffClasses.filter((c) => {
        if (!c.notes || !Array.isArray(c.notes) || c.notes.length === 0) return false;
        return c.notes[0] !== '' && c.notes[0] !== null;
      }).length;

      const attendanceCompletion =
        totalAssignedClasses > 0
          ? Math.round((attendanceMarkedCount / totalAssignedClasses) * 100)
          : 0;

      const materialUploadRate =
        totalAssignedClasses > 0
          ? Math.round((materialsUploadedCount / totalAssignedClasses) * 100)
          : 0;

      return {
        todayclasses,
        totalAssignedClasses,
        attendanceMarkedCount,
        materialsUploadedCount,
        attendanceCompletion,
        materialUploadRate,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'staff dashboard error');
    }
  }

  async dropdown() {
    const staff = await this.staffRepo.find({
      where: { is_delete: false, is_active: true },
      select: ['staff_name', 'uuid', 'staff_id'],
    });

    return staff;
  }

  async getStaffsforChat() {
    return this.staffRepo.find({ where: { is_delete: false } });
  }
}
