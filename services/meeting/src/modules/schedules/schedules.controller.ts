import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/create-schedule.dto';
import { Roles } from 'src/role/role.decorator';

@ApiTags('Schedules')
@ApiBearerAuth()
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @Roles([])
  @ApiOperation({ summary: 'Create daily work schedule (Master Admin only)' })
  create( @Body() dto: CreateScheduleDto) {
    return this.schedulesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all work schedules' })
  findAll() {
    return this.schedulesService.findAll();
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available meeting time slots for a given date' })
  @ApiQuery({ name: 'date', required: false, example: '2026-08-01' })
  getAvailableSlots(@Query('date') date?: string) {
    return this.schedulesService.getAvailableSlots(date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get schedule by ID' })
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Put(':id')
  @Roles([])
  @ApiOperation({ summary: 'Update work schedule' })
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.schedulesService.update(id, dto);
  }

  @Delete(':id')
  @Roles([])
  @ApiOperation({ summary: 'Delete work schedule' })
  remove(@Param('id') id: string) {
    return this.schedulesService.remove(id);
  }
}
