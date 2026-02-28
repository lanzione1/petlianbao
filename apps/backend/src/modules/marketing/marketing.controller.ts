import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MarketingService } from './marketing.service';
import { IsString, IsOptional, IsArray, IsObject, IsUUID } from 'class-validator';

class CreateCampaignDto {
  @IsString()
  type: 'poster' | 'coupon' | 'birthday' | 'broadcast';

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsObject()
  content?: Record<string, any>;

  @IsOptional()
  @IsArray()
  targetTags?: string[];
}

class GeneratePosterDto {
  @IsString()
  templateId: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

class SendCouponDto {
  @IsArray()
  @IsUUID('4', { each: true })
  customerIds: string[];

  @IsObject()
  coupon: {
    type: 'discount' | 'cash';
    value: number;
    minAmount?: number;
    expiredDays: number;
  };
}

@Controller('marketing')
@UseGuards(AuthGuard('jwt'))
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('templates')
  getTemplates(@Request() req, @Query('type') type: string) {
    return this.marketingService.getTemplates(req.user.merchantId, type);
  }

  @Post()
  createCampaign(@Request() req, @Body() createCampaignDto: CreateCampaignDto) {
    return this.marketingService.createCampaign(req.user.merchantId, createCampaignDto);
  }

  @Get('campaigns')
  findAll(@Request() req) {
    return this.marketingService.findAll(req.user.merchantId);
  }

  @Get('campaigns/:id')
  getCampaign(@Request() req, @Param('id') id: string) {
    return this.marketingService.getCampaign(req.user.merchantId, id);
  }

  @Post('poster')
  generatePoster(@Request() req, @Body() dto: GeneratePosterDto) {
    return this.marketingService.generatePoster(req.user.merchantId, dto.templateId, dto.data);
  }

  @Post('coupon')
  sendCoupon(@Request() req, @Body() dto: SendCouponDto) {
    return this.marketingService.sendCoupon(req.user.merchantId, dto.customerIds, dto.coupon);
  }

  @Post('broadcast')
  sendBroadcast(
    @Request() req,
    @Body('customerIds') customerIds: string[],
    @Body('message') message: string,
  ) {
    return this.marketingService.sendBroadcast(req.user.merchantId, customerIds, message);
  }

  @Get('auto-rules')
  getAutoMarketingRules(@Request() req) {
    return this.marketingService.getAutoMarketingRules(req.user.merchantId);
  }

  @Post('auto-rules')
  updateAutoMarketingRules(@Request() req, @Body() rules: any) {
    return this.marketingService.updateAutoMarketingRules(req.user.merchantId, rules);
  }
}
