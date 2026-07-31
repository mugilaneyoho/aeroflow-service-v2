import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { Roles } from 'src/role/role.decorator';


@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('logs')
  @Roles([])
  @ApiOperation({ summary: 'Get all notification logs (Master Admin only)' })
  getAllLogs() {
    return this.notificationsService.getAllLogs();
  }

  @Post('retry/:logId')
  @Roles([])
  @ApiOperation({ summary: 'Retry sending a failed notification' })
  retryNotification(@Param('logId') logId: string) {
    return this.notificationsService.retryNotification(logId);
  }
}
