import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Controller('branch')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post('create')
  create(data: CreateBranchDto) {
    return this.branchService.create(data);
  }

  @Get(':uuid')
  findAll(
    @Param('uuid') uuid: string,
    @Query() query: { page: string; limit: string },
  ) {
    return this.branchService.findAllbyInstitute(uuid, query);
  }

  @Put(':uuid')
  updateOne(@Param('uuid') uuid: string, @Body() data: UpdateBranchDto) {
    return this.branchService.updateOne(data, uuid);
  }
}
