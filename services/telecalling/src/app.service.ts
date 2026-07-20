import * as Sentry from '@sentry/nestjs';
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmployeEntity } from './entities/employee.entity';
import { Repository } from 'typeorm';
import { LeadsEntity } from './entities/leads.entity';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

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
      Sentry.captureException(error);
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
        select: [
          'emp_id',
          'id',
          'uuid',
          'is_active',
          'employee_name',
          'clock_in',
          'clock_out',
          'duration',
        ],
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
      Sentry.captureException(error);
      console.error(error, 'telecalling dashboad error!');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async getReports(res: Response) {
    const reports = await this.getstatus();

    const data = reports.data;

    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet('employee-reports');

    // Columns
    worksheet.columns = [
      { header: 'Employee Id', key: 'emp_id', width: 20 },
      { header: 'Employee Name', key: 'emp_name', width: 25 },
      { header: 'Pending Leads', key: 'pending', width: 15 },
      { header: 'Waiting Leads', key: 'waiting', width: 15 },
      { header: 'Interested Leads', key: 'interested', width: 15 },
      { header: 'Not-Interested Leads', key: 'notinterested', width: 15 },
      { header: 'Admitted Leads', key: 'admintted', width: 15 },
      { header: 'Total Leads', key: 'total', width: 15 },
    ];

    // Add rows
    data.forEach((report) => {
      worksheet.addRow({
        emp_id: report?.emp_id,
        emp_name: report?.employee_name,
        pending: report?.leadcounts?.ASSIGNED || 0,
        waiting: report?.leadcounts?.WAITING || 0,
        interested: report?.leadcounts?.INTERESTED || 0,
        notinterested: report?.leadcounts?.REJECTED || 0,
        admitted: report?.leadcounts?.ADMITTED || 0,
        total:
          (report?.leadcounts?.ASSIGNED || 0) +
          (report?.leadcounts?.WAITING || 0) +
          (report?.leadcounts?.INTERESTED || 0) +
          (report?.leadcounts?.REJECTED || 0) +
          (report?.leadcounts?.ADMITTED || 0),
      });
    });

    // Header style
    worksheet.getRow(1).font = {
      bold: true,
      color: { argb: 'FFFFFF' },
    };

    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1F4E78' },
    };

    // Center align
    worksheet.eachRow((row) => {
      row.alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };
    });

    // Response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    res.setHeader('Content-Disposition', 'attachment; filename=employee.xlsx');

    // Export
    await workbook.xlsx.write(res);

    res.end();
  }

  getHello(): string {
    return 'telecalling service is runing';
  }
}
