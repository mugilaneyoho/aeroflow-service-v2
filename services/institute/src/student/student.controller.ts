import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';

@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post('create')
  create(@Body() data: CreateStudentDto) {
    return this.studentService.create(data);
  }

  @Get('all')
  findAll(@Query() query: { page: string; limit: string }) {
    return this.studentService.findAll(query);
  }

  @Roles([Role.STUDENT])
  @Get('dashboard')
  dashboard(@Req() req: { headers: { user: string } }) {
    return this.studentService.dashboard(req);
  }

  @Get(':uuid')
  findOne(@Param('uuid') uuid: string) {
    return this.studentService.findOne(uuid);
  }

  @Delete(':uuid')
  deleteOne(@Param('uuid') uuid: string) {
    return this.studentService.deleteOne(uuid);
  }

  @Get(':uuid/fees')
  getStudentFees(@Param('uuid') uuid: string){
    return this.studentService.getStudentFees(uuid)
  }
}
