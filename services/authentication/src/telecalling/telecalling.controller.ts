import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { TelecallingService } from './telecalling.service';
import { GrpcMethod } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';

@Controller('telecalling')
export class TelecallingController {
  constructor(
    private readonly telecallerService: TelecallingService,
    private jwtService: JwtService,
  ) {}

  @Post('login')
  login(@Body() data: { email: string; password: string }) {
    return this.telecallerService.login(data.email, data.password);
  }

  @Put('reset-pass')
  resetpassword(@Body() data: { password: string; token: string }) {
    const decoded: { uuid: string } = this.jwtService.verify(data.token);

    return this.telecallerService.updatePassword(decoded.uuid, data.password);
  }

  @Get(':uuid')
  findOne(@Param('uuid') uuid: string) {
    return this.telecallerService.findOne(uuid);
  }

  @GrpcMethod('TelecallingService', 'CreateUser')
  createPass(data: { email: string; password: string; profileId: string }) {
    return this.telecallerService.CreateUSer(data);
  }
}
