import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './ticket.entity';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/role/role.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket])],
  providers: [
    TicketsService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  controllers: [TicketsController],
})
export class TicketsModule {}
