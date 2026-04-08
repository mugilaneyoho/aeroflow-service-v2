import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmployeEntity } from 'src/entities/employee.entity';
import { Repository } from 'typeorm';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { lastValueFrom, Observable } from 'rxjs';
import * as microservices from '@nestjs/microservices';

interface TelecallerService {
  GetUserById(data: { id: string }): Observable<any>;
  CreateUser(data: {
    email: string;
    password: string;
    profileId: string;
  }): Observable<any>;
}

@Injectable()
export class EmployeeService implements OnModuleInit {
  private AuthService: TelecallerService;
  constructor(
    @InjectRepository(EmployeEntity)
    private employeeRepo: Repository<EmployeEntity>,
    @Inject('telecaller_auth')
    private client: microservices.ClientGrpc,
  ) {}
  onModuleInit() {
    this.AuthService =
      this.client.getService<TelecallerService>('TelecallingService');
  }

  async create(data: CreateEmployeeDto) {
    try {
      const exist = await this.employeeRepo.findOne({
        where: { email: data.email },
      });

      if (exist) {
        return new ConflictException({
          success: false,
          message: 'email already exist in db.',
        });
      }

      const user = this.employeeRepo.create(data);

      const final = await this.employeeRepo.save(user);

      console.log(final);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const grpc_res: { success: boolean; message: string } =
        await lastValueFrom(
          this.AuthService.CreateUser({
            email: final.email,
            password: data.password,
            profileId: final?.uuid,
          }),
        );

      if (!grpc_res.success) {
        console.error('grpc telecaller auth create error!');
        return new InternalServerErrorException('internal server error');
      }

      return {
        success: true,
        message: 'new employee created successfully',
        data: final,
      };
    } catch (error) {
      console.error(error, 'create employee error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async findOne(uuid: string) {
    try {
      const user = await this.employeeRepo.findOne({
        where: { uuid, is_delete: false },
      });

      if (!user) {
        return new NotFoundException({
          success: false,
          message: 'user not founded',
        });
      }

      return {
        success: true,
        message: 'employee details fetched',
        data: user,
      };
    } catch (error) {
      console.error(error, 'find employee error!');
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

      const [users, total] = await this.employeeRepo.findAndCount({
        where: { is_delete: false },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      return {
        success: true,
        message: 'fetched all employee list',
        data: users,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.log(error, 'find all employee error!');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async update(uuid: string, data: UpdateEmployeeDto) {
    try {
      const user = await this.employeeRepo.findOne({ where: { uuid } });

      if (!user) {
        return new NotFoundException({
          success: false,
          message: 'user not founded',
        });
      }

      Object.assign(user, data);

      await this.employeeRepo.save(user);

      return {
        success: true,
        message: 'employee details updated',
        data: user,
      };
    } catch (error) {
      console.error(error, 'employee update error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async softDelete(uuid: string) {
    try {
      await this.employeeRepo.update({ uuid }, { is_delete: true });

      return {
        success: true,
        message: 'employee deleted',
      };
    } catch (error) {
      console.error(error, 'employee update error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async GetAlltele() {
    const data = await this.employeeRepo.find({
      where: { is_delete: false },
      select: ['uuid', 'employee_name', 'emp_id'],
    });

    return data;
  }

  async activeEmployee() {
    const data = await this.employeeRepo.find({
      where: { is_active: true, is_delete: false },
      select: ['uuid', 'employee_name', 'emp_id', 'image', 'is_active'],
    });

    return data;
  }
}
