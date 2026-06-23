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
import { BatchService } from './batch.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { GrpcMethod } from '@nestjs/microservices';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';

@Controller('batch')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Roles([Role.HOD])
  @Post('create')
  create(@Body() body: CreateBatchDto) {
    return this.batchService.create(body);
  }

  @Roles([Role.HOD])
  @Get('all')
  findAll(@Query() query: { page: string; limit: string }) {
    return this.batchService.findAll(query);
  }

  @Roles([Role.HOD])
  @Post('re-allocate')
  reallocated(@Body() data: { studentId: string; batchid: string }) {
    return this.batchService.reAllocationBatch(data.studentId, data.batchid);
  }

  @Roles([Role.HOD])
  @Get('all/:courseid')
  findAllByCourse(
    @Param('courseid') courseid: string,
    @Query() query: { page: string; limit: string },
  ) {
    return this.batchService.findAllBycourse(courseid, query);
  }

  @Get('dropdown/:courseid')
  finddropdownByCourse(@Param('courseid') courseid: string) {
    return this.batchService.finddropdownBycourse(courseid);
  }

  @Get(':uuid')
  findOne(@Param('uuid') uuid: string) {
    return this.batchService.findOne(uuid);
  }

  @Put(':uuid')
  updateOne(@Param('uuid') uuid: string, @Body() data: UpdateBatchDto) {
    return this.batchService.updateOne(uuid, data);
  }

  @Delete(':uuid')
  delete(@Param('uuid') uuid: string) {
    return this.batchService.softDelete(uuid);
  }

  @GrpcMethod('BatchService', 'GetById')
  findId(data: { batchid: string }) {
    console.log(data);
    return this.batchService.findOne(data.batchid);
  }

  @GrpcMethod('BatchService', 'GetAllBatch')
  find(data: { couseid: string }) {
    return this.batchService.findAllBycourseNew(data.couseid);
  }

  @GrpcMethod('BatchService', 'GetByStudentId')
  findstudent(data: { studentId: string }) {
    return this.batchService.findByStudntId(data.studentId);
  }

  @GrpcMethod('BatchService', 'GetcompleteBatch')
  findcompletedbatch() {
    return this.batchService.completedbatch();
  }
}
