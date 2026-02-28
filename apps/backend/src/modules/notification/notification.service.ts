import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationLog } from './notification.entity';
import axios from 'axios';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private accessToken: string;
  private tokenExpiresAt: number;

  constructor(
    private configService: ConfigService,
    @InjectRepository(NotificationLog)
    private notificationRepo: Repository<NotificationLog>,
  ) {}

  private get appId(): string {
    return this.configService.get('wechat.testAppId') || '';
  }

  private get appSecret(): string {
    return this.configService.get('wechat.testAppSecret') || '';
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const { data } = await axios.get(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`,
    );

    if (data.errcode) {
      throw new Error(`Get access token failed: ${data.errmsg}`);
    }

    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;

    return this.accessToken;
  }

  async sendWechatTemplate(
    openid: string,
    templateId: string,
    data: Record<string, { value: string; color?: string }>,
    page?: string,
  ): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.post(
        `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`,
        {
          touser: openid,
          template_id: templateId,
          data,
          page,
        },
      );

      if (response.data.errcode !== 0) {
        throw new Error(response.data.errmsg);
      }

      await this.logNotification({
        userId: openid,
        userType: 'customer',
        type: 'wechat',
        templateId,
        content: data,
        status: 'sent',
      });

      return true;
    } catch (error) {
      this.logger.error(`Send wechat template failed: ${error.message}`);

      await this.logNotification({
        userId: openid,
        userType: 'customer',
        type: 'wechat',
        templateId,
        content: data,
        status: 'failed',
        errorMessage: error.message,
      });

      return false;
    }
  }

  async sendSms(phone: string, content: string): Promise<boolean> {
    this.logger.log('════════════════════════════════════════');
    this.logger.log('【模拟短信】');
    this.logger.log(`接收号码: ${phone}`);
    this.logger.log(`发送时间: ${new Date().toLocaleString('zh-CN')}`);
    this.logger.log(`短信内容: ${content}`);
    this.logger.log('════════════════════════════════════════');

    await this.logNotification({
      userId: phone,
      userType: 'customer',
      type: 'sms',
      content: { phone, content },
      status: 'sent',
    });

    return true;
  }

  async sendAppointmentNotification(
    type: 'create' | 'confirm' | 'reschedule' | 'cancel',
    appointment: any,
    recipientType: 'customer' | 'merchant',
  ) {
    const templates = {
      create: {
        customer: { id: 'TEMPLATE_ID_CREATE_CUSTOMER', name: '新预约通知' },
        merchant: { id: 'TEMPLATE_ID_CREATE_MERCHANT', name: '新预约通知' },
      },
      confirm: {
        customer: { id: 'TEMPLATE_ID_CONFIRM_CUSTOMER', name: '预约确认通知' },
        merchant: { id: 'TEMPLATE_ID_CONFIRM_MERCHANT', name: '预约确认通知' },
      },
      reschedule: {
        customer: { id: 'TEMPLATE_ID_RESCHEDULE_CUSTOMER', name: '改期通知' },
        merchant: { id: 'TEMPLATE_ID_RESCHEDULE_MERCHANT', name: '改期通知' },
      },
      cancel: {
        customer: { id: 'TEMPLATE_ID_CANCEL_CUSTOMER', name: '取消通知' },
        merchant: { id: 'TEMPLATE_ID_CANCEL_MERCHANT', name: '取消通知' },
      },
    };

    const template = templates[type][recipientType];
    this.logger.log(`Sending ${template.name} to ${recipientType}`);

    // TODO: 根据recipientType获取openid或phone，发送实际通知
  }

  private async logNotification(params: Partial<NotificationLog>) {
    try {
      const log = this.notificationRepo.create({
        userId: params.userId || '',
        userType: params.userType || 'customer',
        type: params.type || 'wechat',
        templateId: params.templateId,
        content: params.content,
        status: params.status || 'pending',
        errorMessage: params.errorMessage,
        sentAt: params.status === 'sent' ? new Date() : null,
      });
      await this.notificationRepo.save(log);
    } catch (error) {
      this.logger.error(`Log notification failed: ${error.message}`);
    }
  }
}
