import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { JwtService } from '@nestjs/jwt';

@Controller('admins')
export class AdminsController {
  constructor(
    private readonly adminService: AdminsService,
    private jwtService: JwtService,
  ) { }

  @Post('login')
  login(@Body() data: { payload: string }) {
    return this.adminService.login(data.payload);
  }

  @Post('create')
  create(@Body() data: CreateAdminDto) {
    return this.adminService.create(data);
  }

  @Get('all')
  findAll(@Query() query: { page: string; limit: string }) {
    return this.adminService.findAll(query);
  }

  @Put('reset-pass')
  resetpassword(@Body() data: { password: string; token: string }) {
    const decoded: { uuid: string; tokenUuid?: string } = this.jwtService.verify(data.token);

    return this.adminService.updatePassword(decoded.uuid, data.password, decoded.tokenUuid);
  }

  @Post('forget-password')
  forgetpassword(@Body() data: { email: string }) {
    return this.adminService.forgetPassword(data.email);
  }

  @Post('forget')
  forget(@Body() data: { email: string }) {
    return this.adminService.forgetPassword(data.email);
  }

  @Put('forget-password')
  forgetpasswordPut(@Body() data: { email: string }) {
    return this.adminService.forgetPassword(data.email);
  }

  @Put('forget')
  forgetPut(@Body() data: { email: string }) {
    return this.adminService.forgetPassword(data.email);
  }

  @Put(':uuid')
  update(@Param('uuid') uuid: string, @Body() data: UpdateAdminDto) {
    return this.adminService.update(uuid, data);
  }

  @Delete(':uuid')
  softdelete(@Param('uuid') uuid: string) {
    return this.adminService.deleteOne(uuid);
  }

  @Get('get-admins')
  getAdminsForchat() {
    return this.adminService.getAdminsForChat();
  }
}
