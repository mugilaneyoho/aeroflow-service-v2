import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SendMailDto } from './dto/sendmail.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  private parsePayload(message: any): any {
    let payload = message;
    if (typeof message === 'string') {
      try {
        payload = JSON.parse(message);
      } catch (e) {
        console.error('Failed to parse string payload:', e);
      }
    } else if (Buffer.isBuffer(message)) {
      try {
        payload = JSON.parse(message.toString());
      } catch (e) {
        console.error('Failed to parse Buffer payload:', e);
      }
    }
    // NestJS Microservices Kafka transporter sometimes wraps message value in a 'value' property
    if (payload && typeof payload === 'object' && 'value' in payload) {
      payload = payload.value;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch (e) {
          console.error('Failed to parse wrapped value payload:', e);
        }
      }
    }
    return payload;
  }

  @MessagePattern('mailservice.welcomestudent')
  sendWelcomeStudent(@Payload() message: any) {
    const payload = this.parsePayload(message);
    console.log('Received mailservice.welcomestudent message payload:', payload);
    return this.appService.sendWelcome(
      payload?.email,
      payload?.password,
      payload?.name || '',
      '',
      'studentwelcome',
    );
  }

  @MessagePattern('mailservice.welcomestaff')
  sendWelcomeStaff(@Payload() message: any) {
    const payload = this.parsePayload(message);
    console.log('Received mailservice.welcomestaff message payload:', payload);
    return this.appService.sendWelcome(
      payload?.email,
      payload?.password,
      payload?.name || '',
      '',
      'studentwelcome',
    );
  }

  @MessagePattern('mailservice.welcometelecaller')
  sendWelcomeTelecaller(@Payload() message: any) {
    const payload = this.parsePayload(message);
    console.log('Received mailservice.welcometelecaller message payload:', payload);
    return this.appService.sendWelcome(
      payload?.email,
      payload?.password,
      payload?.name || '',
      '',
      'studentwelcome',
    );
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
