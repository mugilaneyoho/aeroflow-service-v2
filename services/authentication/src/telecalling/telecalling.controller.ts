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
  login(@Body() data: { payload: string }) {
    return this.telecallerService.login(data.payload);
  }

  @Put('reset-pass')
  resetpassword(@Body() data: { password: string; token: string }) {
    const decoded: { uuid: string; tokenUuid?: string } = this.jwtService.verify(data.token);

    return this.telecallerService.updatePassword(decoded.uuid, data.password, decoded.tokenUuid);
  }

  @Post('forget-password')
  forgetpassword(@Body() data: { email: string }) {
    return this.telecallerService.forgetPassword(data.email);
  }

  @Post('forget')
  forget(@Body() data: { email: string }) {
    return this.telecallerService.forgetPassword(data.email);
  }

  @Put('forget-password')
  forgetpasswordPut(@Body() data: { email: string }) {
    return this.telecallerService.forgetPassword(data.email);
  }

  @Put('forget')
  forgetPut(@Body() data: { email: string }) {
    return this.telecallerService.forgetPassword(data.email);
  }

  @Put('admin-set-password')
  adminSetPassword(@Body() data: { profileId?: string; email?: string; password: string }) {
    return this.telecallerService.adminSetPassword(data);
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

