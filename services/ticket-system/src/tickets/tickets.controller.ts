import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket-dto';
import { UpdateTicketDto } from './dto/update-ticket-dto';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';
import { roles } from './auth/roles.enum';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(
    @Body() createTicketDto: CreateTicketDto,
    @Req() req: { headers: { user: string } },
  ) {
    const user: { role: roles; profile_id: string; uuid: string } = JSON.parse(
      req.headers.user,
    ) as {
      role: roles;
      profile_id: string;
      uuid: string;
    };
    return this.ticketsService.create(createTicketDto, user);
  }

  @Get()
  findAll(@Req() req: { headers: { user: string } }) {
    const user: { role: roles; profile_id: string } = JSON.parse(
      req.headers.user,
    ) as {
      role: roles;
      profile_id: string;
    };
    return this.ticketsService.findAll(user);
  }

  @Patch(':id')
  @Roles([Role.HOD, Role.TELEADMIN])
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.remove(id);
  }
}
