import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER', ''),
        pass: this.configService.get<string>('SMTP_PASS', ''),
      },
    });
  }

  async sendMeetingConfirmation(
    toEmail: string,
    visitorName: string,
    meetingDate: string,
    meetingTime: string,
    meetingPurpose: string,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Meeting Request Approved</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); padding: 32px 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">AEROFLOW ENTERPRISE</h1>
            <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px;">Smart Meeting & Reception Management</p>
          </td>
        </tr>

        <!-- Badge & Title -->
        <tr>
          <td style="padding: 32px 32px 16px 32px; text-align: center;">
            <span style="display: inline-block; background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; border-radius: 20px; padding: 6px 18px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
              ✓ Meeting Confirmed
            </span>
            <h2 style="color: #0f172a; margin: 20px 0 8px 0; font-size: 22px;">Meeting Request Approved</h2>
            <p style="color: #64748b; margin: 0; font-size: 15px; line-height: 1.5;">Hello <strong>${visitorName}</strong>, your meeting request has been approved by the Master Admin.</p>
          </td>
        </tr>

        <!-- Details Card -->
        <tr>
          <td style="padding: 0 32px 24px 32px;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; border-left: 4px solid #2563EB;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-size: 14px; width: 35%;">📅 Date:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 600; font-size: 14px;">${meetingDate}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-size: 14px;">⏰ Time:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 600; font-size: 14px;">${meetingTime}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-size: 14px;">🎯 Purpose:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 600; font-size: 14px;">${meetingPurpose}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b; font-size: 14px;">📍 Location:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 600; font-size: 14px;">Main Reception, Aeroflow HQ Tower</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Arrival Note -->
        <tr>
          <td style="padding: 0 32px 32px 32px;">
            <div style="background-color: #eff6ff; border-radius: 8px; padding: 14px; text-align: center; color: #1e40af; font-size: 13px;">
              💡 <strong>Arrival Tip:</strong> Please arrive 10 minutes prior to your scheduled slot for quick check-in verification at the reception.
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">© 2026 Aeroflow Reception System. All rights reserved.</p>
            <p style="margin: 4px 0 0 0;">Need assistance? Contact support@aeroflow.com</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    try {
      const smtpUser = this.configService.get<string>('SMTP_USER');
      if (!smtpUser) {
        this.logger.warn(`[Mock Email Sent to ${toEmail}] SMTP not configured. Simulating success.`);
        return { success: true, messageId: `mock-email-id-${Date.now()}` };
      }

      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM', '"Aeroflow Reception" <noreply@aeroflow.com>'),
        to: toEmail,
        subject: 'Meeting Request Approved - Aeroflow Systems',
        html: htmlContent,
      });

      this.logger.log(`Email dispatched successfully to ${toEmail}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Failed to send email to ${toEmail}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
