import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from './merchant.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MerchantService {
  constructor(
    @InjectRepository(Merchant)
    private merchantsRepository: Repository<Merchant>,
    private configService: ConfigService,
  ) {}

  async register(data: {
    openid: string;
    shopName: string;
    ownerName: string;
    phone: string;
    address?: string;
    detailedAddress?: string;
  }) {
    const existing = await this.merchantsRepository.findOne({
      where: { openid: data.openid },
    });

    if (existing) {
      // 更新现有商家的信息
      existing.shopName = data.shopName;
      existing.ownerName = data.ownerName;
      existing.phone = data.phone;
      if (data.address) existing.address = data.address;
      if (data.detailedAddress) existing.detailedAddress = data.detailedAddress;
      return this.merchantsRepository.save(existing);
    }

    const merchant = this.merchantsRepository.create({
      openid: data.openid,
      shopName: data.shopName,
      ownerName: data.ownerName,
      phone: data.phone,
      address: data.address || '',
      detailedAddress: data.detailedAddress || '',
      planType: 'free',
      status: 'active',
    });

    return this.merchantsRepository.save(merchant);
  }

  async getWechatOpenid(code: string) {
    const appId = this.configService.get('wechat.appId');
    const appSecret = this.configService.get('wechat.appSecret');

    if (!appId || !appSecret) {
      return { openid: 'mock_openid_' + code, isMock: true };
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;

    try {
      const response = await fetch(url);
      const data = (await response.json()) as { openid?: string };

      if (data.openid) {
        return { openid: data.openid };
      } else {
        return { openid: 'mock_openid_' + code, isMock: true };
      }
    } catch (e) {
      return { openid: 'mock_openid_' + code, isMock: true };
    }
  }

  async findOne(id: string): Promise<Merchant> {
    const merchant = await this.merchantsRepository.findOne({ where: { id } });
    if (!merchant) {
      throw new NotFoundException('商家不存在');
    }
    return merchant;
  }

  async update(id: string, data: Partial<Merchant>): Promise<Merchant> {
    await this.merchantsRepository.update(id, data);
    return this.findOne(id);
  }
}
