import { Body, Controller, Param, Post, Put } from '@nestjs/common';
import { StaffService } from './staff.service';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { GrpcMethod } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';

@Controller('staff')
export class StaffController {
  constructor(
    private staffService: StaffService,
    private jwtService: JwtService,
  ) {}

  @Post('login')
  login(@Body() data: { payload: string }) {
    return this.staffService.login(data.payload);
  }

  @Put('reset-pass')
  resetpassword(@Body() data: { password: string; token: string }) {
    const decoded: { uuid: string; tokenUuid?: string } =
      this.jwtService.verify(data.token);

    return this.staffService.updatePassword(
      decoded.uuid,
      data.password,
      decoded.tokenUuid,
    );
  }

  @Post('forget')
  forget(@Body() data: { email: string }) {
    return this.staffService.forgetpassword(data.email);
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
