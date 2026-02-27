import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './campaign.entity';
import { Customer } from '../customer/customer.entity';

@Injectable()
export class MarketingService {
  constructor(
    @InjectRepository(Campaign)
    private campaignsRepository: Repository<Campaign>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  async getTemplates(merchantId: string, type: string) {
    const templates = {
      poster: [
        { id: 'spring', name: '春节促销', elements: ['title', 'subtitle', 'qrcode'] },
        { id: 'summer', name: '夏日清凉', elements: ['title', 'subtitle', 'qrcode'] },
        { id: 'birthday', name: '生日祝福', elements: ['title', 'petName', 'qrcode'] },
      ],
      coupon: [
        { id: 'discount10', name: '9折券', type: 'discount', value: 10 },
        { id: 'cash20', name: '20元立减', type: 'cash', value: 20 },
        { id: 'free_wash', name: '免费洗澡', type: 'service', value: 0 },
      ],
    };
    return templates[type] || [];
  }

  async createCampaign(merchantId: string, data: Partial<Campaign>): Promise<Campaign> {
    const campaign = this.campaignsRepository.create({
      ...data,
      merchantId,
    });
    return this.campaignsRepository.save(campaign);
  }

  async findAll(merchantId: string): Promise<Campaign[]> {
    return this.campaignsRepository.find({
      where: { merchantId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async getCampaign(merchantId: string, id: string): Promise<Campaign> {
    return this.campaignsRepository.findOne({
      where: { id, merchantId },
    });
  }

  async generatePoster(merchantId: string, templateId: string, data: Record<string, any>) {
    return {
      imageUrl: `https://cos.petlianbao.com/posters/${templateId}.png`,
      data,
    };
  }

  async sendCoupon(merchantId: string, customerIds: string[], coupon: any) {
    const customers = await this.customersRepository.find({
      where: customerIds.map(id => ({ id, merchantId })) as any,
    });

    const sentCount = customers.length;

    return {
      total: customerIds.length,
      sent: sentCount,
      failed: customerIds.length - sentCount,
    };
  }

  async sendBroadcast(merchantId: string, customerIds: string[], message: string) {
    return {
      total: customerIds.length,
      sent: customerIds.length,
    };
  }

  async getAutoMarketingRules(merchantId: string) {
    return {
      inactiveReminder: true,
      birthdayGreeting: true,
      serviceFollowUp: true,
    };
  }

  async updateAutoMarketingRules(merchantId: string, rules: any) {
    return rules;
  }
}
