import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { Meeting } from './entities/meeting.entity';

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  create(@Body() createMeetingDto: CreateMeetingDto) {
    return this.meetingsService.create(createMeetingDto);
  }

  @Get('masterdash')
  masterdash() {
    return this.meetingsService.MeetingCount();
  }

  @Get(':type')
  findAll(
    @Param('type') type: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.meetingsService.findAll(type, page ? +page : undefined, limit ? +limit : undefined);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: Partial<Meeting>) {
    return this.meetingsService.update(+id, updateData);
  }
}
