import {
  Body,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  OnModuleInit,
  Post,
  Res,
} from '@nestjs/common';
import * as microservices from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom, Observable } from 'rxjs';
import { LeadsEntity, LeadStatus } from 'src/entities/leads.entity';
import { Repository } from 'typeorm';
import { ExportService } from './Export.service';
import type { Response } from 'express';

interface PaymentGrpc {
  GetAllPayment(data: any): Observable<any>;
  CreatePayment(data: any): Observable<any>;
}

@Controller('payment')
export class PaymentController implements OnModuleInit {
  private PaymentService: PaymentGrpc;

  constructor(
    @Inject('payment')
    private client: microservices.ClientGrpc,
    @InjectRepository(LeadsEntity)
    private leadRepo: Repository<LeadsEntity>,
    private exportService: ExportService,
  ) {}

  onModuleInit() {
    this.PaymentService = this.client.getService<PaymentGrpc>('PaymentService');
  }

  @Get('all')
  async findAll() {
    console.log("checling ")
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const grpc_res = await lastValueFrom(this.PaymentService.GetAllPayment({}));

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!grpc_res.success) {
      console.error('grpc telecaller auth create error!');
      return new InternalServerErrorException('internal server error');
    }

    console.log(grpc_res);

    return {
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      data: grpc_res?.data,
    };
  }

  @Get('report')
  async report(@Res() res: Response) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const grpc_res = await lastValueFrom(this.PaymentService.GetAllPayment({}));

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!grpc_res.success) {
      console.error('grpc telecaller auth create error!');
      return new InternalServerErrorException('internal server error');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.exportService.exportPayments(res, grpc_res?.data);
  }

  @Post('create')
  async create(@Body() data: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const lead = await this.leadRepo.findOne({ where: { uuid: data?.leadid } });
    if (!lead) {
      return 'lead are null';
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const grpc_res = await lastValueFrom(
      this.PaymentService.CreatePayment({ ...data, phoneNumber: lead.phone }),
    );

    await this.leadRepo.update(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      { uuid: data?.leadid },
      {
        status: LeadStatus.ADMITTED,
        course_name: data?.courseName,
        student_id: data?.studentId,
        name: data?.studentName,
        batch_id: data?.batchId,
      },
    );

    return {
      success: true,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      data: grpc_res?.data,
    };
  }
}
