import * as Sentry from '@sentry/nestjs';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { RoomlistEntity } from 'src/entities/roomlist.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ZoomService {
  constructor(
    @InjectRepository(RoomlistEntity)
    private roomList: Repository<RoomlistEntity>,
  ) {}

  private async getAccessToken() {
    const credentials = Buffer.from(
      `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`,
    ).toString('base64');

    const response: { data: { access_token: string } } = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACC_ID}`,
      {},
      {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      },
    );

    return response.data.access_token;
  }

  async createMeeting() {
    const token = await this.getAccessToken();

    const response: {
      data: {
        id: string;
        join_url: string;
        start_url: string;
        password: string;
      };
    } = await axios.post(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        topic: 'online class',
        type: 2,
        duration: 60,
        timezone: 'Asia/Kolkata',
        agenda: 'Interview',
        settings: {
          join_before_host: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  }

  async join(classId: string, role: string) {
    try {
      const exist = await this.roomList.findOne({
        where: {
          classId,
        },
      });

      if (exist) {
        if (role === 'STAFF') {
          return {
            startURL: exist.startURL,
            meetingId: exist.meetingID,
            password: exist.password,
            role: 1,
          };
        } else {
          return {
            startURL: exist.startURL,
            meetingId: exist.meetingID,
            password: exist.password,
            role: 0,
          };
        }
      }

      const meet = await this.createMeeting();

      const room = this.roomList.create({
        classId,
        staffId: '',
        startURL: meet.start_url,
        joinURL: meet.join_url,
        meetingID: meet.id,
        password: meet.password,
      });

      await this.roomList.save(room);

      if (role === 'STAFF') {
        return {
          startURL: room.startURL,
          meetingId: room.meetingID,
          password: room.password,
          role: 1,
        };
      } else {
        return {
          joinURL: room.joinURL,
          meetingId: room.meetingID,
          password: room.password,
          role: 0,
        };
      }
    } catch (error) {
      Sentry.captureException(error);
      console.log(error);
      throw new InternalServerErrorException();
    }
  }
}
