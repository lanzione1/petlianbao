import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MerchantService } from './merchant.service';

@Controller('merchants')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Post('register')
  register(@Body() dto: {
    openid: string;
    shopName: string;
    ownerName: string;
    phone: string;
    address?: string;
    detailedAddress?: string;
  }) {
    return this.merchantService.register(dto);
  }

  @Get('wechat/login')
  wechatLogin(@Query('code') code: string) {
    return this.merchantService.getWechatOpenid(code);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMe(@Request() req) {
    return this.merchantService.findOne(req.user.merchantId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('me')
  updateMe(@Request() req, @Body() data: any) {
    return this.merchantService.update(req.user.merchantId, data);
  }
}
