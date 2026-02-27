import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WechatService } from './wechat.service';
import { WechatLoginDto, BindPhoneDto } from './wechat.dto';
import { H5CustomerGuard } from './guards/h5-customer.guard';

@Controller('h5/auth')
export class H5AuthController {
  constructor(private wechatService: WechatService) {}

  @Get('wechat/url')
  getWechatAuthUrl(
    @Query('merchantId') merchantId: string,
    @Query('redirectUri') redirectUri: string,
  ) {
    console.log('生成授权URL:', { merchantId, redirectUri, appId: this.wechatService.appId });
    const state = Buffer.from(JSON.stringify({ merchantId })).toString('base64');
    const url = this.wechatService.getAuthUrl(redirectUri, state);
    console.log('生成的URL:', url);
    return { url };
  }

  @Get('wechat/callback')
  async wechatCallback(
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    let merchantId: string;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      merchantId = stateData.merchantId;
    } catch {
      merchantId = state;
    }

    const { customer, token } = await this.wechatService.loginOrRegister(
      merchantId,
      code,
    );

    // 检查是否是新客户（根据创建时间判断，5分钟内为新客户）
    const isNewCustomer = (new Date().getTime() - new Date(customer.createdAt).getTime()) < 5 * 60 * 1000;

    return {
      success: true,
      data: {
        customer: {
          id: customer.id,
          nickname: customer.nickname,
          avatar: customer.avatar,
          phone: customer.phone,
          merchantId: merchantId,
          customerName: customer.nickname || '微信用户',
          isNewCustomer: isNewCustomer,
        },
        token,
      },
    };
  }

  @Post('dev/login')
  async devLogin(@Body() body: { merchantId: string; openid: string }) {
    const { customer, token } = await this.wechatService.devLogin(
      body.merchantId,
      body.openid,
    );

    // 检查是否是新客户
    const isNewCustomer = (new Date().getTime() - new Date(customer.createdAt).getTime()) < 5 * 60 * 1000;

    return {
      success: true,
      data: {
        customer: {
          id: customer.id,
          nickname: customer.nickname,
          avatar: customer.avatar,
          phone: customer.phone,
          merchantId: body.merchantId,
          customerName: customer.nickname || '测试用户',
          isNewCustomer: isNewCustomer,
        },
        token,
      },
    };
  }

  @Post('phone/bind')
  @UseGuards(H5CustomerGuard)
  async bindPhone(@Request() req, @Body() dto: BindPhoneDto) {
    const customer = await this.wechatService.bindPhone(
      req.user.customerId,
      dto.phone,
    );
    return {
      success: true,
      data: {
        id: customer.id,
        phone: customer.phone,
      },
    };
  }

  @Get('me')
  @UseGuards(H5CustomerGuard)
  async getCurrentUser(@Request() req) {
    return {
      success: true,
      data: {
        id: req.user.customer.id,
        nickname: req.user.customer.nickname,
        avatar: req.user.customer.avatar,
        phone: req.user.customer.phone,
        merchantId: req.user.merchantId,
      },
    };
  }
}