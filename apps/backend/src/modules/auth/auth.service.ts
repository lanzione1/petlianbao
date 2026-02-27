import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from '../merchant/merchant.entity';
import { Staff } from '../staff/staff.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly DEV_MERCHANT_ID = '00000000-0000-0000-0000-000000000001';
  private readonly DEV_OPENID = 'dev_fixed_openid_001';

  constructor(
    @InjectRepository(Merchant)
    private merchantsRepository: Repository<Merchant>,
    @InjectRepository(Staff)
    private staffsRepository: Repository<Staff>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async wechatLogin(code: string) {
    const nodeEnv = this.configService.get('nodeEnv');
    let openid: string;

    if (nodeEnv === 'development') {
      if (code.startsWith('test_')) {
        openid = code;
      } else {
        openid = this.DEV_OPENID;
      }
      console.log('[DEV] Using openid:', openid);
    } else {
      const appId = this.configService.get('wechat.appId');
      const appSecret = this.configService.get('wechat.appSecret');
      
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;
      openid = `real_openid_${code}`;
    }

    const staff = await this.staffsRepository.findOne({ where: { openid } });
    
    if (staff) {
      if (staff.status === 'disabled') {
        throw new UnauthorizedException('账号已被禁用');
      }
      
      const payload = { 
        merchantId: staff.merchantId, 
        openid: staff.openid,
        staffId: staff.id,
      };
      
      return {
        access_token: this.jwtService.sign(payload),
        staff: {
          id: staff.id,
          nickname: staff.nickname,
          role: staff.role,
          merchantId: staff.merchantId,
        },
      };
    }

    let merchant = await this.merchantsRepository.findOne({
      where: { openid },
    });

    if (!merchant) {
      const merchantId = nodeEnv === 'development' ? this.DEV_MERCHANT_ID : undefined;
      
      merchant = this.merchantsRepository.create({
        id: merchantId,
        openid,
        shopName: '我的宠物店',
        planType: 'free',
      });
      await this.merchantsRepository.save(merchant);
      console.log('[DEV] Created merchant with fixed ID:', merchant.id);
    }

    const payload = { merchantId: merchant.id, openid: merchant.openid };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      merchant: {
        id: merchant.id,
        shopName: merchant.shopName,
        phone: merchant.phone,
        planType: merchant.planType,
        role: 'admin',
      },
    };
  }

  async updateProfile(merchantId: string, data: Partial<Merchant>) {
    await this.merchantsRepository.update(merchantId, data);
    return this.merchantsRepository.findOne({ where: { id: merchantId } });
  }

  async validateUser(merchantId: string): Promise<Merchant | null> {
    return this.merchantsRepository.findOne({ where: { id: merchantId } });
  }
}
