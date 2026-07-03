// whatsapp.service.ts

import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
  private get phoneNumberId() {
    return process.env.meta_phoneid;
  }
  private get accessToken() {
    return process.env.meta_accesstoken;
  }

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

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.data;
  }

  async sendTemplateWithHeaderImage(
    phone: string,
    template: string,
    components: object,
  ) {
    try {
      const url = `https://graph.facebook.com/v23.0/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: template,
          language: {
            code: 'en',
          },
          components: [
            {
              type: 'header',
              parameters: [
                {
                  type: 'image',
                  image: {
                    link: 'https://www.patroninternational.org/assets/img/logo.png',
                  },
                },
              ],
            },
            {
              type: 'body',
              parameters: Object.entries(components).map(([key, value]) => ({
                type: 'text',
                parameter_name: key,
                text: value as string,
              })),
            },
          ],
        },
      };

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return response.data;
    } catch (error) {
      console.log(error.response.data);
    }
  }
}
