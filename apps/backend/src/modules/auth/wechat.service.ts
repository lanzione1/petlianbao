import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { H5Customer } from '../h5-customer/h5-customer.entity';
import { Customer } from '../customer/customer.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    @InjectRepository(H5Customer)
    private customerRepo: Repository<H5Customer>,
    @InjectRepository(Customer)
    private formalCustomerRepo: Repository<Customer>,
  ) {}

  get appId(): string {
    return this.configService.get('wechat.testAppId') || '';
  }

  get appSecret(): string {
    return this.configService.get('wechat.testAppSecret') || '';
  }

  getAuthUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      appid: this.appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'snsapi_userinfo',
      state: state || '',
    });
    return `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
  }

  async getAccessToken(code: string): Promise<{ accessToken: string; openid: string; refreshToken: string }> {
    const params = new URLSearchParams({
      appid: this.appId,
      secret: this.appSecret,
      code,
      grant_type: 'authorization_code',
    });

    const { data } = await axios.get(
      `https://api.weixin.qq.com/sns/oauth2/access_token?${params.toString()}`
    );

    if (data.errcode) {
      this.logger.error(`Wechat auth failed: ${data.errmsg}`);
      throw new Error(`Wechat auth failed: ${data.errmsg}`);
    }

    return {
      accessToken: data.access_token,
      openid: data.openid,
      refreshToken: data.refresh_token,
    };
  }

  async getUserInfo(accessToken: string, openid: string) {
    const { data } = await axios.get(
      `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openid}`
    );

    if (data.errcode) {
      this.logger.error(`Get user info failed: ${data.errmsg}`);
      throw new Error(`Get user info failed: ${data.errmsg}`);
    }

    return {
      openid: data.openid,
      nickname: data.nickname,
      avatar: data.headimgurl,
    };
  }

  async loginOrRegister(merchantId: string, code: string) {
    const { accessToken, openid } = await this.getAccessToken(code);
    const userInfo = await this.getUserInfo(accessToken, openid);

    let customer = await this.customerRepo.findOne({
      where: { merchantId, openid },
    });

    if (!customer) {
      customer = this.customerRepo.create({
        merchantId,
        openid: userInfo.openid,
        nickname: userInfo.nickname,
        avatar: userInfo.avatar,
      });
      await this.customerRepo.save(customer);
      this.logger.log(`Created new H5 customer: ${customer.id}`);
      
      // 自动创建正式客户记录（方案A）
      await this.createFormalCustomer(customer, merchantId);
    } else {
      customer.nickname = userInfo.nickname;
      customer.avatar = userInfo.avatar;
      await this.customerRepo.save(customer);
      
      // 更新正式客户记录的昵称
      await this.updateFormalCustomer(customer, merchantId);
    }

    const token = this.jwtService.sign({
      sub: customer.id,
      merchantId,
      type: 'h5_customer',
    });

    return { customer, token };
  }

  // 自动创建正式客户记录
  private async createFormalCustomer(h5Customer: H5Customer, merchantId: string): Promise<Customer> {
    // 检查是否已存在（通过openid关联）
    let formalCustomer = await this.formalCustomerRepo.findOne({
      where: { merchantId, openid: h5Customer.openid },
    });

    if (!formalCustomer) {
      formalCustomer = this.formalCustomerRepo.create({
        merchantId,
        openid: h5Customer.openid,
        petName: '待完善', // 首次预约时填写
        phone: h5Customer.phone,
        gender: 'unknown',
        notes: `来源：H5微信授权 | 客户昵称：${h5Customer.nickname || '未设置'} | 创建时间：${new Date().toLocaleString()}`,
        tags: ['H5新客户'],
      });
      await this.formalCustomerRepo.save(formalCustomer);
      this.logger.log(`Created formal customer for H5 user: ${formalCustomer.id}`);
    }

    return formalCustomer;
  }

  // 更新正式客户记录
  private async updateFormalCustomer(h5Customer: H5Customer, merchantId: string): Promise<void> {
    const formalCustomer = await this.formalCustomerRepo.findOne({
      where: { merchantId, openid: h5Customer.openid },
    });

    if (formalCustomer && h5Customer.nickname) {
      formalCustomer.petName = h5Customer.nickname;
      if (h5Customer.phone) {
        formalCustomer.phone = h5Customer.phone;
      }
      await this.formalCustomerRepo.save(formalCustomer);
    }
  }

  async bindPhone(customerId: string, phone: string) {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    customer.phone = phone;
    await this.customerRepo.save(customer);

    return customer;
  }

  async getCustomerById(customerId: string) {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async devLogin(merchantId: string, openid: string) {
    let customer = await this.customerRepo.findOne({
      where: { merchantId, openid },
    });

    if (!customer) {
      customer = this.customerRepo.create({
        merchantId,
        openid,
        nickname: `测试用户_${Date.now()}`,
      });
      await this.customerRepo.save(customer);
      this.logger.log(`Dev login: Created new H5 customer: ${customer.id}`);
    }

    const token = this.jwtService.sign({
      sub: customer.id,
      merchantId,
      type: 'h5_customer',
    });

    return { customer, token };
  }
}