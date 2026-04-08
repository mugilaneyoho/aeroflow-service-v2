/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmployeEntity } from './entities/employee.entity';
import { Repository } from 'typeorm';
import { LeadsEntity } from './entities/leads.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(EmployeEntity)
    private employeeRepo: Repository<EmployeEntity>,

    @InjectRepository(LeadsEntity)
    private leadsRepo: Repository<LeadsEntity>,
  ) {}

  async dashboad() {
    try {
      const total = await this.employeeRepo.count({
        where: { is_delete: false },
      });

      const leads = await this.leadsRepo
        .createQueryBuilder('leads')
        .select('leads.status', 'status')
        .addSelect('COUNT(leads.id)', 'count')
        .groupBy('leads.status')
        .getRawMany();

      const leadcounts = leads.reduce<Record<string, number>>(
        (acc, cur: Record<string, number>) => {
          acc[cur.status] = Number(cur.count);
          return acc;
        },
        {},
      );

      return {
        success: true,
        message: 'dashboard data fetched',
        data: {
          employees: total,
          leadcounts,
        },
      };
    } catch (error) {
      console.error(error, 'telecalling dashboad error!');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async getstatus() {
    try {
      const employees = await this.employeeRepo.find({
        where: { is_delete: false },
        select: ['emp_id', 'id', 'uuid', 'is_active', 'employee_name'],
      });

      const leadStats = await this.leadsRepo
        .createQueryBuilder('leads')
        .select('leads.assignedTo', 'assignedTo')
        .addSelect('leads.status', 'status')
        .addSelect('COUNT(leads.id)', 'count')
        .groupBy('leads.assignedTo')
        .addGroupBy('leads.status')
        .getRawMany();

      const leadMap: Record<string, Record<string, number>> = {};

      for (const row of leadStats) {
        if (!leadMap[row.assignedTo]) {
          leadMap[row.assignedTo] = {};
        }
        leadMap[row.assignedTo][row.status] = Number(row.count);
      }

      const empStatus = employees.map((emp) => ({
        ...emp,
        leadcounts: leadMap[emp.uuid] || {},
      }));

      return {
        success: true,
        message: 'employee status fetched.',
        data: empStatus,
      };
    } catch (error) {
      console.error(error, 'telecalling dashboad error!');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  getHello(): string {
    return 'telecalling service is runing';
  }
}
