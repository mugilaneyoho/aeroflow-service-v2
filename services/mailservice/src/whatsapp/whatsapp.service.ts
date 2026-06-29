// whatsapp.service.ts

import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
  private welcome_message: string = `🎉 *Welcome to {{course_name}}!*

      Hello {{student_name}},

      Congratulations! Your enrollment has been confirmed.

      📚 *Course:* {{course_name}}

      Your application login credentials are:

      📧 *Email:* {{email}}
      🔑 *Temporary Password:* {{password}}

      🌐 *Login Portal:* {{login_url}}

      We've attached the following documents for your reference:
      📄 Course Brochure
      📄 Student Handbook

      Please log in and change your password after your first sign-in.

      If you have any questions or need assistance, feel free to contact our support team.

      We wish you a successful learning journey!

      *{{organization_name}}*
  `;

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

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.data;
  }
}
