import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { StudentsService } from './students.service';
import type { StudentBody } from '../types';
import { GrpcMethod } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';

@Controller('students')
export class StudentsController {
  constructor(
    private readonly studentSerivce: StudentsService,
    private jwtService: JwtService,
  ) {}

  @Post('login')
  login(@Body() body: StudentBody) {
    return this.studentSerivce.login(body);
  }

  @Put('reset-pass')
  resetpassword(@Body() data: { password: string; token: string }) {
    const decoded: { uuid: string } = this.jwtService.verify(data.token);

    return this.studentSerivce.updatePassword(decoded.uuid, data.password);
  }

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
}
