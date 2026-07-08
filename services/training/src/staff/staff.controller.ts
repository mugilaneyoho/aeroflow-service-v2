import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';
import type { Request } from 'express';

@ApiTags('Staff')
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) { }

  @Get('staffs-get')
  async getStaffsForChat() {
    return this.staffService.getStaffsforChat();
  }

  // @Roles([Role.HOD])
  @Post('create')
  @ApiOperation({ summary: 'create new staff' })
  create(@Body() data: CreateStaffDto) {
    return this.staffService.create(data);
  }

  @Get('all')
  @ApiOperation({ summary: 'get all staff list' })
  findAll(@Query() query: { page: string; limit: string }) {
    return this.staffService.findAll(query);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'get dashboard data' })
  dashboard() {
    return this.staffService.dashboard();
  }

  @Get('dropdown')
  dropdown() {
    return this.staffService.dropdown();
  }

  @Roles([Role.HOD])
  @Put(':uuid')
  @ApiOperation({ summary: 'edit staff details only' })
  update(@Param('uuid') uuid: string, @Body() data: UpdateStaffDto) {
    return this.staffService.update(uuid, data);
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'get single staff details' })
  @ApiParam({ name: 'uuid', type: String })
  findOne(@Param('uuid') uuid: string, @Req() req: Request) {
    if (uuid === 'token') {
      const user: { profile_id: string } = JSON.parse(
        req.headers.user as string,
      ) as {
        profile_id: string;
      };
      return this.staffService.findOne(user?.profile_id);
    } else {
      return this.staffService.findOne(uuid);
    }
  }

  @Roles([Role.HOD])
  @Delete(':uuid')
  @ApiOperation({ summary: 'soft delete in staff' })
  @ApiParam({ name: 'uuid', type: String })
  deleteOne(@Param('uuid') uuid: string) {
    return this.staffService.deleteOne(uuid);
  }
}
