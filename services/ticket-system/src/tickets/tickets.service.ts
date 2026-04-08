import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './ticket.entity';
import { CreateTicketDto } from './dto/create-ticket-dto';
import { UpdateTicketDto } from './dto/update-ticket-dto';
import { roles } from './auth/roles.enum';

@Injectable()
export class TicketsService {
    constructor(
        @InjectRepository(Ticket)
        private ticketsRepository: Repository<Ticket>,
    ) { }

    async create(createTicketDto: CreateTicketDto, user: any) {
        const { role, userId } = user;

        if (role === roles.STAFF || role === roles.STUDENT) {
            const allowed = [roles.HOD, roles.MASTER];
            if (!allowed.includes(createTicketDto.assignedToRole)) {
                throw new BadRequestException(`${role} can only send tickets to HOD or ADMIN`);
            }
        }

        if (role === roles.TELECALLER) {
            const allowed = [roles.TELEADMIN, roles.MASTER];
            if (!allowed.includes(createTicketDto.assignedToRole)) {
                throw new BadRequestException('Telecallers can only send to TELEADMIN or MASTER');
            }
        }

        const newTicket = this.ticketsRepository.create({
            ...createTicketDto,
            creator: { id: userId }
        });

        return this.ticketsRepository.save(newTicket);
    }


    async findAll(user: any) {
        const { role, userId } = user;

        if (role === roles.MASTER || role === roles.SUBADMIN) {
            return this.ticketsRepository.find({ relations: ['creator'] });
        }

        if (role === roles.HOD) {
            return this.ticketsRepository.find({
                where: { assignedToRole: roles.HOD },
                relations: ['creator']
            });
        }

        if (role === roles.TELEADMIN) {
            return this.ticketsRepository.find({
                where: { assignedToRole: roles.TELEADMIN },
                relations: ['creator']
            });
        }

        return this.ticketsRepository.find({
            where: { creator: { id: userId } },
            relations: ['creator']
        });
    }

    async findOne(id: number) {
        const ticket = await this.ticketsRepository.findOneBy({ id });
        if (!ticket) {
            throw new NotFoundException(`Ticket with ID ${id} not found`);
        }
        return ticket;
    }

    async update(id: number, updateTicketDto: UpdateTicketDto) {
        const result = await this.ticketsRepository.update(id, updateTicketDto);

        if (result.affected === 0) {
            throw new NotFoundException(`Ticket with ID ${id} not found`);
        }

        return this.findOne(id);
    }

    async remove(id: number) {
        const result = await this.ticketsRepository.delete(id);

        if (result.affected === 0) {
            throw new NotFoundException(`Ticket with ID ${id} not found`);
        }

        return { deleted: true };
    }
}
