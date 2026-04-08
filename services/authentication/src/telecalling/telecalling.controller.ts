import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TelecallingService } from './telecalling.service';
import { GrpcMethod } from '@nestjs/microservices';

@Controller('telecalling')
export class TelecallingController {
  constructor(private readonly telecallerService: TelecallingService) {}

  @Post('login')
  login(@Body() data: { email: string; password: string }) {
    return this.telecallerService.login(data.email, data.password);
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
