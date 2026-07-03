import { Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ZoomService } from './zoom.service';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';

@Controller('zoom')
export class ZoomController {
  constructor(private zoomService: ZoomService) {}

  @Post('meeting')
  createMeeting() {
    return this.zoomService.createMeeting();
  }

  @Roles([Role.STAFF, Role.STUDENT])
  @Get('meeting/:classId')
  getmeering(
    @Req() req: { headers: { user: string } },
    @Param('classId') classId: string,
  ) {
    const user: { role: string } = JSON.parse(req.headers.user) as {
      role: string;
    };

    return this.zoomService.join(classId, user.role);
  }
}
