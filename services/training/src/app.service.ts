import {
  Inject,
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OnlineClassesEntity } from './entities/OnlineClass.entity';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { OfflineClassesEntity } from './entities/OfflineClass.entity';
import { StaffProfileEntity } from './entities/staff.entity';
import { lastValueFrom, Observable } from 'rxjs';
import * as microservices from '@nestjs/microservices';

interface commongrpc {
  GetDashBoard(): Observable<any>;
  FetchDashBoard(data: { data: string }): Observable<any>;
}

@Injectable()
export class AppService implements OnModuleInit {
  private CommonService: commongrpc;
  constructor(
    @InjectRepository(OnlineClassesEntity)
    private onlineRepo: Repository<OnlineClassesEntity>,
    @InjectRepository(OfflineClassesEntity)
    private offlineRepo: Repository<OfflineClassesEntity>,
    @InjectRepository(StaffProfileEntity)
    private staffRepo: Repository<StaffProfileEntity>,
    @Inject('common')
    private client: microservices.ClientGrpc,
  ) {}
  getHello(): string {
    return 'Training service Running..';
  }

  onModuleInit() {
    this.CommonService = this.client.getService('CommonService');
  }

  async AdminDashboard() {
    try {
      const nowDate = new Date();
      const DayAfter = new Date();
      DayAfter.setDate(DayAfter.getDate() + 1);

      const staffcount = await this.staffRepo.count({
        where: { is_delete: false },
      });

      const [onlineClass, onlinetotal] = await this.onlineRepo.findAndCount({
        where: {
          start_date: LessThanOrEqual(nowDate),
          end_time: MoreThanOrEqual(nowDate),
          is_delete: false,
        },
        relations: ['staff'],
      });

      const [offlineClass, offlinetotal] = await this.offlineRepo.findAndCount({
        where: {
          start_date: LessThanOrEqual(nowDate),
          end_time: MoreThanOrEqual(nowDate),
          is_delete: false,
        },
        relations: ['staff'],
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const grpc_res: any = await lastValueFrom(
        this.CommonService.FetchDashBoard({ data: 'string' }),
      );

      console.log(grpc_res, 'grpc res');

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return {
        staffcount,
        onlineClass,
        offlineClass,
        onlineClassCount: onlinetotal,
        offlineClassCount: offlinetotal,
        ...grpc_res,
      };
    } catch (error) {
      console.error(error, 'admin dashboard error.');
      throw new InternalServerErrorException('internal server error.');
    }
  }
}
