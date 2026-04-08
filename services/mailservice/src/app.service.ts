import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private mailService: MailerService) {}

  async sendWelcome(
    email: string,
    password: string,
    name: string,
    siteUrl: string,
    template: string,
  ) {
    await this.mailService.sendMail({
      to: email,
      subject: 'Welcome to Our App',
      template,
      context: {
        email,
        password,
        name,
        siteUrl,
      },
    });
  }

  getHello(): string {
    return 'Hello World!';
  }
}
