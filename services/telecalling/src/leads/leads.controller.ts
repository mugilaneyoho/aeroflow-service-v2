import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { LeadsUpdateDto } from './dto/leads-update.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeadStatus } from 'src/entities/leads.entity';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';
import multer from 'multer';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Roles([Role.TELEADMIN])
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
    }),
  )
  @ApiOperation({ summary: 'csv file upload url for leads' })
  uploadcsv(@UploadedFile() file: Express.Multer.File) {
    console.log(file,"checking");
    return this.leadsService.uploadLeads(file);
  }

  @Roles([Role.TELEADMIN])
  @Post('assigned')
  @ApiOperation({ summary: 'leads assign by telecallers' })
  assigned(@Body('userid') userid: any[], @Body('count') count: number) {
    return this.leadsService.assignLeads(userid, count);
  }

  @Get('temp-recent-admit')
  tempadmit() {
    return this.leadsService.recentAdmit();
  }

  @Put('update/:uuid')
  @ApiOperation({ summary: 'leads status and details are updated' })
  update(@Body() data: LeadsUpdateDto, @Param('uuid') uuid: string) {
    return this.leadsService.update(data, uuid);
  }

  @Roles([Role.TELEADMIN])
  @Get('all')
  @ApiOperation({ summary: 'get all leads' })
  findAll(@Query() query: { page: string; limit: string }) {
    return this.leadsService.findAll(query);
  }

  @Get('byemployee/:uuid')
  @ApiOperation({ summary: 'get leads by employee uuid' })
  getbyemployee(
    @Param('uuid') uuid: string,
    @Query() query: { page: string; limit: string; status: LeadStatus },
  ) {
    return this.leadsService.findByEmployee(uuid, query);
  }

  @Get('bystatus/:uuid')
  @ApiOperation({ summary: 'get leads by employee uuid' })
  getbystatus(@Param('uuid') uuid: string) {
    return this.leadsService.findByStatus(uuid);
  }

  @Get('completed/:uuid')
  @ApiOperation({ summary: 'get leads by employee uuid' })
  getcomplete(
    @Param('uuid') uuid: string,
    @Query() query: { page: string; limit: string; status: LeadStatus },
  ) {
    return this.leadsService.findCompleted(uuid);
  }
}
