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

@Controller('admins')
export class AdminsController {
  constructor(private readonly adminService: AdminsService) {}

  @Post('login')
  login(@Body() data: { email: string; password: string }) {
    return this.adminService.login(data.email, data.password);
  }

  @Post('create')
  create(@Body() data: CreateAdminDto) {
    return this.adminService.create(data);
  }

  @Get('all')
  findAll(@Query() query: { page: string; limit: string }) {
    return this.adminService.findAll(query);
  }

  @Put(':uuid')
  update(@Param('uuid') uuid: string, @Body() data: UpdateAdminDto) {
    return this.adminService.update(uuid, data);
  }

  @Delete(':uuid')
  softdelete(@Param('uuid') uuid: string) {
    return this.adminService.deleteOne(uuid);
  }
}
