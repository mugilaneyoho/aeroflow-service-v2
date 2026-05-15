import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res
} from '@nestjs/common';
import type { Response } from 'express';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';
import { GrpcMethod } from '@nestjs/microservices';

@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('/feesgetall')
  feesgetall() {
    return this.studentService.feesgetall();
  }

  @Post('create')
  create(@Body() data: CreateStudentDto) {
    return this.studentService.create(data);
  }

  @Get('all')
  findAll(@Query() query: { page: string; limit: string }) {
    return this.studentService.findAll(query);
  }

  @Roles([Role.STUDENT])
  @Get('dashboard')
  dashboard(@Req() req: { headers: { user: string } }) {
    return this.studentService.dashboard(req);
  }

  @Get(':uuid')
  findOne(@Param('uuid') uuid: string) {
    return this.studentService.findOne(uuid);
  }

  @Delete(':uuid')
  deleteOne(@Param('uuid') uuid: string) {
    return this.studentService.deleteOne(uuid);
  }

  @Get('report-student')
  getStudentReport() {
    return this.studentService.getStudentReport();
  }

  @Get('report/:uuid')
  async downloadPaymentReport(@Param('uuid') uuid: string, @Res() res: Response) {
    await this.studentService.generatePaymentExcel(uuid, res);
  }

  @Roles([Role.STUDENT])
  @Get(':uuid/fees')
  getStudentFees(
    @Req() req: { headers: { user: string } },
    @Param('uuid') uuid: string,
  ) {
    const user: { profile_id: string } = JSON.parse(req.headers.user) as {
      profile_id: string;
    };
    return this.studentService.getStudentFees(user.profile_id ?? uuid);
  }

  @GrpcMethod('StudentService', 'GetStudent')
  async getStudent(data: { uuid: string }) {
    const res = await this.studentService.findOne(data.uuid);
    return {
      data: JSON.stringify(res),
    };
  }
}
