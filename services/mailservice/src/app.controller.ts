import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SendMailDto } from './dto/sendmail.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('mailservice.welcomestudent')
  sendWelcomeStudent(@Payload() message: SendMailDto) {
    return this.appService.sendWelcome(
      message.email,
      message.password,
      message.name,
      '',
      'studentwelcome',
    );
  }

  @MessagePattern('mailservice.welcomestaff')
  sendWelcomeStaff(@Payload() message: SendMailDto) {
    return this.appService.sendWelcome(
      message.email,
      message.password,
      message.name,
      '',
      'studentwelcome',
    );
  }

  @MessagePattern('mailservice.welcometelecaller')
  sendWelcomeTelecaller(@Payload() message: SendMailDto) {
    return this.appService.sendWelcome(
      message.email,
      message.password,
      message.name,
      '',
      'studentwelcome',
    );
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
