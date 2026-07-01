import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';

@Controller('classes')
export class ClassesController {
  constructor(private readonly classService: ClassesService) {}

  @Roles([Role.HOD])
  @Post('create')
  create(@Body() data: CreateClassDto) {
    return this.classService.create(data);
  }

  @Get('all')
  findAll(@Query() query: { page: string; limit: string; classtype: string }) {
    return this.classService.findAll(query);
  }

  @Roles([Role.STUDENT])
  @Get('student/:classtype')
  findbystudent(
    @Req() req: { headers: { user: string } },
    @Param('classtype') classtype: string,
    @Query() query: { page: string; limit: string },
  ) {
    return this.classService.AllClassForStudent(query, req, classtype);
  }

  @Get('staff/:staffid')
  findbystaff(
    @Param('staffid') uuid: string,
    @Query() query: { page: string; limit: string; classtype: string },
  ) {
    return this.classService.findAll(query, uuid);
  }

  @Roles([Role.HOD])
  @Put('update/:uuid/:mode')
  update(
    @Body() data: UpdateClassDto,
    @Param() param: { uuid: string; mode: string },
  ) {
    return this.classService.update(param.uuid, data, param.mode);
  }

  @Roles([Role.STAFF, Role.HOD])
  @Put('upload-materials/:uuid/:mode')
  uploadMaterials(
    @Param() param: { uuid: string; mode: string },
    @Body() data: { notes: string[] },
  ) {
    return this.classService.updateMaterials(param.uuid, param.mode, data.notes);
  }

  @Get(':uuid/:mode')
  findOne(@Param() param: { uuid: string; mode: string }) {
    return this.classService.findOne(param.uuid, param.mode);
  }

  @Roles([Role.HOD])
  @Delete(':uuid/:mode')
  deleteone(@Param() param: { uuid: string; mode: string }) {
    return this.classService.deleteOne(param.uuid, param.mode);
  }
}
