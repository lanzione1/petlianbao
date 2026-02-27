# Phase 3: 客户+收银模块 - 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成客户管理和收银功能，包括客户CRUD、智能标签、极速收银台、多支付方式、日结报表

**Architecture:** RESTful API + 微信小程序

**Tech Stack:** NestJS + TypeORM + 微信小程序

---

## Step 1: 客户管理 API

**Files:**
- Create: `apps/backend/src/modules/customer/dto/create-customer.dto.ts`
- Create: `apps/backend/src/modules/customer/dto/update-customer.dto.ts`
- Create: `apps/backend/src/modules/customer/customers.service.ts`
- Create: `apps/backend/src/modules/customer/customers.controller.ts`

**Step 1: 创建客户 DTO**

```bash
cat > apps/backend/src/modules/customer/dto/create-customer.dto.ts << 'EOF'
import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  petName: string;

  @IsOptional()
  @IsString()
  petBreed?: string;

  @IsOptional()
  @IsDateString()
  petBirthday?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];
}
EOF

cat > apps/backend/src/modules/customer/dto/update-customer.dto.ts << 'EOF'
import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-customer.dto';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
EOF
```

**Step 2: 创建客户 Service**

```bash
cat > apps/backend/src/modules/customer/customers.service.ts << 'EOF'
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, LessThan } from 'typeorm';
import { Customer } from '../../entities/customer.entity';
import { Transaction } from '../../entities/transaction.entity';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) {}

  async create(merchantId: string, createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customersRepository.create({
      ...createCustomerDto,
      merchantId,
    });
    return this.customersRepository.save(customer);
  }

  async findAll(merchantId: string, query: {
    search?: string;
    tag?: string;
    inactive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ list: Customer[]; total: number }> {
    const { search, tag, inactive, page = 1, limit = 20 } = query;
    
    const queryBuilder = this.customersRepository
      .createQueryBuilder('customer')
      .where('customer.merchantId = :merchantId', { merchantId });

    if (search) {
      queryBuilder.andWhere(
        '(customer.petName LIKE :search OR customer.phone LIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (tag) {
      queryBuilder.andWhere('customer.tags @> :tag', { tag: JSON.stringify([tag]) });
    }

    if (inactive) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      queryBuilder.andWhere('customer.lastVisitAt < :date', { date: thirtyDaysAgo });
    }

    const total = await queryBuilder.getCount();
    
    const list = await queryBuilder
      .orderBy('customer.lastVisitAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { list, total };
  }

  async findOne(merchantId: string, id: string): Promise<Customer> {
    const customer = await this.customersRepository.findOne({
      where: { id, merchantId },
    });
    
    if (!customer) {
      throw new NotFoundException('客户不存在');
    }
    
    // 生成智能标签
    customer.tags = this.generateSmartTags(customer);
    
    return customer;
  }

  async update(merchantId: string, id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(merchantId, id);
    Object.assign(customer, updateCustomerDto);
    return this.customersRepository.save(customer);
  }

  async remove(merchantId: string, id: string): Promise<void> {
    const customer = await this.findOne(merchantId, id);
    await this.customersRepository.remove(customer);
  }

  async getHistory(merchantId: string, id: string): Promise<Transaction[]> {
    await this.findOne(merchantId, id);
    
    return this.transactionsRepository.find({
      where: { customerId: id, merchantId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async getInactive(merchantId: string): Promise<Customer[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.customersRepository.find({
      where: {
        merchantId,
        lastVisitAt: LessThan(thirtyDaysAgo),
      },
      order: { lastVisitAt: 'DESC' },
    });
  }

  private generateSmartTags(customer: Customer): string[] {
    const tags: string[] = [];

    // 活跃标签
    if (customer.lastVisitAt) {
      const daysSinceLastVisit = Math.floor(
        (Date.now() - new Date(customer.lastVisitAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastVisit <= 30) {
        tags.push('recently_active');
      } else if (daysSinceLastVisit >= 60) {
        tags.push('at_risk');
      }
    }

    // 高价值客户
    if (customer.totalSpent && customer.totalSpent >= 500) {
      tags.push('high_value');
    }

    return tags;
  }
}
EOF
```

**Step 3: 创建客户 Controller**

```bash
cat > apps/backend/src/modules/customer/customers.controller.ts << 'EOF'
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
@UseGuards(AuthGuard('jwt'))
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(@Request() req, @Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(req.user.merchantId, createCustomerDto);
  }

  @Get()
  findAll(
    @Request() req,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('inactive') inactive?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.customersService.findAll(req.user.merchantId, {
      search,
      tag,
      inactive: inactive === true,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }

  @Get('inactive')
  getInactive(@Request() req) {
    return this.customersService.getInactive(req.user.merchantId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOne(req.user.merchantId, id);
  }

  @Get(':id/history')
  getHistory(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.getHistory(req.user.merchantId, id);
  }

  @Put(':id')
  update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(req.user.merchantId, id, updateCustomerDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.remove(req.user.merchantId, id);
  }
}
EOF
```

**Step 4: 更新 Module**

```bash
cat > apps/backend/src/modules/customer/customer.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../../entities/customer.entity';
import { Transaction } from '../../entities/transaction.entity';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Transaction])],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomerModule {}
EOF
```

**Step 5: 测试与提交**

```bash
git add .
git commit - "feat(customer): 添加客户管理API"
```

---

## Step 2: 收银管理 API

**Files:**
- Create: `apps/backend/src/modules/billing/dto/checkout.dto.ts`
- Create: `apps/backend/src/modules/billing/billing.service.ts`
- Create: `apps/backend/src/modules/billing/billing.controller.ts`

**Step 1: 创建收银 DTO**

```bash
cat > apps/backend/src/modules/billing/dto/checkout.dto.ts << 'EOF'
import { IsString, IsNumber, IsUUID, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckoutItemDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  quantity?: number;
}

export class CheckoutDto {
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

  @IsString()
  paymentMethod: 'wechat' | 'alipay' | 'cash' | 'member';
}
EOF
```

**Step 2: 创建收银 Service**

```bash
cat > apps/backend/src/modules/billing/billing.service.ts << 'EOF'
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction } from '../../entities/transaction.entity';
import { Customer } from '../../entities/customer.entity';
import { Appointment } from '../../entities/appointment.entity';
import { CheckoutDto } from '../dto/checkout.dto';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
  ) {}

  async checkout(merchantId: string, checkoutDto: CheckoutDto): Promise<Transaction> {
    const customer = await this.customersRepository.findOne({
      where: { id: checkoutDto.customerId, merchantId },
    });

    if (!customer) {
      throw new NotFoundException('客户不存在');
    }

    const transaction = this.transactionsRepository.create({
      merchantId,
      customerId: checkoutDto.customerId,
      appointmentId: checkoutDto.appointmentId,
      items: checkoutDto.items.map(item => ({
        ...item,
        quantity: item.quantity || 1,
      })),
      totalAmount: checkoutDto.totalAmount,
      paymentMethod: checkoutDto.paymentMethod,
    });

    const savedTransaction = await this.transactionsRepository.save(transaction);

    // 更新客户数据
    customer.totalSpent = Number(customer.totalSpent) + checkoutDto.totalAmount;
    customer.visitCount += 1;
    customer.lastVisitAt = new Date();
    await this.customersRepository.save(customer);

    // 如果有关联预约，标记为已完成
    if (checkoutDto.appointmentId) {
      await this.appointmentsRepository.update(checkoutDto.appointmentId, {
        status: 'completed',
      });
    }

    return savedTransaction;
  }

  async findToday(merchantId: string): Promise<Transaction[]> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return this.transactionsRepository.find({
      where: {
        merchantId,
        createdAt: Between(startOfDay, endOfDay),
      },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async getDailySummary(merchantId: string): Promise<any> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const transactions = await this.transactionsRepository.find({
      where: {
        merchantId,
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.totalAmount), 0);
    const orderCount = transactions.length;
    const avgPrice = orderCount > 0 ? totalRevenue / orderCount : 0;

    // 按支付方式统计
    const paymentBreakdown = transactions.reduce((acc, t) => {
      acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + Number(t.totalAmount);
      return acc;
    }, {} as Record<string, number>);

    // 统计新旧客户
    const customerIds = [...new Set(transactions.map(t => t.customerId))];
    const newCustomers = transactions.filter(t => t.createdAt.getTime() - startOfDay.getTime() < 24 * 60 * 60 * 1000 && true).length;

    return {
      totalRevenue,
      orderCount,
      avgPrice,
      paymentBreakdown,
      newCustomers,
      oldCustomers: customerIds.length - newCustomers,
    };
  }

  async closeDay(merchantId: string, cashAmount: number): Promise<any> {
    const summary = await this.getDailySummary(merchantId);
    
    return {
      ...summary,
      cashExpected: summary.paymentBreakdown['cash'] || 0,
      cashActual: cashAmount,
      cashDiff: cashAmount - (summary.paymentBreakdown['cash'] || 0),
      closedAt: new Date(),
    };
  }
}
EOF
```

**Step 3: 创建收银 Controller**

```bash
cat > apps/backend/src/modules/billing/billing.controller.ts << 'EOF'
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BillingService } from './billing.service';
import { CheckoutDto } from '../dto/checkout.dto';

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
EOF
```

**Step 4: 更新 Module**

```bash
cat > apps/backend/src/modules/billing/billing.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../../entities/transaction.entity';
import { Customer } from '../../entities/customer.entity';
import { Appointment } from '../../entities/appointment.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Customer, Appointment])],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
EOF
```

**Step 5: 测试与提交**

```bash
git add .
git commit - "feat(billing): 添加收银管理API"
```

---

## Step 3: 商家端小程序 - 客户页面

**Files:**
- Create: `apps/merchant-miniapp/pages/customer/list.js`
- Create: `apps/merchant-miniapp/pages/customer/list.wxml`
- Create: `apps/merchant-miniapp/pages/customer/list.wxss`
- Create: `apps/merchant-miniapp/pages/customer/detail.js`
- Create: `apps/merchant-miniapp/pages/customer/detail.wxml`

**Step 1: 创建客户列表页面**

```bash
cat > apps/merchant-miniapp/pages/customer/list.wxml << 'EOF'
<view class="container">
  <view class="search-bar">
    <input 
      type="text" 
      placeholder="搜索宠物名/手机号" 
      bindinput="onSearch"
      confirm-type="search"
    />
  </view>

  <view class="filter-tabs">
    <view class="tab {{filter === 'all' ? 'active' : ''}}" bindtap="switchFilter" data-filter="all">
      全部
    </view>
    <view class="tab {{filter === 'inactive' ? 'active' : ''}}" bindtap="switchFilter" data-filter="inactive">
      流失客户
    </view>
    <view class="tab {{filter === 'high_value' ? 'active' : ''}}" bindtap="switchFilter" data-filter="high_value">
      高价值
    </view>
  </view>

  <scroll-view scroll-y class="customer-list">
    <block wx:for="{{customers}}" wx:key="id">
      <view class="customer-card" bindtap="goDetail" data-id="{{item.id}}">
        <view class="card-header">
          <text class="pet-name">{{item.petName}}</text>
          <text class="pet-breed">{{item.petBreed || '未知品种'}}</text>
        </view>
        <view class="card-body">
          <view class="info">
            <text class="phone">{{item.phone || '无电话'}}</text>
            <text class="last-visit">最近: {{item.lastVisitAtFormatted}}</text>
          </view>
          <view class="stats">
            <text class="total-spent">¥{{item.totalSpent}}</text>
            <text class="visit-count">{{item.visitCount}}次</text>
          </view>
        </view>
        <view class="tags" wx:if="{{item.tags.length > 0}}">
          <text class="tag" wx:for="{{item.tags}}" wx:for-item="tag" wx:key="*this">{{tagText[tag]}}</text>
        </view>
      </view>
    </block>

    <view class="empty" wx:if="{{customers.length === 0}}">
      <text>暂无客户</text>
    </view>
  </scroll-view>

  <view class="fab" bindtap="addCustomer">+</view>
</view>
EOF

cat > apps/merchant-miniapp/pages/customer/list.wxss << 'EOF'
.container {
  min-height: 100vh;
  background: #f5f5f5;
}

.search-bar {
  padding: 15px;
  background: white;
}

.search-bar input {
  background: #f5f5f5;
  padding: 10px 15px;
  border-radius: 20px;
  font-size: 14px;
}

.filter-tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #eee;
}

.filter-tabs .tab {
  flex: 1;
  text-align: center;
  padding: 12px;
  color: #666;
  font-size: 14px;
}

.filter-tabs .tab.active {
  color: #667eea;
  border-bottom: 2px solid #667eea;
}

.customer-list {
  height: calc(100vh - 180px);
  padding: 15px;
}

.customer-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.pet-name {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.pet-breed {
  font-size: 12px;
  color: #999;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.card-body {
  display: flex;
  justify-content: space-between;
}

.info text, .stats text {
  display: block;
  font-size: 13px;
  color: #666;
}

.stats {
  text-align: right;
}

.total-spent {
  color: #ff6b6b !important;
  font-weight: 500;
}

.tags {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.tag {
  font-size: 11px;
  color: #667eea;
  background: #f0f0ff;
  padding: 2px 8px;
  border-radius: 4px;
}

.empty {
  text-align: center;
  padding: 50px;
  color: #999;
}

.fab {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 56px;
  height: 56px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
EOF

cat > apps/merchant-miniapp/pages/customer/list.js << 'EOF'
const { api } = require('../../utils/api.js')

Page({
  data: {
    customers: [],
    filter: 'all',
    searchText: '',
    tagText: {
      recently_active: '活跃',
      high_value: '高价值',
      at_risk: '流失风险'
    }
  },

  onShow() {
    this.loadCustomers()
  },

  onSearch(e) {
    this.setData({ searchText: e.detail.value })
    this.loadCustomers()
  },

  switchFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.filter })
    this.loadCustomers()
  },

  async loadCustomers() {
    try {
      const params = {}
      if (this.data.searchText) params.search = this.data.searchText
      if (this.data.filter === 'inactive') params.inactive = true
      if (this.data.filter === 'high_value') params.tag = 'high_value'
      
      const data = await api.getCustomers(params)
      this.setData({
        customers: data.list.map(c => ({
          ...c,
          lastVisitAtFormatted: c.lastVisitAt ? this.formatDate(c.lastVisitAt) : '从未到店'
        }))
      })
    } catch (e) {
      console.error(e)
    }
  },

  formatDate(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    if (diff === 0) return '今天'
    if (diff === 1) return '昨天'
    if (diff < 7) return `${diff}天前`
    return `${date.getMonth() + 1}/${date.getDate()}`
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/customer/detail?id=${e.currentTarget.dataset.id}` })
  },

  addCustomer() {
    wx.navigateTo({ url: '/pages/customer/add' })
  }
})
EOF
```

**Step 2: 创建收银台页面**

```bash
cat > apps/merchant-miniapp/pages/billing/index.wxml << 'EOF'
<view class="container">
  <view class="section">
    <view class="section-title">选择客户</view>
    <view class="customer-select" bindtap="selectCustomer">
      <text wx:if="{{selectedCustomer}}">{{selectedCustomer.petName}}</text>
      <text wx:else class="placeholder">请选择客户</text>
    </view>
  </view>

  <view class="section">
    <view class="section-title">选择服务</view>
    <checkbox-group bindchange="onServiceChange">
      <view class="service-item" wx:for="{{services}}" wx:key="id">
        <checkbox value="{{item.id}}" checked="{{selectedServices[item.id]}}"/>
        <view class="service-info">
          <text class="name">{{item.name}}</text>
          <text class="price">¥{{item.price}}</text>
        </view>
      </view>
    </checkbox-group>
  </view>

  <view class="section" wx:if="{{customItems.length > 0}}">
    <view class="section-title">自定义项目</view>
    <view class="custom-item" wx:for="{{customItems}}" wx:key="index">
      <input placeholder="项目名称" model:value="{{item.name}}" />
      <input type="digit" placeholder="金额" model:value="{{item.price}}" />
      <view class="remove" bindtap="removeCustomItem" data-index="{{index}}">×</view>
    </view>
    <button size="mini" bindtap="addCustomItem">+ 添加自定义项目</button>
  </view>

  <view class="total-section">
    <text class="label">合计</text>
    <text class="amount">¥{{totalAmount}}</text>
  </view>

  <view class="payment-section">
    <view class="section-title">支付方式</view>
    <view class="payment-methods">
      <view 
        class="method {{paymentMethod === 'wechat' ? 'active' : ''}}" 
        bindtap="selectPayment" 
        data-method="wechat"
      >
        微信支付
      </view>
      <view 
        class="method {{paymentMethod === 'alipay' ? 'active' : ''}}" 
        bindtap="selectPayment" 
        data-method="alipay"
      >
        支付宝
      </view>
      <view 
        class="method {{paymentMethod === 'cash' ? 'active' : ''}}" 
        bindtap="selectPayment" 
        data-method="cash"
      >
        现金
      </view>
    </view>
  </view>

  <button class="submit-btn" bindtap="submitPayment" disabled="{{!canSubmit}}">
    确认收款 ¥{{totalAmount}}
  </button>
</view>
EOF

cat > apps/merchant-miniapp/pages/billing/index.js << 'EOF'
const { api } = require('../../utils/api.js')

Page({
  data: {
    selectedCustomer: null,
    services: [],
    selectedServices: {},
    customItems: [],
    totalAmount: 0,
    paymentMethod: 'wechat'
  },

  get canSubmit() {
    return this.data.selectedCustomer && this.data.totalAmount > 0
  },

  onLoad() {
    this.loadServices()
  },

  async loadServices() {
    try {
      const data = await api.getServices()
      this.setData({ services: data })
    } catch (e) {
      console.error(e)
    }
  },

  selectCustomer() {
    wx.navigateTo({ url: '/pages/customer/select' })
  },

  onServiceChange(e) {
    const selected = {}
    e.detail.value.forEach(id => { selected[id] = true })
    
    let amount = 0
    this.data.services.forEach(s => {
      if (selected[s.id]) amount += Number(s.price)
    })
    
    this.setData({
      selectedServices: selected,
      totalAmount: amount + this.calculateCustomTotal()
    })
  },

  addCustomItem() {
    this.setData({
      customItems: [...this.data.customItems, { name: '', price: '' }]
    })
  },

  removeCustomItem(e) {
    const index = e.currentTarget.dataset.index
    const items = [...this.data.customItems]
    items.splice(index, 1)
    this.setData({ customItems: items })
  },

  calculateCustomTotal() {
    return this.data.customItems.reduce((sum, item) => {
      return sum + (parseFloat(item.price) || 0)
    }, 0)
  },

  selectPayment(e) {
    this.setData({ paymentMethod: e.currentTarget.dataset.method })
  },

  async submitPayment() {
    if (!this.canSubmit) return

    const items = [
      ...this.data.services
        .filter(s => this.data.selectedServices[s.id])
        .map(s => ({ name: s.name, price: s.price })),
      ...this.data.customItems.filter(i => i.name && i.price)
    ]

    try {
      await api.createTransaction({
        customerId: this.data.selectedCustomer.id,
        items,
        totalAmount: this.data.totalAmount,
        paymentMethod: this.data.paymentMethod
      })
      
      wx.showToast({ title: '收款成功' })
      setTimeout(() => wx.navigateBack(), 1500)
    } catch (e) {
      wx.showToast({ title: '收款失败', icon: 'none' })
    }
  }
})
EOF
```

**Step 3: Commit**

```bash
git add .
git commit - "feat(miniapp): 添加客户和收银页面"
```

---

## 验收标准

- [ ] 客户管理 API 完成
- [ ] 客户列表小程序页面完成
- [ ] 客户详情小程序页面完成
- [ ] 收银管理 API 完成
- [ ] 收银台小程序页面完成
- [ ] 日结报表 API 完成
- [ ] 所有单元测试通过
