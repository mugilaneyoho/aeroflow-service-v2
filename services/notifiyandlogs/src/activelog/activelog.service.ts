import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActivityLogEntity } from '../entity/activitylog';
import { Repository } from 'typeorm';
import * as microservices from '@nestjs/microservices';
import { create } from 'domain';
import { async } from 'rxjs';

@Injectable()
export class ActivelogService {
  constructor(
    @InjectRepository(ActivityLogEntity)
    private logRepo: Repository<ActivityLogEntity>,
  ) {}
  @microservices.EventPattern('activelog.created')
  async handleActivityCreated(@microservices.Payload() message: any) {
    console.log('activity received');
    console.log(message);
    console.log('Status:', message.status);
    console.log('Reference ID:', message.referenceId);
  }

  async create(data: Partial<ActivityLogEntity>) {
    try {
      const res = this.logRepo.create(data);
      return await this.logRepo.save(res);
    } catch (error) {
      console.error(error);
    }
  }

  async findAll() {
    try {
      return await this.logRepo.find();
    } catch (error) {
      console.error(error);
    }
  }

  async findOne(uuid: string) {
    const data = await this.logRepo.findOneBy({ uuid });
    if (!data) {
      throw new HttpException('Activity log not found', HttpStatus.NOT_FOUND);
    }
    return data;
  }

  async update(uuid: string, data: Partial<ActivityLogEntity>) {
    const res = await this.logRepo.findOneBy({ uuid });
    if (!res) {
      throw new HttpException('Activity log not found', HttpStatus.NOT_FOUND);
    }
    Object.assign(res, data);
    return await this.logRepo.save(res);
  }

  async remove(uuid: string) {
    const res = await this.logRepo.findOneBy({ uuid });
    if (!res) {
      throw new HttpException('Activity log not found', HttpStatus.NOT_FOUND);
    }
    await this.logRepo.remove(res);
    return {
      success: true,
      message: 'Activity log deleted successfully',
    };
  }
}
