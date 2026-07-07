import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
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
  findAll(
    @Query()
    query: {
      page: string;
      limit: string;
      approved?: string;
      isbatch?: string;
    },
  ) {
    return this.studentService.findAll(query);
  }

  @Get('placement')
  findplacement(@Query() query: { eligible: any }) {
    const isEligible = String(query.eligible) === 'true';
    return this.studentService.getplacement(isEligible);
  }

  @Roles([Role.MASTER, Role.HOD, Role.SUBADMIN])
  @Patch(':uuid/approve')
  approveStudent(@Param('uuid') uuid: string) {
    return this.studentService.approveStudent(uuid);
  }

  @Roles([Role.STUDENT])
  @Get('dashboard')
  dashboard(@Req() req: { headers: { user: string } }) {
    return this.studentService.dashboard(req);
  }

  @Get('masterdash')
  masterdash() {
    return this.studentService.studentCount();
  }

  @Get('report-student')
  getStudentReport() {
    return this.studentService.getStudentReport();
  }

  @Get('export-Report')
  async exportStudentReport(@Res() res: Response) {
    await this.studentService.generateStudentReportExcel(res);
  }

  @Get(':uuid')
  findOne(@Param('uuid') uuid: string) {
    return this.studentService.findOne(uuid);
  }

  @Delete(':uuid')
  deleteOne(@Param('uuid') uuid: string) {
    return this.studentService.deleteOne(uuid);
  }

  @Get('report/:uuid')
  async downloadPaymentReport(
    @Param('uuid') uuid: string,
    @Res() res: Response,
  ) {
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

  @Get(':uuid/application')
  async getapplication(@Param(':uuid') uuid: string, @Res() res: any) {
    const pdfBuffer = await this.studentService.getApplication(uuid);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=application.pdf',

      // 'Content-Length': pdfBuffer.length,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    res.end(pdfBuffer);
  }

  @GrpcMethod('StudentService', 'GetStudent')
  async getStudent(data: { uuid: string }) {
    const res = await this.studentService.findOne(data.uuid);
    return {
      data: JSON.stringify(res),
    };
  }

  @GrpcMethod('StudentService', 'PlacementEligible')
  async placement(req: { data: string[] }) {
    const res = await this.studentService.updatePlacementEligible(req.data);
    return res;
  }

  @Patch(':uuid')
  async studentLocationUpdate(@Param('uuid') uuid: string, @Body() data: any) {
    return this.studentService.studentLocationUpdate(uuid, data);
  }

  @Put(':uuid')
  async update(@Param('uuid') uuid: string, @Body() data: any) {
    return this.studentService.update(uuid, data);
  }
}
