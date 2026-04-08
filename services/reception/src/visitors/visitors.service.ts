import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visitor } from './entities/visitor.entity';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';

@Injectable()
export class VisitorsService {
  constructor(
    @InjectRepository(Visitor)
    private visitorsRepository: Repository<Visitor>,
  ) { }

  async create(createVisitorDto: CreateVisitorDto) {
    const newVisitor = this.visitorsRepository.create({ ...createVisitorDto });
    return await this.visitorsRepository.save(newVisitor);
  }

  async findAll() {
    return await this.visitorsRepository.find();
  }

  async update(id: number, updateData: Partial<UpdateVisitorDto>) {
    await this.visitorsRepository.update(id, updateData);
    return this.visitorsRepository.findOne({ where: { id } });
  }
}