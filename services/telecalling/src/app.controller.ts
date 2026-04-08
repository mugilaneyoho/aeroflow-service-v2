import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('common')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'test service run or not' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'get admin dashboard details' })
  dash() {
    return this.appService.dashboad();
  }

  @Get('emp-status')
  @ApiOperation({ summary: 'get telecaller work status' })
  getstatus() {
    return this.appService.getstatus();
  }
}
