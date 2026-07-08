import { Body, Controller, Get, Param, Post, Query, Req, Res } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';
import type { Response } from 'express';

@Controller('attendance')
export class AttendanceController {
  constructor(private attendaceService: AttendanceService) {}

  @Post('create')
  @Roles([Role.STAFF])
  create(
    @Body() data: CreateAttendanceDto,
    @Req() req: { headers: { user: string } },
  ) {
    return this.attendaceService.create(data, req);
  }

  @Get('pending')
  findAll(
    @Req() req: { headers: { user: string } },
    @Query() query: { classid: string; classmode: string },
  ) {
    return this.attendaceService.FindPendingClass(
      req,
      query.classid,
      query.classmode,
    );
  }

  @Roles([Role.STUDENT])
  @Get('student')
  student(
    @Req() req: { headers: { user: string } },
    @Query('date') date: string,
  ) {
    return this.attendaceService.FindStudentAttendance(req, date);
  }

  @Get('report/export')
  async exportReport(
    @Res() res: Response,
    @Query('studentId') studentId?: string,
    @Query('batchId') batchId?: string,
  ) {
    await this.attendaceService.exportAttendanceReport(res, studentId, batchId);
  }

  @Get('rates')
  getRates() {
    return this.attendaceService.getRates();
  }

  @Get('student/:studentId/log')
  getStudentLog(@Param('studentId') studentId: string) {
    return this.attendaceService.getStudentLog(studentId);
  }

  @Get(':classId')
  find(@Param('classId') classId: string) {
    return this.attendaceService.findAll(classId);
  }
}
