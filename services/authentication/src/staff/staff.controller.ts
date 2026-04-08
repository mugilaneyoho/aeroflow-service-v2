import { Body, Controller, Param, Post, Put } from '@nestjs/common';
import { StaffService } from './staff.service';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { GrpcMethod } from '@nestjs/microservices';

@Controller('staff')
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Post('login')
  login(@Body() data: { email: string; password: string }) {
    return this.staffService.login(data.email, data.password);
  }

  @GrpcMethod('StaffService', 'CreateStaff')
  create(data: { email: string; password: string; profileId: string }) {
    return this.staffService.create(data);
  }

  @Put(':uuid')
  update(@Param('uuid') uuid: string, @Body() data: UpdateStaffDto) {
    return this.staffService.update(uuid, data);
  }
}
