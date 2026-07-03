import { Controller } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

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

  @MessagePattern('whatsapp')
  sendtesting(@Payload() message: any) {
    const payload = this.parsePayload(message);
    console.log('Received whatsapp message payload:', payload);
    const to = payload?.to || '9360096656';
    const textMessage = payload?.message || 'checking';
    return this.whatsappService.sendTextMessage(to, textMessage);
  }

  @MessagePattern('whatsapp-student-welcome')
  studentwelcome(@Payload() message: any) {
    const payload = this.parsePayload(message) as {
      to: string;
      student_name: string;
      course_name: string;
      student_id: string;
    };
    console.log('Received whatsapp-student-welcome message payload:', payload);
    const to = payload?.to;
    const components = {
      student_name: payload?.student_name,
      course_name: payload?.course_name,
      student_id: payload?.student_id,
    };
    return this.whatsappService.sendTemplateWithHeaderImage(
      to,
      'reg_welcome',
      components,
    );
  }
}
