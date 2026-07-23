import * as Sentry from '@sentry/nestjs';
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
  Logger,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { OfflineClassesEntity } from 'src/entities/OfflineClass.entity';
import { OnlineClassesEntity } from 'src/entities/OnlineClass.entity';
import {
  FindManyOptions,
  FindOptionsOrderValue,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Repository,
  Between,
} from 'typeorm';
import { CreateClassDto } from './dto/create-class.dto';
import { lastValueFrom, Observable } from 'rxjs';
import * as microservices from '@nestjs/microservices';
import { UpdateClassDto } from './dto/update-class.dto';

interface batchgrpc {
  GetById(data: { batchid: string }): Observable<any>;
}

@Injectable()
export class ClassesService implements OnModuleInit {
  private batchService: batchgrpc;

  constructor(
    @InjectRepository(OfflineClassesEntity)
    private offlineRepo: Repository<OfflineClassesEntity>,
    @InjectRepository(OnlineClassesEntity)
    private onlineRepo: Repository<OnlineClassesEntity>,
    @Inject('batch')
    private clientBatch: microservices.ClientGrpc,

    @Inject('notifyandlogs')
    private readonly kafkaclient: microservices.ClientProxy,
    private readonly logger: Logger,
  ) {}

  @Cron('* * * * *')
  async handleClassStart() {
    const classes = await this.onlineRepo.find();
    const current = Date.now();
    const beforeTime = current + 5 * 60 * 1000;

    for (const classData of classes) {
      const startTime = new Date(classData.start_time).getTime();
      if (startTime >= current && startTime <= beforeTime) {
        this.kafkaclient.emit('class started', {
          uuid: classData.uuid,
          subject: classData.subject,
          batch_name: classData.batch_name,
          start_time: classData.start_time,
        });
      }
    }
  }

  async onModuleInit() {
    this.batchService = this.clientBatch.getService('BatchService');
    try {
      await this.kafkaclient.connect();
      this.logger.log('kafka producer connected successfully');
    } catch (error) {
      Sentry.captureException(error);
      this.logger.error('kafka producer connection faild', error);
    }
  }

  async onmoduleDestroy() {
    try {
      await this.kafkaclient.close();
    } catch (error) {
      Sentry.captureException(error);
      this.logger.error('kafka producer disconnect', error);
    }
  }

  selectMode(mode: string) {
    const upperMode = mode?.toUpperCase();
    if (upperMode === 'ONLINE') {
      return this.onlineRepo;
    } else if (upperMode === 'OFFLINE') {
      return this.offlineRepo;
    } else {
      throw new NotFoundException('pass right class mode');
    }
  }

  async checkStaffConflict(
    staffId: string,
    startTime: any,
    endTime: any,
    excludeUuid?: string,
  ): Promise<boolean> {
    const proposedStart = new Date(startTime).getTime();
    const proposedEnd = new Date(endTime).getTime();

    const onlineClasses = await this.onlineRepo.find({
      where: { staff_id: staffId, is_delete: false },
    });

    for (const cls of onlineClasses) {
      if (excludeUuid && cls.uuid === excludeUuid) continue;
      const start = new Date(cls.start_time).getTime();
      const end = new Date(cls.end_time).getTime();
      if (start < proposedEnd && end > proposedStart) {
        return true;
      }
    }

    const offlineClasses = await this.offlineRepo.find({
      where: { staff_id: staffId, is_delete: false },
    });

    for (const cls of offlineClasses) {
      if (excludeUuid && cls.uuid === excludeUuid) continue;
      const start = new Date(cls.start_time).getTime();
      const end = new Date(cls.end_time).getTime();
      if (start < proposedEnd && end > proposedStart) {
        return true;
      }
    }

    return false;
  }

  async create(data: CreateClassDto) {
    try {
      const hasConflict = await this.checkStaffConflict(
        data.staff_id,
        data.start_time,
        data.end_time,
      );

      if (hasConflict) {
        throw new BadRequestException(
          'staff already has a class during this time.',
        );
      }

      const grpc_batch: {
        success: boolean;
        data: {
          totalStudent: number | undefined;
          batchMode: string;
          batchName: string;
          students: any[];
        };
      } = await lastValueFrom(
        this.batchService.GetById({
          batchid: data.batch_id,
        }),
      );

      if (!grpc_batch.success) {
        console.error('grpc staff profile error.');
        return new InternalServerErrorException({
          success: false,
          message: 'internal server error.',
        });
      }

      const classRepo = this.selectMode(grpc_batch.data?.batchMode);

      const classData = classRepo.create({
        ...data,
        class_mode: grpc_batch.data?.batchMode.toLowerCase(),
        batch_name: grpc_batch.data.batchName,
        total_student: grpc_batch.data?.students?.length,
      });

      const final = await classRepo.save(classData);

      return {
        success: true,
        message: 'class create successfully.',
        data: final,
      };
    } catch (error) {
      Sentry.captureException(error);
      if (error instanceof HttpException) {
        throw error;
      }
      console.error(error, 'create class error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async findOne(uuid: string, mode: string) {
    try {
      const classRepo = this.selectMode(mode);

      const data = await classRepo.findOne({
        where: { uuid },
      });

      if (!data) {
        return new NotFoundException('no classes available');
      }

      const grpc_res = await lastValueFrom(
        this.batchService.GetById({ batchid: data.batch_id }),
      );

      console.log(grpc_res, 'check');

      return {
        success: true,
        message: 'data fetched',
        data,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'find class error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async findAll(
    query: { page: string; limit: string; classtype: string },
    uuid?: string,
  ) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 5;
      const classtype = query.classtype;

      const nowDate = new Date();

      let filter: FindManyOptions<OfflineClassesEntity>;

      if (classtype === 'ongoing') {
        filter = {
          where: {
            is_delete: false,
            ...(uuid ? { staff_id: uuid } : {}),
            end_time: MoreThanOrEqual(nowDate),
          },
          skip: (page - 1) * limit,
          take: limit,
          order: { createdAt: 'DESC' as FindOptionsOrderValue },
          relations: ['staff'],
        };
      } else if (classtype === 'completed') {
        filter = {
          where: {
            is_delete: false,
            ...(uuid ? { staff_id: uuid } : {}),
            end_time: LessThan(nowDate),
          },
          skip: (page - 1) * limit,
          take: limit,
          order: { createdAt: 'DESC' as FindOptionsOrderValue },
          relations: ['staff'],
        };
      } else {
        filter = {};
        return {
          success: false,
          message: 'query is worng',
        };
      }

      const [online, onlinTotal] = await this.onlineRepo.findAndCount(filter);

      const [offline, offlineTotal] =
        await this.offlineRepo.findAndCount(filter);

      const total = onlinTotal + offlineTotal;
      const classes = [...online, ...offline];

      return {
        success: true,
        message: 'classes fecthed',
        data: classes,
        meta: {
          total,
          page,
          limit: limit * 2,
          totalPages: Math.ceil(total / (limit * 2)),
        },
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'create class error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async deleteOne(uuid: string, mode: string) {
    try {
      const classRepo = this.selectMode(mode);

      await classRepo.update({ uuid }, { is_delete: true });

      return {
        success: true,
        message: 'class deleted successfully.',
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'find class error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async update(uuid: string, data: UpdateClassDto, mode: string) {
    try {
      const hasConflict = await this.checkStaffConflict(
        data.staff_id,
        data.start_time,
        data.end_time,
        uuid,
      );

      if (hasConflict) {
        throw new BadRequestException(
          'staff already has a class during this time.',
        );
      }

      const classRepo = this.selectMode(mode);

      const classes = await classRepo.findOne({ where: { uuid } });

      if (!classes) {
        throw new NotFoundException({
          success: false,
          message: 'classes not founded.',
        });
      }

      Object.assign(classes, data);

      await classRepo.save(classes);

      return {
        success: true,
        message: 'classes updated successfully.',
      };
    } catch (error) {
      Sentry.captureException(error);
      if (error instanceof HttpException) {
        throw error;
      }
      console.error(error, 'find class error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async AllClassForStudent(
    query: {
      page: string;
      limit: string;
    },
    req: { headers: { user: string } },
    classtype: string,
  ) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const user: { batch_id: string } = JSON.parse(req.headers.user);

      const nowDate = new Date();

      const grpc_res: { data: { batchMode: string; uuid: string } } =
        await lastValueFrom(
          this.batchService.GetById({ batchid: user.batch_id }),
        );

      const classRepo = this.selectMode(grpc_res.data.batchMode);

      let classData;

      const todayStart = new Date(nowDate);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(nowDate);
      todayEnd.setHours(23, 59, 59, 999);

      if (classtype.toLowerCase() === 'today') {
        classData = await classRepo.find({
          where: {
            batch_id: grpc_res.data.uuid,
            start_date: Between(todayStart, todayEnd),
          },
          relations: ['staff'],
        });
      } else if (classtype.toLowerCase() === 'upcoming') {
        classData = await classRepo.find({
          where: {
            batch_id: grpc_res.data.uuid,
            start_date: MoreThan(todayEnd),
          },
          relations: ['staff'],
        });
      } else if (classtype.toLowerCase() === 'completed') {
        classData = await classRepo.find({
          where: {
            batch_id: grpc_res.data.uuid,
            end_time: LessThan(nowDate),
          },
          relations: ['staff'],
        });
      } else {
        return {
          success: false,
          message: 'classtype missing or not corrct type',
        };
      }

      return {
        data: classData,
        success: true,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
    }
  }

  async updateMaterials(uuid: string, mode: string, notes: string[]) {
    try {
      const classRepo = this.selectMode(mode);
      const classItem = await classRepo.findOne({ where: { uuid } });
      if (!classItem) {
        throw new NotFoundException({
          success: false,
          message: 'Class not found',
        });
      }
      classItem.notes = [...(classItem.notes || []), ...notes];
      const updated = await classRepo.save(classItem);
      return {
        success: true,
        message: 'Class study materials updated successfully',
        data: updated,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      throw new InternalServerErrorException({
        success: false,
        message: error.message || 'failed to update class materials',
      });
    }
  }
}
