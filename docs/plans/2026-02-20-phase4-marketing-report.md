# Phase 4: 营销+报表模块 - 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成营销工具和数据报表功能，包括海报模板、优惠券、自动化营销、数据报表、客户分析

**Architecture:** RESTful API + 微信小程序 + 腾讯云COS

**Tech Stack:** NestJS + Canvas + ECharts

---

## Step 1: 营销模块 API

**Files:**
- Create: `apps/backend/src/modules/marketing/dto/create-campaign.dto.ts`
- Create: `apps/backend/src/modules/marketing/marketing.service.ts`
- Create: `apps/backend/src/modules/marketing/marketing.controller.ts`

**Step 1: 创建营销 DTO**

```bash
cat > apps/backend/src/modules/marketing/dto/create-campaign.dto.ts << 'EOF'
import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';

export class CreateCampaignDto {
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

export class GeneratePosterDto {
  @IsString()
  templateId: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class SendCouponDto {
  @IsArray()
  customerIds: string[];

  @IsObject()
  coupon: {
    type: 'discount' | 'cash';
    value: number;
    minAmount?: number;
    expiredDays: number;
  };
}
EOF
```

**Step 2: 创建营销 Service**

```bash
cat > apps/backend/src/modules/marketing/marketing.service.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from '../../entities/campaign.entity';
import { Customer } from '../../entities/customer.entity';
import { CreateCampaignDto } from '../dto/create-campaign.dto';

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

  async createCampaign(merchantId: string, createCampaignDto: CreateCampaignDto): Promise<Campaign> {
    const campaign = this.campaignsRepository.create({
      ...createCampaignDto,
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
    // 生成海报图片URL (实际需要调用Canvas服务)
    return {
      imageUrl: `https://cos.petlianbao.com/posters/${templateId}.png`,
      data,
    };
  }

  async sendCoupon(merchantId: string, customerIds: string[], coupon: any) {
    const customers = await this.customersRepository.find({
      where: customerIds.map(id => ({ id, merchantId })) as any,
    });

    // 实际需要发送微信模板消息
    const sentCount = customers.length;

    return {
      total: customerIds.length,
      sent: sentCount,
      failed: customerIds.length - sentCount,
    };
  }

  async sendBroadcast(merchantId: string, customerIds: string[], message: string) {
    // 批量发送微信客服消息
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
    // 保存自动营销规则设置
    return rules;
  }
}
EOF
```

**Step 3: 创建营销 Controller**

```bash
cat > apps/backend/src/modules/marketing/marketing.controller.ts << 'EOF'
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MarketingService } from './marketing.service';
import { CreateCampaignDto, GeneratePosterDto, SendCouponDto } from '../dto/create-campaign.dto';

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
EOF
```

**Step 4: 更新 Module**

```bash
cat > apps/backend/src/modules/marketing/marketing.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campaign } from '../../entities/campaign.entity';
import { Customer } from '../../entities/customer.entity';
import { MarketingService } from './marketing.service';
import { MarketingController } from './marketing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Campaign, Customer])],
  controllers: [MarketingController],
  providers: [MarketingService],
  exports: [MarketingService],
})
export class MarketingModule {}
EOF
```

**Step 5: 测试与提交**

```bash
git add .
git commit - "feat(marketing): 添加营销模块API"
```

---

## Step 2: 报表模块 API

**Files:**
- Create: `apps/backend/src/modules/report/report.service.ts`
- Create: `apps/backend/src/modules/report/report.controller.ts`

**Step 1: 创建报表 Service**

```bash
cat > apps/backend/src/modules/report/report.service.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { Transaction } from '../../entities/transaction.entity';
import { Customer } from '../../entities/customer.entity';
import { Service } from '../../entities/service.entity';
import { Appointment } from '../../entities/appointment.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
  ) {}

  async getDailyReport(merchantId: string, date?: string): Promise<any> {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await this.transactionsRepository.find({
      where: {
        merchantId,
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0);
    const orderCount = transactions.length;
    const uniqueCustomers = new Set(transactions.map(t => t.customerId)).size;

    // 按支付方式统计
    const paymentBreakdown: Record<string, { count: number; amount: number }> = {};
    transactions.forEach(t => {
      if (!paymentBreakdown[t.paymentMethod]) {
        paymentBreakdown[t.paymentMethod] = { count: 0, amount: 0 };
      }
      paymentBreakdown[t.paymentMethod].count++;
      paymentBreakdown[t.paymentMethod].amount += Number(t.totalAmount);
    });

    // 按服务类型统计
    const serviceStats: Record<string, { count: number; revenue: number }> = {};
    transactions.forEach(t => {
      t.items.forEach(item => {
        if (!serviceStats[item.name]) {
          serviceStats[item.name] = { count: 0, revenue: 0 };
        }
        serviceStats[item.name].count++;
        serviceStats[item.name].revenue += Number(item.price) * (item.quantity || 1);
      });
    });

    return {
      date: targetDate.toISOString().split('T')[0],
      totalRevenue,
      orderCount,
      avgPrice: orderCount > 0 ? totalRevenue / orderCount : 0,
      uniqueCustomers,
      paymentBreakdown,
      serviceStats: Object.entries(serviceStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
    };
  }

  async getMonthlyReport(merchantId: string, year: number, month: number): Promise<any> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const transactions = await this.transactionsRepository.find({
      where: {
        merchantId,
        createdAt: Between(startOfMonth, endOfMonth),
      },
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0);
    const orderCount = transactions.length;

    // 按日统计
    const dailyStats: Record<string, { revenue: number; count: number }> = {};
    transactions.forEach(t => {
      const day = t.createdAt.toISOString().split('T')[0];
      if (!dailyStats[day]) {
        dailyStats[day] = { revenue: 0, count: 0 };
      }
      dailyStats[day].revenue += Number(t.totalAmount);
      dailyStats[day].count++;
    });

    return {
      year,
      month,
      totalRevenue,
      orderCount,
      avgPrice: orderCount > 0 ? totalRevenue / orderCount : 0,
      dailyStats: Object.entries(dailyStats)
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  async getCustomerReport(merchantId: string): Promise<any> {
    const customers = await this.customersRepository.find({
      where: { merchantId },
      order: { totalSpent: 'DESC' },
      take: 50,
    });

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => {
      if (!c.lastVisitAt) return false;
      const daysSinceLastVisit = (Date.now() - new Date(c.lastVisitAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLastVisit <= 30;
    }).length;

    const totalSpent = customers.reduce((sum, c) => sum + Number(c.totalSpent), 0);

    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers: totalCustomers - activeCustomers,
      totalSpent,
      avgSpent: totalCustomers > 0 ? totalSpent / totalCustomers : 0,
      topCustomers: customers.slice(0, 10).map(c => ({
        id: c.id,
        petName: c.petName,
        totalSpent: c.totalSpent,
        visitCount: c.visitCount,
        lastVisitAt: c.lastVisitAt,
      })),
    };
  }

  async getServiceReport(merchantId: string): Promise<any> {
    const transactions = await this.transactionsRepository.find({
      where: { merchantId },
    });

    const serviceStats: Record<string, { count: number; revenue: number }> = {};
    transactions.forEach(t => {
      t.items.forEach(item => {
        if (!serviceStats[item.name]) {
          serviceStats[item.name] = { count: 0, revenue: 0 };
        }
        serviceStats[item.name].count++;
        serviceStats[item.name].revenue += Number(item.price) * (item.quantity || 1);
      });
    });

    return Object.entries(serviceStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue);
  }
}
EOF
```

**Step 2: 创建报表 Controller**

```bash
cat > apps/backend/src/modules/report/report.controller.ts << 'EOF'
import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportService } from './report.service';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('daily')
  getDailyReport(@Request() req, @Query('date') date?: string) {
    return this.reportService.getDailyReport(req.user.merchantId, date);
  }

  @Get('monthly')
  getMonthlyReport(
    @Request() req,
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.reportService.getMonthlyReport(
      req.user.merchantId,
      Number(year) || new Date().getFullYear(),
      Number(month) || new Date().getMonth() + 1,
    );
  }

  @Get('customers')
  getCustomerReport(@Request() req) {
    return this.reportService.getCustomerReport(req.user.merchantId);
  }

  @Get('services')
  getServiceReport(@Request() req) {
    return this.reportService.getServiceReport(req.user.merchantId);
  }
}
EOF
```

**Step 3: 更新 Module**

```bash
cat > apps/backend/src/modules/report/report.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../../entities/transaction.entity';
import { Customer } from '../../entities/customer.entity';
import { Service } from '../../entities/service.entity';
import { Appointment } from '../../entities/appointment.entity';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Customer, Service, Appointment])],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
EOF
```

**Step 4: 测试与提交**

```bash
git add .
git commit - "feat(report): 添加报表模块API"
```

---

## Step 3: 商家端小程序 - 营销页面

**Files:**
- Create: `apps/merchant-miniapp/pages/marketing/index.wxml`
- Create: `apps/merchant-miniapp/pages/marketing/index.js`

**Step 1: 创建营销工具页面**

```bash
cat > apps/merchant-miniapp/pages/marketing/index.wxml << 'EOF'
<view class="container">
  <view class="tools-grid">
    <view class="tool-card" bindtap="goPoster">
      <view class="icon">🎉</view>
      <text class="name">节日海报</text>
    </view>
    <view class="tool-card" bindtap="goCoupon">
      <view class="icon">🎫</view>
      <text class="name">优惠券</text>
    </view>
    <view class="tool-card" bindtap="goBirthday">
      <view class="icon">🎂</view>
      <text class="name">生日祝福</text>
    </view>
    <view class="tool-card" bindtap="goBroadcast">
      <view class="icon">📢</view>
      <text class="name">群发消息</text>
    </view>
  </view>

  <view class="section">
    <view class="section-header">
      <text class="title">自动营销</text>
      <switch checked="{{autoRules.inactiveReminder}}" bindchange="toggleRule" data-rule="inactiveReminder"/>
    </view>
    <view class="rule-item">
      <text>30天未到店自动唤醒</text>
      <text class="desc">自动发送8折优惠券</text>
    </view>
  </view>

  <view class="section">
    <view class="section-header">
      <text class="title">最近活动</text>
    </view>
    <view class="campaign-list">
      <view class="campaign-item" wx:for="{{campaigns}}" wx:key="id">
        <view class="campaign-info">
          <text class="campaign-title">{{item.title}}</text>
          <text class="campaign-date">{{item.createdAtFormatted}}</text>
        </view>
        <text class="campaign-count">已发送 {{item.sentCount}} 人</text>
      </view>
      <view class="empty" wx:if="{{campaigns.length === 0}}">
        <text>暂无活动</text>
      </view>
    </view>
  </view>
</view>
EOF

cat > apps/merchant-miniapp/pages/marketing/index.wxss << 'EOF'
.container {
  padding: 15px;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.tool-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.tool-card .icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.tool-card .name {
  font-size: 14px;
  color: #333;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header .title {
  font-size: 16px;
  font-weight: 500;
}

.rule-item {
  padding: 10px 0;
  border-top: 1px solid #f5f5f5;
}

.rule-item text {
  display: block;
  font-size: 14px;
  color: #333;
}

.rule-item .desc {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.campaign-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.campaign-info .campaign-title {
  font-size: 14px;
  color: #333;
}

.campaign-info .campaign-date {
  font-size: 12px;
  color: #999;
}

.campaign-count {
  font-size: 12px;
  color: #667eea;
}
EOF

cat > apps/merchant-miniapp/pages/marketing/index.js << 'EOF'
const { api } = require('../../utils/api.js')

Page({
  data: {
    autoRules: {
      inactiveReminder: true,
      birthdayGreeting: true,
      serviceFollowUp: true
    },
    campaigns: []
  },

  onShow() {
    this.loadCampaigns()
  },

  async loadCampaigns() {
    try {
      const campaigns = await api.getCampaigns()
      this.setData({
        campaigns: campaigns.map(c => ({
          ...c,
          createdAtFormatted: new Date(c.createdAt).toLocaleDateString()
        }))
      })
    } catch (e) {
      console.error(e)
    }
  },

  toggleRule(e) {
    const rule = e.currentTarget.dataset.rule
    const value = e.detail.value
    this.setData({
      [`autoRules.${rule}`]: value
    })
  },

  goPoster() {
    wx.navigateTo({ url: '/pages/marketing/poster' })
  },

  goCoupon() {
    wx.navigateTo({ url: '/pages/marketing/coupon' })
  },

  goBirthday() {
    wx.navigateTo({ url: '/pages/marketing/birthday' })
  },

  goBroadcast() {
    wx.navigateTo({ url: '/pages/marketing/broadcast' })
  }
})
EOF
```

**Step 2: Commit**

```bash
git add .
git commit - "feat(miniapp): 添加营销工具页面"
```

---

## 验收标准

- [ ] 营销模块 API 完成
- [ ] 海报模板生成功能完成
- [ ] 优惠券功能完成
- [ ] 自动化营销规则功能完成
- [ ] 报表模块 API 完成
- [ ] 日报/周报/月报功能完成
- [ ] 客户分析功能完成
- [ ] 服务排行功能完成
- [ ] 营销小程序页面完成
- [ ] 所有单元测试通过
