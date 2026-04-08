import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('dashboard')
  dashboard() {
    return this.appService.masterDashboard();
  }

  @GrpcMethod('CommonService', 'FetchDashBoard')
  getdashboard() {
    return this.appService.getdashboard();
  }
}
