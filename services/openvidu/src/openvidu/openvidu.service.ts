/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/openvidu/openvidu.service.ts
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { AxiosError } from 'axios';
import https from 'https';
import { RoomlistEntity } from 'src/entities/roomlist.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OpenViduService implements OnModuleDestroy {
  private readonly logger = new Logger(OpenViduService.name);
  private readonly openViduUrl: string;
  private readonly openViduSecret: string;
  private sessions: Map<string, any> = new Map();

  constructor(
    private configService: ConfigService,
    @InjectRepository(RoomlistEntity)
    private roomlistRepo: Repository<RoomlistEntity>,
  ) {
    this.openViduUrl =
      this.configService.get<string>('OPENVIDU_URL') ||
      'http://videoconfrence:4443';
    this.openViduSecret =
      this.configService.get<string>('OPENVIDU_SECRET') || 'MY_SECRET';
    this.logger.log(
      `OpenVidu interactive service initialized with URL: ${this.openViduUrl}`,
    );
  }

  private getAuthHeader() {
    const credentials = Buffer.from(
      `OPENVIDUAPP:${this.openViduSecret}`,
    ).toString('base64');
    return {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  }

  private getHttpsAgent() {
    // For self-signed certificates in development
    return new https.Agent({
      rejectUnauthorized: false, // Keep this for self-signed certs
      requestCert: false,
    });
  }

  private async axiosRequest(
    method: 'get' | 'post' | 'delete',
    url: string,
    data?: any,
  ) {
    try {
      const response = await axios({
        method,
        url,
        headers: this.getAuthHeader(),
        data,
        httpsAgent: this.getHttpsAgent(),
        timeout: 10000, // 10 seconds timeout for interactive sessions
      });
      return response.data;
    } catch (error: any) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const responseData = axiosError.response?.data;

      this.logger.error(
        `Axios ${method.toUpperCase()} request to ${url} failed`,
      );
      this.logger.error(`Error message: ${axiosError.message}`);
      if (responseData) {
        this.logger.error(`OpenVidu response: ${JSON.stringify(responseData)}`);
      } else {
        this.logger.error('No response received from OpenVidu server', axiosError.message);
      }

      throw axiosError;
    }
  }

  async getOrCreateSession(sessionId: string): Promise<any> {
    if (this.sessions.has(sessionId)) {
      this.logger.debug(`Using cached interactive session: ${sessionId}`);
      return this.sessions.get(sessionId);
    }

    try {
      const session = await this.axiosRequest(
        'get',
        `${this.openViduUrl}/openvidu/api/sessions/${sessionId}`,
      );
      this.logger.log(`Interactive session ${sessionId} found on server`);
      this.sessions.set(sessionId, session);
      return session;
    } catch (error: any) {
      // If session not found, create it with ROUTED media mode for better scalability
      if (error.response?.status === 404) {
        try {
          const newSession = await this.axiosRequest(
            'post',
            `${this.openViduUrl}/openvidu/api/sessions`,
            {
              customSessionId: sessionId,
              mediaMode: 'ROUTED', // ROUTED mode is better for interactive sessions
              recordingMode: 'MANUAL',
              defaultOutputMode: 'COMPOSED',
              defaultRecordingLayout: 'BEST_FIT',
            },
          );
          this.logger.log(`Created new interactive session: ${sessionId}`);
          this.sessions.set(sessionId, newSession);
          return newSession;
        } catch (createError) {
          this.logger.error(`Failed to create session: ${createError.message}`);
          console.log(createError.message,"create error")
          throw new HttpException(
            'Failed to create interactive session',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }

      console.log(error.message,"get error")

      throw new HttpException(
        'Failed to get interactive session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async generateToken(
    classId: string,
    participantName: string,
    role: string,
  ): Promise<{ token: string; sessionId: string; participantName: string }> {
    try {
      console.log(classId,role,participantName,"checmk input")
      let sessionId: string;
      const exist = await this.roomlistRepo.findOne({
        where: {
          classId,
        },
      });

      if (!exist) {
        if (role === 'STAFF') {
          sessionId = this.generateRoomId();
          const room = this.roomlistRepo.create({
            roomName: sessionId,
            staffId: '',
            classId,
            isStarted: true,
          });
          await this.roomlistRepo.save(room);
          await this.getOrCreateSession(sessionId);
        } else {
          return { token: '', sessionId: '', participantName: '' };
        }
      } else {
        if (exist.isEnded) {
          return { token: '', sessionId: '', participantName: '' };
        }

        if (!exist.isStarted && role === 'STAFF') {
          sessionId = this.generateRoomId();
          const room = this.roomlistRepo.create({
            roomName: sessionId,
            staffId: '',
            classId,
            isStarted: true,
          });
          await this.roomlistRepo.save(room);
          await this.getOrCreateSession(sessionId);
        } else if (!exist.isStarted && role === 'STUDENT') {
          return { token: '', sessionId: '', participantName: '' };
        } else {
          sessionId = exist.roomName;
          await this.getOrCreateSession(sessionId);
        }
      }

      const tokenOptions = {
        role: 'PUBLISHER', // All participants can publish in interactive mode
        data: JSON.stringify({
          name: participantName,
          role: role, // Keep original role for UI purposes
          sessionId,
          timestamp: Date.now(),
          type: 'interactive',
          canPublish: true, // Everyone can publish
          canSubscribe: true, // Everyone can subscribe
        }),
      };

      console.log(tokenOptions,"check tokaen")

      const tokenResponse = await this.axiosRequest(
        'post',
        `${this.openViduUrl}/openvidu/api/sessions/${sessionId}/connection`,
        tokenOptions,
      );

      console.log(tokenResponse,"checking respoes")

      const token = tokenResponse.token;
      console.log(token, 'denet tokec');
      this.logger.log(
        `Interactive token generated for ${participantName} (${role}) in session ${sessionId} - Everyone can publish`,
      );

      return { token, sessionId, participantName };
    } catch (error: any) {
      console.log(error)
      this.logger.error(`Failed to generate token: ${error}`);
      console.log(error);
      throw new HttpException(
        'Failed to generate token for interactive session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async closeSession(sessionId: string): Promise<void> {
    try {
      await this.axiosRequest(
        'delete',
        `${this.openViduUrl}/openvidu/api/sessions/${sessionId}`,
      );
      this.sessions.delete(sessionId);
      this.logger.log(`Interactive session ${sessionId} closed successfully`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        this.logger.warn(`Interactive session ${sessionId} not found`);
        this.sessions.delete(sessionId);
      } else {
        this.logger.error(`Failed to close session: ${error.message}`);
        throw new HttpException(
          'Failed to close interactive session',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async getSessionInfo(sessionId: string): Promise<any> {
    try {
      return await this.axiosRequest(
        'get',
        `${this.openViduUrl}/openvidu/api/sessions/${sessionId}`,
      );
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  async forceUnpublish(sessionId: string, connectionId: string): Promise<void> {
    try {
      await this.axiosRequest(
        'delete',
        `${this.openViduUrl}/openvidu/api/sessions/${sessionId}/connection/${connectionId}/publisher`,
      );
      this.logger.log(`Forced unpublish for connection ${connectionId}`);
    } catch (error: any) {
      this.logger.error(`Failed to force unpublish: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    this.logger.log('Cleaning up all interactive sessions...');
    await Promise.all(
      Array.from(this.sessions.keys()).map((id) => this.closeSession(id)),
    );
  }

  generateRoomId(): string {
    return (
      // Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8)
      Date.now().toString(36)
    );
  }
}
