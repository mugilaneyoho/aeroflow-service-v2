import { Injectable, Logger } from '@nestjs/common';
import {
  OpenVidu,
  Session,
  OpenViduRole,
  TokenOptions,
} from 'openvidu-node-client';

@Injectable()
export class AppService {}