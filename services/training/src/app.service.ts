import * as Sentry from '@sentry/nestjs';
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
import { Cron } from '@nestjs/schedule';
import { AttendanceEntity } from './entities/attendance.entity';

interface commongrpc {
  GetDashBoard(): Observable<any>;
  FetchDashBoard(data: { data: string }): Observable<any>;
}

interface batchgrpc {
  GetcompleteBatch(data: object): Observable<any>;
}

interface studentgrpc {
  PlacementEligible(data: object): Observable<any>;
}

@Injectable()
export class AppService implements OnModuleInit {
  private CommonService: commongrpc;
  private batchService: batchgrpc;
  private studentService: studentgrpc;
  constructor(
    @InjectRepository(OnlineClassesEntity)
    private onlineRepo: Repository<OnlineClassesEntity>,
    @InjectRepository(OfflineClassesEntity)
    private offlineRepo: Repository<OfflineClassesEntity>,
    @InjectRepository(StaffProfileEntity)
    private staffRepo: Repository<StaffProfileEntity>,
    @InjectRepository(AttendanceEntity)
    private attendaceRepo: Repository<AttendanceEntity>,
    @Inject('common')
    private client: microservices.ClientGrpc,
    @Inject('batch')
    private batchClient: microservices.ClientGrpc,
    @Inject('student')
    private studentClient: microservices.ClientGrpc,
  ) {}
  getHello(): string {
    return 'Training service Running..';
  }

  onModuleInit() {
    this.CommonService = this.client.getService('CommonService');
    this.batchService = this.batchClient.getService('BatchService');
    this.studentService = this.studentClient.getService('StudentService');
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
      Sentry.captureException(error);
      console.error(error, 'admin dashboard error.');
      throw new InternalServerErrorException('internal server error.');
    }
  }

  async MasterDashboard() {
    try {
      const staff = await this.staffRepo.count({ where: { is_delete: false } });
      const online = await this.onlineRepo.count({
        where: { start_date: new Date() },
      });
      const offline = await this.offlineRepo.count({
        where: { start_date: new Date() },
      });

      return {
        data: {
          staff,
          online,
          offline,
        },
      };
    } catch (error) {
      Sentry.captureException(error);
      console.log(error);
      return new InternalServerErrorException();
    }
  }

  @Cron('* * * * *')
  async PlacementLists() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const batchdata: { data: object } = await lastValueFrom(
        this.batchService.GetcompleteBatch({}),
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const batchlist: any[] = JSON.parse(batchdata?.data as unknown as string);

      const eligible: string[] = [];

      for (const batch of batchlist) {
        let classes: any[] = [];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (batch?.batchMode === 'OFFLINE') {
          classes = await this.offlineRepo.find({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            where: { batch_id: batch?.uuid },
          });
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        } else if (batch?.batchMode === 'ONLINE') {
          classes = await this.onlineRepo.find({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            where: { batch_id: batch?.uuid },
          });
        } else {
          return;
        }

        const studentstatus = {};

        for (const data of classes) {
          const attendance: any = await this.attendaceRepo.findOne({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            where: { classId: data?.uuid },
            relations: ['records'],
          });

          if (!attendance) {
            return;
          }

          // eslint-disable-next-line no-unsafe-optional-chaining, @typescript-eslint/no-unsafe-member-access
          for (const element of attendance?.records) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (studentstatus[element?.studentId]) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              if (element?.status === 'PRESENT') {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                studentstatus[element?.studentId]++;
              } else {
                continue;
              }
            } else {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              if (element?.status === 'PRESENT') {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                studentstatus[element?.studentId] = 1;
              } else {
                continue;
              }
            }
          }
        }

        const totalclass = classes.length;

        for (const student in studentstatus) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const totalattened = studentstatus[student];

          const percent = (totalattened / totalclass) * 100;

          if (percent >= 90) {
            eligible.push(student);
          }
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
      const grpcres = await lastValueFrom(
        this.studentService.PlacementEligible({ data: eligible }),
      );

      console.log("running", eligible)
      console.log(grpcres)
    } catch (error) {
      Sentry.captureException(error);
      console.log(error);
      return new InternalServerErrorException();
    }
  }
}
