/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Query, Header } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtService } from '@nestjs/jwt';
import {
  getResetPasswordHtml,
  getResetErrorHtml,
} from './utils/reset_password_template';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('reset-page')
  @Header('Content-Type', 'text/html')
  getResetPage(@Query('token') token: string) {
    if (!token) {
      return getResetErrorHtml('No password reset token was provided.');
    }
    try {
      const decoded: any = this.jwtService.verify(token);

      let apiEndpoint = '/auth';
      if (decoded.type === 'student') {
        apiEndpoint += '/students/reset-pass';
      } else if (decoded.type === 'staff') {
        apiEndpoint += '/staff/reset-pass';
      } else if (decoded.type === 'telecaller') {
        apiEndpoint += '/telecalling/reset-pass';
      } else if (decoded.type === 'admin') {
        apiEndpoint += '/admins/reset-pass';
      } else {
        return getResetErrorHtml(
          'This reset link is for an invalid user type.',
        );
      }

      return getResetPasswordHtml(token, apiEndpoint);
    } catch (err) {
      return getResetErrorHtml(
        'The password reset link is invalid or has expired.',
      );
    }
  }
}
