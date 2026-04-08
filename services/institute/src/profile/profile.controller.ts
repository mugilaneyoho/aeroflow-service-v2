import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';

@Controller('profile')
export class ProfileController {
  constructor(private readonly insituteService: ProfileService) {}

  @Post('create')
  create(@Body() body: CreateProfileDto) {
    return this.insituteService.create(body);
  }

  @Get('all')
  all() {
    return this.insituteService.findAll();
  }

  @Get(':uuid')
  findOne(@Param('uuid') uuid: string) {
    return this.insituteService.findOne(uuid);
  }

  @Put(':uuid')
  updateOne(@Param('uuid') uuid: string, @Body() data: UpdateProfileDto) {
    return this.insituteService.updateOne(data, uuid);
  }
}
