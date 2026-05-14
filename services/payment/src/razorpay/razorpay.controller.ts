import { Body, Controller, Post, Req } from '@nestjs/common';
import { RazorpayService } from './razorpay.service';
import { Roles } from 'src/role/role.decorator';
import { Role } from 'src/role/role.enum';

@Controller('razorpay')
export class RazorpayController {
  constructor(private readonly razorService: RazorpayService) {}

  @Post('create-order')
  @Roles([Role.STUDENT])
  async create(
    @Req() req: { headers: { user: string } },
    @Body() body: { amount: number },
  ) {
    const user: { profile_id: string } = JSON.parse(req.headers.user) as {
      profile_id: string;
    };
    return this.razorService.createPayment(body.amount, user.profile_id);
  }

  @Post('verify')
  async verify(@Body() body: any) {
    const { success, data } = await this.razorService.verifyPayment(
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature,
    );

    return {
      success,
      data,
    };
  }
}
