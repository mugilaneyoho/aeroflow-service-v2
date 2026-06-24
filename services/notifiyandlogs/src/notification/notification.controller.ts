import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotifyDto } from '../dto/CreateNotifyDto';
import { UpdateNotificationDto } from 'src/dto/UpdateNotifyDto';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @MessagePattern('notifyandlog.NotificationCreated')
  handleNotificationCreated(@Payload() message: any) {
    console.log('Notification created :', message);
  }

  @Get()
  async findAll(@Req() req: { headers: { user: string } }) {
    const user: { role: string } = JSON.parse(req.headers.user) as {
      role: string;
    };
    return this.notificationService.findAll(user);
  }

  @Get(':uuid')
  async findOne(@Param('uuid') id: string) {
    return this.notificationService.findOne(id);
  }

  @Put(':uuid')
  async update(
    @Param('uuid') uuid: string,
    @Body() dto: UpdateNotificationDto,
  ) {
    return this.notificationService.update(uuid, dto);
  }

  @Delete(':uuid')
  async remove(@Param('uuid') uuid: string) {
    return this.notificationService.remove(uuid);
  }

  @EventPattern('placement.invited')
  async handlePlacementInvite (@Payload() data: any,) {
    return this.notificationService.create(data)
  }
}
