import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Post,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {}
