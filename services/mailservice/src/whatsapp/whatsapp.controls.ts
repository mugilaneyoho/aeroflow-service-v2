import { Controller } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @MessagePattern('whatsapp')
  sendtesting() {
    return this.whatsappService.sendTextMessage('9360096656', 'checking');
  }
}
