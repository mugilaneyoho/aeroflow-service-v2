// whatsapp.service.ts

import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
  private readonly phoneNumberId = process.env.meta_phoneid;
  private readonly accessToken = process.env.meta_accesstoken;

  async sendTextMessage(to: string, message: string) {
    const url = `https://graph.facebook.com/v23.0/${this.phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        body: message,
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return response.data;
  }
}