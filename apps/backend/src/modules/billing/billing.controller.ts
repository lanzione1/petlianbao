import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BillingService } from './billing.service';
import {
  IsUUID,
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

class CheckoutItemDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;
}

class CheckoutDto {
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @IsNumber()
  totalAmount: number;

  @IsEnum(['wechat', 'alipay', 'cash', 'member'])
  paymentMethod: 'wechat' | 'alipay' | 'cash' | 'member';
}

@Controller('billing')
@UseGuards(AuthGuard('jwt'))
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout')
  checkout(@Request() req, @Body() checkoutDto: CheckoutDto) {
    return this.billingService.checkout(req.user.merchantId, checkoutDto);
  }

  @Get('today')
  findToday(@Request() req) {
    return this.billingService.findToday(req.user.merchantId);
  }

  @Get('daily-summary')
  getDailySummary(@Request() req) {
    return this.billingService.getDailySummary(req.user.merchantId);
  }

  @Post('close-day')
  closeDay(@Request() req, @Body('cashAmount') cashAmount: number) {
    return this.billingService.closeDay(req.user.merchantId, cashAmount);
  }
}
