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
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';

@ApiTags('telecaller')
@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Roles([Role.TELEADMIN])
  @Get('all')
  @ApiOperation({ summary: 'get all telecallers' })
  findAll(@Query() query: { page: string; limit: string }) {
    return this.employeeService.findAll(query);
  }

  @Get('lists')
  @ApiOperation({ summary: ' get all employee for dropdown' })
  getall() {
    return this.employeeService.GetAlltele();
  }

  @Get('active-emp')
  getactive() {
    return this.employeeService.activeEmployee();
  }

  @Roles([Role.TELEADMIN])
  @Post('create')
  @ApiOperation({ summary: 'create new telecaller' })
  create(@Body() data: CreateEmployeeDto) {
    return this.employeeService.create(data);
  }

  @Roles([Role.TELEADMIN, Role.TELECALLER])
  @Get(':uuid')
  @ApiOperation({ summary: 'get telecaller by uuid' })
  findOne(@Param('uuid') uuid: string) {
    return this.employeeService.findOne(uuid);
  }

  @Roles([Role.TELEADMIN])
  @Put(':uuid')
  @ApiOperation({ summary: 'updated telecaller details' })
  update(@Param('uuid') uuid: string, @Body() data: UpdateEmployeeDto) {
    return this.employeeService.update(uuid, data);
  }

  @Roles([Role.TELEADMIN])
  @Delete(':uuid')
  @ApiOperation({ summary: 'delete telecaller by uuid' })
  softDelete(@Param('uuid') uuid: string) {
    return this.employeeService.softDelete(uuid);
  }
}
