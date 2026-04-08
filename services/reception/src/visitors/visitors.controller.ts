import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { VisitorsService } from './visitors.service';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';

@Controller('visitors')
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) { }

  @Post()
  create(@Body() createVisitorDto: CreateVisitorDto) {
    return this.visitorsService.create(createVisitorDto);
  }

  @Get()
  findAll() {
    return this.visitorsService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: Partial<UpdateVisitorDto>) {
    return this.visitorsService.update(+id, updateData);
  }

}

