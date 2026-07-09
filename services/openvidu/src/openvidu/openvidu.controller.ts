import * as Sentry from '@sentry/nestjs';
// src/openvidu/openvidu.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
  Req,
} from '@nestjs/common';
import { OpenViduService } from './openvidu.service';
import { JoinClassroomDto } from './dto/join-classroom.dto';
import { CloseClassroomDto } from './dto/close-classroom.dto';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';

@Controller('api/classroom')
export class OpenViduController {
  private readonly logger = new Logger(OpenViduController.name);

  constructor(private readonly openViduService: OpenViduService) {}

  @Post('join')
  @HttpCode(HttpStatus.OK)
  @Roles([Role.STAFF, Role.STUDENT])
  async join(
    @Body() joinDto: JoinClassroomDto,
    @Req() req: { headers: { user: string } },
  ) {
    try {
      const user: { email: string; role: string } = JSON.parse(
        req.headers.user,
      ) as { email: string; role: string };
      this.logger.log(
        `${joinDto.classId} (${joinDto.mode}) joining interactive session ${joinDto.classId}`,
      );

      const { token, sessionId, participantName } =
        await this.openViduService.generateToken(
          joinDto.classId,
          user.email,
          user.role,
        );

      return {
        success: true,
        token: token,
        sessionId,
        participantName,
        role: user.role,
        mode: 'interactive',
      };
    } catch (error) {
      Sentry.captureException(error);
      this.logger.error(`Join failed: ${error.message}`);
      throw new BadRequestException({
        success: false,
        message: 'Failed to join interactive classroom',
        error: error.message,
      });
    }
  }

  @Post('close')
  @HttpCode(HttpStatus.OK)
  async close(@Body() closeDto: CloseClassroomDto) {
    try {
      await this.openViduService.closeSession(closeDto.sessionId);

      return {
        success: true,
        message: `Interactive classroom ${closeDto.sessionId} closed successfully`,
      };
    } catch (error) {
      Sentry.captureException(error);
      this.logger.error(`Close failed: ${error.message}`);
      throw new BadRequestException({
        success: false,
        message: 'Failed to close classroom',
        error: error.message,
      });
    }
  }
}
