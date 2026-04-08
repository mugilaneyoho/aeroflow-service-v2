import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as microservices from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateNotifyDto } from 'src/dto/CreateNotifyDto';
import { UpdateNotificationDto } from 'src/dto/UpdateNotifyDto';
import { NotificationEntity } from 'src/entity/notify';
import { Repository } from 'typeorm';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private notifyRepo: Repository<NotificationEntity>,
    @Inject('notify')
    private readonly kafkaClient: microservices.ClientKafka,
  ) {}

  async create(dto: CreateNotifyDto) {
    try {
      const notification = this.notifyRepo.create(dto);
      const res = await this.notifyRepo.save(notification);
      this.kafkaClient.emit('NotificationCreated', res);

      return {
        success: true,
        message: 'notification data created successfully',
        data: res,
      };
    } catch (error) {
      console.error(error);
    }
  }

  async findAll() {
    try {
      const res = await this.notifyRepo.find();
      return {
        success: true,
        message: 'notification data fetched',
        data: res,
      };
    } catch (error) {
      console.error(error);
    }
  }

  async findOne(uuid: string) {
    try {
      const notification = await this.notifyRepo.findOne({
        where: { uuid: uuid },
      });
      if (!notification)
        throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
      return notification;
    } catch (error) {
      console.error(error);
    }
  }

  async update(uuid: string, dto: UpdateNotificationDto) {
    try {
      const notification = await this.notifyRepo.findOne({
        where: { uuid: uuid },
      });
      if (!notification) {
        throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
      }
      Object.assign(notification, dto);
      const res = await this.notifyRepo.save(notification);
      return {
        success: true,
        message: 'notification updated successfully',
        data: res,
      };
    } catch (error) {
      console.error(error);
    }
  }

  async remove(uuid: string) {
    const res = await this.notifyRepo.findOneBy({ uuid });
    if (!res) {
      throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
    }
    await this.notifyRepo.remove(res);
    return {
      success: true,
      message: 'Notification deleted successfully',
    };
  }
}
