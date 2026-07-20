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
  login(@Body() body: { payload: string }) {
    return this.studentSerivce.login(body);
  }

  @Put('reset-pass')
  resetpassword(@Body() data: { password: string; token: string }) {
    const decoded: { uuid: string; tokenUuid?: string } = this.jwtService.verify(data.token);

    return this.studentSerivce.updatePassword(decoded.uuid, data.password, decoded.tokenUuid);
  }

  @Post('forget-password')
  forgetpassword(@Body() data: { email: string }) {
    return this.studentSerivce.forgetPassword(data.email);
  }

  @Post('forget')
  forget(@Body() data: { email: string }) {
    return this.studentSerivce.forgetPassword(data.email);
  }

  @Put('forget-password')
  forgetpasswordPut(@Body() data: { email: string }) {
    return this.studentSerivce.forgetPassword(data.email);
  }

  @Put('forget')
  forgetPut(@Body() data: { email: string }) {
    return this.studentSerivce.forgetPassword(data.email);
  }

  @Get(':id')
  findOne(@Param() id: string) {
    return this.studentSerivce.findOne(id);
  }

  @GrpcMethod('StudentService', 'CreateStudent')
  create(data: { email: string; password: string; profileId: string }) {
    return this.studentSerivce.create(data);
  }
}
