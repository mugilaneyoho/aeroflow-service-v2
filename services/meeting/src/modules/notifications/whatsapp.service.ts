import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendMeetingConfirmationWhatsApp(
    toPhone: string,
    visitorName: string,
    meetingDate: string,
    meetingTime: string,
    meetingPurpose: string,
  ): Promise<{ success: boolean; response?: any; error?: string }> {
    const token = this.configService.get<string>('WHATSAPP_TOKEN');
    const phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');

    const formattedPhone = toPhone.replace(/[^0-9]/g, '');

    // Formatted WhatsApp message body matching template prompt specification
    const messageText = `*Meeting Confirmed*\n\nHello ${visitorName},\n\nYour meeting request has been approved.\n\nDate: ${meetingDate}\nTime: ${meetingTime}\nPurpose: ${meetingPurpose}\n\nThank you,\nReception Team\n\n_Please arrive 10 minutes before the scheduled time._`;

    if (!token || !phoneNumberId) {
      this.logger.warn(
        `[Mock WhatsApp Dispatched to ${toPhone}]:\n${messageText}\n(Meta WhatsApp Cloud API token/phone ID not provided, simulated successfully)`,
      );
      return {
        success: true,
        response: { status: 'MOCK_SENT', recipient: formattedPhone, message: messageText },
      };
    }

    try {
      const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: { preview_url: false, body: messageText },
      };

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`WhatsApp message sent successfully to ${toPhone}`);
      return { success: true, response: response.data };
    } catch (error) {
      const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
      this.logger.error(`Failed to send WhatsApp message to ${toPhone}: ${errorDetails}`);
      return { success: false, error: errorDetails };
    }
  }
}
