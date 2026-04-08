import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { StudentsService } from './students.service';
import type { StudentBody } from '../types';
import { GrpcMethod } from '@nestjs/microservices';

@Controller('students')
export class StudentsController {
  constructor(private readonly studentSerivce: StudentsService) {}

  @Post('login')
  login(@Body() body: StudentBody) {
    return this.studentSerivce.login(body);
  }
  // @Post('create')
  // create(@Body() body: StudentBody) {
  //   return this.studentSerivce.create(body);
  // }

  @Get(':id')
  findOne(@Param() id: string) {
    return this.studentSerivce.findOne(id);
  }

  @GrpcMethod('StudentService', 'CreateStudent')
  create(data: { email: string; password: string; profileId: string }) {
    return this.studentSerivce.create(data);
  }

  // @Post('verify')
  // @Post('forget')
  // @Put('reset-pass')
}
