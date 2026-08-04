import * as Sentry from '@sentry/nestjs';
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { InjectQueue } from '@nestjs/bull';
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
import type { Queue } from 'bull';
import csv from 'csv-parser';
import * as Excel from 'xlsx';
import { LeadsEntity, LeadStatus } from 'src/entities/leads.entity';
import { Readable } from 'stream';
import { And, Not, Repository, IsNull, In } from 'typeorm';
import { LeadsUpdateDto } from './dto/leads-update.dto';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class LeadsService implements OnModuleInit {
  constructor(
    @InjectRepository(LeadsEntity)
    private leadsRepo: Repository<LeadsEntity>,

    @InjectQueue('lead-assign')
    private queue: Queue,

    @Inject('activelog-service')
    private readonly kafkaActiveLog: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.kafkaActiveLog.connect();
    console.log('Lead service Kafka connected');
    this.queue.client.on('error', (err) => {
      console.error('Redis connection error', err);
    });
  }

  createActivity(payload: any) {
    console.log(' Saving activity to DB', payload);

    console.log(' EMITTING TO KAFKA');
    this.kafkaActiveLog.emit('activelog.created', {
      subject: 'Lead Activity',
      description: 'Lead created or updated',
      status: 'SUCCESS',
      referenceId: payload.uuid || 'temp-id',
      payload: payload,
    });
  }

  async uploadLeads(
    file: Express.Multer.File,
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(file, 'checking file upload');
      if (!file || !file?.buffer) {
        throw new BadRequestException('Invalid file upload');
      }

      const leads: Array<{
        name?: string;
        phone: string;
        email?: string;
      }> = [];

      const mimetype = file.mimetype;
      const originalname = file.originalname || '';
      const isCsv = originalname.endsWith('.csv') || mimetype.includes('csv');
      const isExcel =
        originalname.endsWith('.xlsx') ||
        originalname.endsWith('.xls') ||
        mimetype.includes('spreadsheetml') ||
        mimetype.includes('excel');

      if (isCsv) {
        await new Promise<void>((resolve, reject) => {
          Readable.from(file.buffer)
            .pipe(csv())
            .on(
              'data',
              (row: { name?: string; phone: string; email?: string }) => {
                if (row?.phone && row.phone.trim() !== '') {
                  leads.push({
                    name: row?.name,
                    phone: row?.phone.trim(),
                    email: row?.email,
                  });
                }
              },
            )
            .on('end', resolve)
            .on('error', reject);
        });
      } else if (isExcel) {
        const workbook = Excel.read(file.buffer, { type: 'buffer' });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rows: any[] = Excel.utils.sheet_to_json(sheet);

        for (const row of rows) {
          if (row?.phone) {
            leads.push({
              name: row?.name,
              phone: String(row?.phone).trim(),
              email: row?.email,
            });
          }
        }
      } else {
        throw new BadRequestException('Unsupported file type');
      }

      // De-duplicate within the uploaded file first
      const uniqueUploadsMap = new Map<string, (typeof leads)[0]>();
      for (const lead of leads) {
        if (lead.phone) {
          uniqueUploadsMap.set(lead.phone, lead);
        }
      }

      const finalLeadsToInsert: Array<{
        name?: string;
        phone: string;
        email?: string;
      }> = [];
      const phonesToCheck = Array.from(uniqueUploadsMap.keys());
      if (phonesToCheck.length > 0) {
        // Query existing phones in DB in bulk
        const existingLeads = await this.leadsRepo.find({
          where: { phone: In(phonesToCheck) },
          select: ['phone'],
        });
        const existingPhones = new Set(
          existingLeads.map((l) => l.phone.trim()),
        );

        for (const [phone, lead] of uniqueUploadsMap.entries()) {
          if (!existingPhones.has(phone)) {
            finalLeadsToInsert.push(lead);
          }
        }
      }

      if (finalLeadsToInsert.length) {
        await this.leadsRepo
          .createQueryBuilder()
          .insert()
          .into(LeadsEntity)
          .values(finalLeadsToInsert)
          .execute();

        this.kafkaActiveLog.emit('activelog.created', {
          subject: 'Leads Uploaded',
          userId: 'admin',
          activelogType: 'leads',
          description: `Uploaded ${finalLeadsToInsert.length} leads successfully (${leads.length - finalLeadsToInsert.length} duplicates skipped)`,
          type: 'CREATE',
          status: 'SUCCESS',
          referenceId: 'bulk-upload',
        });
      }

      return {
        success: true,
        message: `Leads uploaded successfully. Inserted: ${finalLeadsToInsert.length}, Skipped duplicates: ${leads.length - finalLeadsToInsert.length}`,
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'upload csv/excel file error!');
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async assignLeads(userid: any[], count: number) {
    try {
      console.log(userid, count);

      // Check if there are any unassigned leads
      const unassignedCount = await this.leadsRepo.count({
        where: { assignedTo: IsNull() },
      });

      if (unassignedCount === 0) {
        throw new BadRequestException(
          'No unallocated leads available. Please upload new leads first.',
        );
      }

      for (const user of userid) {
        await this.queue.add('assign', {
          id: user?.uuid,
          limit: count,
        });
      }

      this.kafkaActiveLog.emit('activelog.created', {
        subject: 'Leads Assigned',
        userId: 'admin',
        activelogType: 'leads',
        description: `Assigned up to ${count} leads to ${userid.length} telecallers`,
        type: 'UPDATE',
        status: 'SUCCESS',
        referenceId: 'bulk-assign',
      });

      return { success: true, message: 'leads assigned few minitues' };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'leads assign error!');
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async createManualLead(data: {
    name?: string;
    phone: string;
    notes?: string;
    status: LeadStatus;
    assignedTo: string;
  }) {
    try {
      if (!data.phone) {
        throw new BadRequestException('Phone number is required');
      }
      if (!data.assignedTo) {
        throw new BadRequestException('Telecaller is required');
      }

      const exist = await this.leadsRepo.findOne({
        where: {
          phone: data.phone,
        },
      });

      if (exist) {
        throw new ConflictException('leads already exists');
      }

      const lead = this.leadsRepo.create({
        name: data.name,
        phone: data.phone,
        notes: data.notes,
        status: data.status || LeadStatus.ASSIGNED,
        assignedTo: data.assignedTo,
        assignedAt: new Date(),
      });

      await this.leadsRepo.save(lead);

      this.kafkaActiveLog.emit('activelog.created', {
        subject: 'Lead Created',
        userId: data.assignedTo,
        activelogType: 'telecallers',
        description: `Lead ${data.name || data.phone} created and assigned`,
        type: 'CREATE',
        status: 'SUCCESS',
        referenceId: lead.uuid,
      });

      return {
        success: true,
        message: 'Lead manually allocated successfully.',
        data: lead,
      };
    } catch (error) {
      Sentry.captureException(error);
      if (error.status == 409) {
        throw new ConflictException("number already exist")
      }
      console.error(error, 'manual lead allocation error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async update(data: LeadsUpdateDto, uuid: string) {
    try {
      const lead = await this.leadsRepo.findOne({
        where: {
          uuid,
          status: And(Not(LeadStatus.REJECTED), Not(LeadStatus.ADMITTED)),
        },
      });
      if (!lead) {
        return new NotFoundException({
          success: false,
          message: 'leads not founded in db.',
        });
      }

      Object.assign(lead, data);

      await this.leadsRepo.save(lead);

      this.kafkaActiveLog.emit('activelog.created', {
        subject: 'Status Updated',
        userId: lead.assignedTo,
        activelogType: 'telecallers',
        description: `Lead status updated to ${data.status}`,
        type: 'UPDATE',
        status: 'SUCCESS',
        referenceId: lead.uuid,
      });

      return {
        success: true,
        message: 'leads updated successfully.',
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'leads updated error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async findAll(query: {
    page: string;
    limit: string;
    search?: string;
    status?: string;
  }) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      const search = query.search || '';
      const status = query.status || '';

      const queryBuilder = this.leadsRepo
        .createQueryBuilder('leads')
        .leftJoinAndSelect('leads.employee', 'employee');

      if (status && status !== 'All Status') {
        queryBuilder.andWhere('leads.status = :status', { status });
      } else {
        queryBuilder.andWhere('leads.status != :newStatus', {
          newStatus: LeadStatus.NEW,
        });
      }

      if (search) {
        queryBuilder.andWhere(
          '(leads.name ILIKE :search OR leads.phone ILIKE :search OR leads.course_name ILIKE :search OR employee.employee_name ILIKE :search OR employee.emp_id ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      queryBuilder
        .orderBy('leads.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      const [leads, total] = await queryBuilder.getManyAndCount();

      return {
        success: true,
        message: 'lead data fetched',
        data: leads,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'leads fetch all error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async findByEmployee(
    uuid: string,
    query: { page?: string; limit?: string; status: LeadStatus },
  ) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 10;
      let leads: LeadsEntity[];
      let total: number;

      if (query.status == LeadStatus.ASSIGNED) {
        [leads, total] = await this.leadsRepo.findAndCount({
          where: {
            assignedTo: uuid,
            status: query.status,
          },
          select: ['uuid', 'phone', 'notes', 'status', 'name'],
          skip: (page - 1) * limit,
          take: limit,
          order: { createdAt: 'DESC' },
        });
      } else {
        [leads, total] = await this.leadsRepo.findAndCount({
          where: {
            assignedTo: uuid,
            status: query.status,
          },
          relations: ['employee'],
          skip: (page - 1) * limit,
          take: limit,
          order: { createdAt: 'DESC' },
        });
      }

      return {
        success: true,
        message: 'leads fetched by employee',
        data: leads,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'leads fetch all error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async findCompleted(uuid: string, query?: { page?: string; limit?: string }) {
    try {
      const page = Number(query?.page) || 1;
      const limit = Number(query?.limit) || 10;

      const [leads, total] = await this.leadsRepo.findAndCount({
        where: {
          assignedTo: uuid,
          status: And(Not(LeadStatus.ADMITTED), Not(LeadStatus.ASSIGNED)),
        },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      return {
        success: true,
        message: 'completed leads fetched',
        data: leads,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'leads fetch all error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }

  async recentAdmit() {
    const data = await this.leadsRepo.find({
      where: { status: LeadStatus.ADMITTED },
      take: 10,
      relations: ['employee'],
      order: { createdAt: 'DESC' },
    });

    return data;
  }

  async findByStatus(uuid: string) {
    try {
      const leadStatsRaw = await this.leadsRepo
        .createQueryBuilder('leads')
        .select('leads.assignedTo', 'assignedTo')
        .addSelect('leads.status', 'status')
        .addSelect('COUNT(leads.id)', 'count')
        .where('leads.assignedTo = :assignedTo', {
          assignedTo: uuid,
        })
        .groupBy('leads.assignedTo')
        .addGroupBy('leads.status')
        .getRawMany();

      const leadStats = leadStatsRaw.reduce(
        (acc: any, row: any) => {
          acc[row.status] = Number(row.count);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return acc;
        },
        {} as Record<string, number>,
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return leadStats;
    } catch (error) {
      Sentry.captureException(error);
      console.error(error, 'leads fetch all error');
      throw new InternalServerErrorException({
        success: false,
        message: 'internal server error',
      });
    }
  }
}
