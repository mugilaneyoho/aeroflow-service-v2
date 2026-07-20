import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { ActivelogService } from './activelog.service';
import { ActivityLogEntity, ActivityType, ActivityStatus } from '../entity/activitylog';
import {
  Ctx,
  EventPattern,
  RmqContext,
  MessagePattern,
  Payload,
} from '@nestjs/microservices';

@Controller('activelog')
export class ActivelogController {
  constructor(private readonly activeLogService: ActivelogService) {}

  @EventPattern('activelog.created')
  async handleActivityCreated(
    @Payload() payload: any,
    @Ctx() context: RmqContext,
  ) {
    const data = payload;

    console.log('ACTIVITY EVENT RECEIVED OVER RabbitMQ');
    console.log('Pattern:', context.getPattern());
    console.log('Data:', data);

    try {
      await this.activeLogService.create({
        title: data.subject || data.title || 'Lead Activity',
        description: data.description || 'No description',
        type: (data.type as ActivityType) || ActivityType.UPDATE,
        status: (data.status as ActivityStatus) || ActivityStatus.SUCCESS,
        performedBy: data.userId || data.performedBy || 'System',
        relatedEntity: data.referenceId || data.relatedEntity || null,
      });
      console.log('Activity log saved successfully to DB.');
    } catch (error) {
      console.error('Failed to save activity log:', error);
    }
  }
  @Post()
  async create(@Body() body: Partial<ActivityLogEntity>) {
    return this.activeLogService.create(body);
  }

  @Get()
  async findAll() {
    return this.activeLogService.findAll();
  }

  @Get(':uuid')
  async findOne(@Param('uuid') uuid: string) {
    return this.activeLogService.findOne(uuid);
  }

  @Put(':uuid')
  async update(
    @Param('uuid') uuid: string,
    @Body() body: Partial<ActivityLogEntity>,
  ) {
    return this.activeLogService.update(uuid, body);
  }

  @Delete(':uuid')
  async remove(@Param('uuid') uuid: string) {
    return this.activeLogService.remove(uuid);
  }
}
