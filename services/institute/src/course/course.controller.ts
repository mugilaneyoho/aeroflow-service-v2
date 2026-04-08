import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { GrpcMethod } from '@nestjs/microservices';

@Controller('course')
export class CourseController {
  constructor(private readonly courseSerivce: CourseService) {}

  @Post('create')
  create(@Body() body: CreateCourseDto) {
    return this.courseSerivce.create(body);
  }

  @Get('all')
  findAll(@Query() query: { page: string; limit: string }) {
    return this.courseSerivce.findAll(query);
  }

  @Get('dropdown')
  finddrop() {
    return this.courseSerivce.finddrop();
  }

  @Get(':uuid')
  findOne(@Param('uuid') uuid: string) {
    return this.courseSerivce.findOne(uuid);
  }

  @Put(':uuid')
  updateOne(@Param('uuid') uuid: string, @Body() body: UpdateCourseDto) {
    return this.courseSerivce.updateOne(uuid, body);
  }

  @Delete(':uuid')
  deleteOne(@Param('uuid') uuid: string) {
    return this.courseSerivce.softDelete(uuid);
  }

  @GrpcMethod('CourseService', 'GetById')
  find(courseid: string) {
    return this.courseSerivce.findOne(courseid);
  }
}
