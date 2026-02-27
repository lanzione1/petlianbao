# H5客户端预约全流程实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现H5客户端完整的预约功能，包括微信授权登录、协商式预约、宠物管理和通知系统。

**Architecture:** 采用前后端分离架构，后端NestJS提供API，前端Vue3+Vite构建H5页面，通过微信测试号实现授权登录，使用模板消息和模拟短信实现通知。

**Tech Stack:** NestJS, TypeORM, PostgreSQL, Vue3, TypeScript, Pinia, Vue Router, Axios

---

## Phase 1: 数据库层

### Task 1.1: 创建H5客户实体

**Files:**
- Create: `apps/backend/src/modules/h5-customer/h5-customer.entity.ts`
- Create: `apps/backend/src/modules/h5-customer/h5-customer.module.ts`

**Step 1: 创建H5客户实体**

```typescript
// apps/backend/src/modules/h5-customer/h5-customer.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('h5_customers')
export class H5Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({ name: 'openid', length: 64, nullable: true })
  openid: string;

  @Column({ name: 'unionid', length: 64, nullable: true })
  unionid: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 50, nullable: true })
  nickname: string;

  @Column({ length: 255, nullable: true })
  avatar: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

**Step 2: 创建H5客户模块**

```typescript
// apps/backend/src/modules/h5-customer/h5-customer.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { H5Customer } from './h5-customer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([H5Customer])],
  exports: [TypeOrmModule],
})
export class H5CustomerModule {}
```

**Step 3: 提交**

```bash
git add apps/backend/src/modules/h5-customer/
git commit -m "feat(backend): add h5 customer entity"
```

---

### Task 1.2: 创建H5宠物实体

**Files:**
- Create: `apps/backend/src/modules/h5-customer/h5-pet.entity.ts`

**Step 1: 创建H5宠物实体**

```typescript
// apps/backend/src/modules/h5-customer/h5-pet.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { H5Customer } from './h5-customer.entity';

@Entity('h5_pets')
export class H5Pet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => H5Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: H5Customer;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 20 })
  species: 'dog' | 'cat' | 'other';

  @Column({ length: 50, nullable: true })
  breed: string;

  @Column({ length: 10, nullable: true })
  gender: 'male' | 'female' | 'unknown';

  @Column({ name: 'birthday', type: 'date', nullable: true })
  birthday: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  @Column({ length: 255, nullable: true })
  avatar: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

**Step 2: 更新H5客户模块**

```typescript
// apps/backend/src/modules/h5-customer/h5-customer.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { H5Customer } from './h5-customer.entity';
import { H5Pet } from './h5-pet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([H5Customer, H5Pet])],
  exports: [TypeOrmModule],
})
export class H5CustomerModule {}
```

**Step 3: 提交**

```bash
git add apps/backend/src/modules/h5-customer/
git commit -m "feat(backend): add h5 pet entity"
```

---

### Task 1.3: 创建预约历史记录实体

**Files:**
- Create: `apps/backend/src/modules/appointment/appointment-history.entity.ts`

**Step 1: 创建预约历史实体**

```typescript
// apps/backend/src/modules/appointment/appointment-history.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';

export type HistoryAction = 
  | 'create' 
  | 'confirm' 
  | 'reschedule' 
  | 'accept' 
  | 'reject' 
  | 'cancel' 
  | 'complete';

export type OperatorType = 'customer' | 'merchant';

@Entity('appointment_histories')
export class AppointmentHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'appointment_id' })
  appointmentId: string;

  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @Column({ length: 20 })
  action: HistoryAction;

  @Column({ name: 'operator_type', length: 20 })
  operatorType: OperatorType;

  @Column({ name: 'operator_id' })
  operatorId: string;

  @Column({ name: 'operator_name', length: 50 })
  operatorName: string;

  @Column({ name: 'old_time', type: 'timestamp', nullable: true })
  oldTime: Date;

  @Column({ name: 'new_time', type: 'timestamp', nullable: true })
  newTime: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

**Step 2: 提交**

```bash
git add apps/backend/src/modules/appointment/appointment-history.entity.ts
git commit -m "feat(backend): add appointment history entity"
```

---

### Task 1.4: 修改预约实体

**Files:**
- Modify: `apps/backend/src/modules/appointment/appointment.entity.ts`

**Step 1: 添加新字段**

```typescript
// 在 appointment.entity.ts 中添加以下字段

@Column({ name: 'h5_customer_id', nullable: true })
h5CustomerId: string;

@Column({ name: 'h5_pet_id', nullable: true })
h5PetId: string;

@Column({ name: 'proposed_time', type: 'timestamp', nullable: true })
proposedTime: Date;

@Column({ name: 'proposed_by', length: 20, nullable: true })
proposedBy: 'customer' | 'merchant';

@Column({ name: 'created_by', length: 20, default: 'merchant' })
createdBy: 'customer' | 'merchant';
```

**Step 2: 更新状态类型**

```typescript
// 更新 AppointmentStatus 类型
export type AppointmentStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'reschedule'
  | 'in_service'
  | 'completed' 
  | 'paid' 
  | 'cancelled_by_merchant'
  | 'cancelled_by_customer';
```

**Step 3: 提交**

```bash
git add apps/backend/src/modules/appointment/appointment.entity.ts
git commit -m "feat(backend): add h5 fields to appointment entity"
```

---

### Task 1.5: 创建通知记录实体

**Files:**
- Create: `apps/backend/src/modules/notification/notification.entity.ts`
- Create: `apps/backend/src/modules/notification/notification.module.ts`

**Step 1: 创建通知实体**

```typescript
// apps/backend/src/modules/notification/notification.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type NotificationType = 'wechat' | 'sms';
export type NotificationStatus = 'pending' | 'sent' | 'failed';
export type UserType = 'customer' | 'merchant';

@Entity('notification_logs')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'user_type', length: 20 })
  userType: UserType;

  @Column({ length: 20 })
  type: NotificationType;

  @Column({ name: 'template_id', length: 100, nullable: true })
  templateId: string;

  @Column({ type: 'jsonb', nullable: true })
  content: Record<string, any>;

  @Column({ length: 20, default: 'pending' })
  status: NotificationStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

**Step 2: 创建通知模块**

```typescript
// apps/backend/src/modules/notification/notification.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationLog } from './notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationLog])],
  exports: [TypeOrmModule],
})
export class NotificationModule {}
```

**Step 3: 提交**

```bash
git add apps/backend/src/modules/notification/
git commit -m "feat(backend): add notification entity and module"
```

---

## Phase 2: 后端API层

### Task 2.1: 创建微信授权服务

**Files:**
- Create: `apps/backend/src/modules/auth/wechat.service.ts`
- Create: `apps/backend/src/modules/auth/wechat.dto.ts`

**Step 1: 创建DTO**

```typescript
// apps/backend/src/modules/auth/wechat.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class WechatLoginDto {
  @IsString()
  code: string;

  @IsString()
  merchantId: string;
}

export class BindPhoneDto {
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  code?: string;
}
```

**Step 2: 创建微信服务**

```typescript
// apps/backend/src/modules/auth/wechat.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { H5Customer } from '../h5-customer/h5-customer.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    @InjectRepository(H5Customer)
    private customerRepo: Repository<H5Customer>,
  ) {}

  // 测试号配置
  get appId(): string {
    return this.configService.get('WECHAT_TEST_APP_ID') || '';
  }

  get appSecret(): string {
    return this.configService.get('WECHAT_TEST_APP_SECRET') || '';
  }

  // 获取授权URL
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

  // 通过code换取access_token
  async getAccessToken(code: string): Promise<{ accessToken: string; openid: string }> {
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
      throw new Error(`Wechat auth failed: ${data.errmsg}`);
    }

    return {
      accessToken: data.access_token,
      openid: data.openid,
    };
  }

  // 获取用户信息
  async getUserInfo(accessToken: string, openid: string) {
    const { data } = await axios.get(
      `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openid}`
    );

    if (data.errcode) {
      throw new Error(`Get user info failed: ${data.errmsg}`);
    }

    return {
      openid: data.openid,
      nickname: data.nickname,
      avatar: data.headimgurl,
    };
  }

  // 登录或注册
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
    } else {
      // 更新信息
      customer.nickname = userInfo.nickname;
      customer.avatar = userInfo.avatar;
      await this.customerRepo.save(customer);
    }

    const token = this.jwtService.sign({
      sub: customer.id,
      merchantId,
      type: 'h5_customer',
    });

    return { customer, token };
  }

  // 绑定手机号
  async bindPhone(customerId: string, phone: string) {
    const customer = await this.customerRepo.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    customer.phone = phone;
    await this.customerRepo.save(customer);

    return customer;
  }
}
```

**Step 3: 提交**

```bash
git add apps/backend/src/modules/auth/
git commit -m "feat(backend): add wechat auth service"
```

---

### Task 2.2: 创建H5认证控制器

**Files:**
- Create: `apps/backend/src/modules/auth/h5-auth.controller.ts`

**Step 1: 创建控制器**

```typescript
// apps/backend/src/modules/auth/h5-auth.controller.ts
import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { WechatService } from './wechat.service';
import { WechatLoginDto, BindPhoneDto } from './wechat.dto';
import { ConfigService } from '@nestjs/config';

@Controller('h5/auth')
export class H5AuthController {
  constructor(
    private wechatService: WechatService,
    private configService: ConfigService,
  ) {}

  // 获取微信授权URL
  @Get('wechat/url')
  getWechatAuthUrl(
    @Query('merchantId') merchantId: string,
    @Query('redirectUri') redirectUri: string,
  ) {
    const state = Buffer.from(JSON.stringify({ merchantId })).toString('base64');
    const url = this.wechatService.getAuthUrl(redirectUri, state);
    return { url };
  }

  // 微信授权回调
  @Get('wechat/callback')
  async wechatCallback(
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    const { merchantId } = JSON.parse(Buffer.from(state, 'base64').toString());
    const { customer, token } = await this.wechatService.loginOrRegister(merchantId, code);
    
    return {
      success: true,
      data: {
        customer,
        token,
      },
    };
  }

  // 绑定手机号
  @Post('phone/bind')
  @UseGuards(/* H5CustomerGuard */)
  async bindPhone(
    @Request() req,
    @Body() dto: BindPhoneDto,
  ) {
    const customer = await this.wechatService.bindPhone(req.user.sub, dto.phone);
    return { success: true, data: customer };
  }

  // 获取当前用户信息
  @Get('me')
  @UseGuards(/* H5CustomerGuard */)
  async getCurrentUser(@Request() req) {
    return { success: true, data: req.user };
  }
}
```

**Step 2: 提交**

```bash
git add apps/backend/src/modules/auth/h5-auth.controller.ts
git commit -m "feat(backend): add h5 auth controller"
```

---

### Task 2.3: 创建H5预约服务

**Files:**
- Create: `apps/backend/src/modules/appointment/h5-appointment.service.ts`
- Create: `apps/backend/src/modules/appointment/h5-appointment.dto.ts`

**Step 1: 创建DTO**

```typescript
// apps/backend/src/modules/appointment/h5-appointment.dto.ts
import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class CreateH5AppointmentDto {
  @IsUUID()
  merchantId: string;

  @IsUUID()
  @IsOptional()
  petId?: string;

  @IsUUID()
  serviceId: string;

  @IsDateString()
  appointmentTime: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class RescheduleDto {
  @IsDateString()
  proposedTime: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ConfirmRescheduleDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CancelDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
```

**Step 2: 创建服务（由于篇幅，仅展示关键方法框架）**

```typescript
// apps/backend/src/modules/appointment/h5-appointment.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentHistory, HistoryAction } from './appointment-history.entity';
import { H5Customer } from '../h5-customer/h5-customer.entity';
import { H5Pet } from '../h5-customer/h5-pet.entity';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class H5AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    @InjectRepository(AppointmentHistory)
    private historyRepo: Repository<AppointmentHistory>,
    @InjectRepository(H5Customer)
    private customerRepo: Repository<H5Customer>,
    @InjectRepository(H5Pet)
    private petRepo: Repository<H5Pet>,
    private notificationService: NotificationService,
    private dataSource: DataSource,
  ) {}

  // 创建预约
  async create(customerId: string, dto: CreateH5AppointmentDto) {
    // 实现创建预约逻辑
  }

  // 获取预约列表
  async findAll(customerId: string, status?: string) {
    // 实现获取列表逻辑
  }

  // 获取预约详情
  async findOne(appointmentId: string, customerId: string) {
    // 实现获取详情逻辑
  }

  // 改期提议
  async proposeReschedule(appointmentId: string, customerId: string, dto: RescheduleDto) {
    // 实现改期逻辑
  }

  // 确认预约
  async confirm(appointmentId: string, customerId: string) {
    // 实现确认逻辑
  }

  // 取消预约
  async cancel(appointmentId: string, customerId: string, dto: CancelDto) {
    // 实现取消逻辑
  }

  // 记录历史
  private async recordHistory(
    appointmentId: string,
    action: HistoryAction,
    operatorType: 'customer' | 'merchant',
    operatorId: string,
    operatorName: string,
    oldTime?: Date,
    newTime?: Date,
    notes?: string,
  ) {
    const history = this.historyRepo.create({
      appointmentId,
      action,
      operatorType,
      operatorId,
      operatorName,
      oldTime,
      newTime,
      notes,
    });
    await this.historyRepo.save(history);
  }
}
```

**Step 3: 提交**

```bash
git add apps/backend/src/modules/appointment/h5-appointment.*
git commit -m "feat(backend): add h5 appointment service"
```

---

### Task 2.4: 创建H5预约控制器

**Files:**
- Create: `apps/backend/src/modules/appointment/h5-appointment.controller.ts`

**Step 1: 创建控制器**

```typescript
// apps/backend/src/modules/appointment/h5-appointment.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { H5AppointmentService } from './h5-appointment.service';
import {
  CreateH5AppointmentDto,
  RescheduleDto,
  ConfirmRescheduleDto,
  CancelDto,
} from './h5-appointment.dto';

@Controller('h5/appointments')
// @UseGuards(H5CustomerGuard)
export class H5AppointmentController {
  constructor(private appointmentService: H5AppointmentService) {}

  @Get()
  async findAll(
    @Request() req,
    @Query('status') status?: string,
  ) {
    const customerId = req.user.sub;
    const appointments = await this.appointmentService.findAll(customerId, status);
    return { success: true, data: appointments };
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const customerId = req.user.sub;
    const appointment = await this.appointmentService.findOne(id, customerId);
    return { success: true, data: appointment };
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateH5AppointmentDto) {
    const customerId = req.user.sub;
    const appointment = await this.appointmentService.create(customerId, dto);
    return { success: true, data: appointment };
  }

  @Put(':id/reschedule')
  async proposeReschedule(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: RescheduleDto,
  ) {
    const customerId = req.user.sub;
    const appointment = await this.appointmentService.proposeReschedule(id, customerId, dto);
    return { success: true, data: appointment };
  }

  @Put(':id/confirm')
  async confirm(@Request() req, @Param('id') id: string) {
    const customerId = req.user.sub;
    const appointment = await this.appointmentService.confirm(id, customerId);
    return { success: true, data: appointment };
  }

  @Put(':id/cancel')
  async cancel(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CancelDto,
  ) {
    const customerId = req.user.sub;
    const appointment = await this.appointmentService.cancel(id, customerId, dto);
    return { success: true, data: appointment };
  }
}
```

**Step 2: 提交**

```bash
git add apps/backend/src/modules/appointment/h5-appointment.controller.ts
git commit -m "feat(backend): add h5 appointment controller"
```

---

### Task 2.5: 创建通知服务

**Files:**
- Create: `apps/backend/src/modules/notification/notification.service.ts`

**Step 1: 创建服务**

```typescript
// apps/backend/src/modules/notification/notification.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationLog } from './notification.entity';
import axios from 'axios';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(NotificationLog)
    private notificationRepo: Repository<NotificationLog>,
  ) {}

  // 发送微信模板消息
  async sendWechatTemplate(
    openid: string,
    templateId: string,
    data: Record<string, any>,
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
        }
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

  // 发送模拟短信（开发阶段）
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

  // 发送预约通知
  async sendAppointmentNotification(
    type: 'create' | 'confirm' | 'reschedule' | 'cancel',
    appointment: any,
    recipientType: 'customer' | 'merchant',
  ) {
    // 根据类型选择模板和内容
    // 发送微信模板消息
    // 如果需要，同时发送短信
  }

  // 获取access_token
  private async getAccessToken(): Promise<string> {
    const appId = this.configService.get('WECHAT_TEST_APP_ID');
    const appSecret = this.configService.get('WECHAT_TEST_APP_SECRET');

    const { data } = await axios.get(
      `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`
    );

    return data.access_token;
  }

  // 记录通知日志
  private async logNotification(params: Partial<NotificationLog>) {
    const log = this.notificationRepo.create(params);
    await this.notificationRepo.save(log);
  }
}
```

**Step 2: 提交**

```bash
git add apps/backend/src/modules/notification/notification.service.ts
git commit -m "feat(backend): add notification service"
```

---

## Phase 3: 前端页面层

### Task 3.1: 创建授权页面

**Files:**
- Create: `apps/customer-h5/src/pages/AuthPage.vue`
- Create: `apps/customer-h5/src/stores/user.ts`

**Step 1: 创建用户Store**

```typescript
// apps/customer-h5/src/stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('h5_token') || '')
  const customer = ref<any>(null)

  const isLoggedIn = computed(() => !!token.value)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('h5_token', newToken)
  }

  function setCustomer(newCustomer: any) {
    customer.value = newCustomer
  }

  function logout() {
    token.value = ''
    customer.value = null
    localStorage.removeItem('h5_token')
  }

  return {
    token,
    customer,
    isLoggedIn,
    setToken,
    setCustomer,
    logout,
  }
})
```

**Step 2: 创建授权页面**

```vue
<!-- apps/customer-h5/src/pages/AuthPage.vue -->
<template>
  <div class="auth-page">
    <div class="loading" v-if="loading">
      <div class="spinner"></div>
      <p>正在授权...</p>
    </div>
    <div class="error" v-else-if="error">
      <div class="error-icon">❌</div>
      <p>{{ error }}</p>
      <button @click="retry">重试</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const error = ref('')

onMounted(async () => {
  const code = route.query.code as string
  const merchantId = route.query.state as string

  if (!code) {
    error.value = '授权码缺失'
    loading.value = false
    return
  }

  try {
    const { data } = await axios.get('/api/v1/h5/auth/wechat/callback', {
      params: { code, state: merchantId }
    })

    if (data.success) {
      userStore.setToken(data.data.token)
      userStore.setCustomer(data.data.customer)
      router.replace('/appointments')
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || '授权失败'
  } finally {
    loading.value = false
  }
})

function retry() {
  loading.value = true
  error.value = ''
  window.location.reload()
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.loading, .error {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #eee;
  border-top-color: #667eea;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error button {
  margin-top: 16px;
  padding: 10px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
}
</style>
```

**Step 3: 提交**

```bash
git add apps/customer-h5/src/stores/user.ts
git add apps/customer-h5/src/pages/AuthPage.vue
git commit -m "feat(h5): add auth page and user store"
```

---

### Task 3.2: 创建预约列表页面

**Files:**
- Modify: `apps/customer-h5/src/pages/MyAppointmentsPage.vue`

**Step 1: 更新路由**

```typescript
// apps/customer-h5/src/router/index.ts 添加路由守卫

import { useUserStore } from '../stores/user'

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ path: '/', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})
```

**Step 2: 更新预约列表页面（连接真实API）**

由于篇幅限制，此处展示关键修改点：

1. 移除mock数据生成逻辑
2. 添加真实API调用
3. 添加状态筛选
4. 添加下拉刷新

**Step 3: 提交**

```bash
git add apps/customer-h5/src/pages/MyAppointmentsPage.vue
git add apps/customer-h5/src/router/index.ts
git commit -m "feat(h5): update appointments page with real api"
```

---

### Task 3.3: 创建预约详情页面

**Files:**
- Create: `apps/customer-h5/src/pages/AppointmentDetailPage.vue`

**Step 1: 创建页面**

```vue
<!-- apps/customer-h5/src/pages/AppointmentDetailPage.vue -->
<template>
  <div class="detail-page">
    <!-- 状态卡片 -->
    <div class="status-card" :class="appointment?.status">
      <div class="status-text">{{ statusText }}</div>
      <div class="status-desc">{{ statusDesc }}</div>
    </div>

    <!-- 预约信息 -->
    <div class="info-card">
      <h3>预约信息</h3>
      <div class="info-row">
        <span class="label">服务项目</span>
        <span class="value">{{ appointment?.service?.name }}</span>
      </div>
      <div class="info-row">
        <span class="label">预约时间</span>
        <span class="value">{{ formatTime(appointment?.appointmentTime) }}</span>
      </div>
      <div class="info-row" v-if="appointment?.proposedTime">
        <span class="label">改期时间</span>
        <span class="value highlight">{{ formatTime(appointment?.proposedTime) }}</span>
      </div>
      <div class="info-row">
        <span class="label">宠物</span>
        <span class="value">{{ appointment?.pet?.name || '未指定' }}</span>
      </div>
      <div class="info-row" v-if="appointment?.notes">
        <span class="label">备注</span>
        <span class="value">{{ appointment?.notes }}</span>
      </div>
    </div>

    <!-- 协商记录 -->
    <div class="history-card" v-if="appointment?.history?.length">
      <h3>协商记录</h3>
      <div class="history-list">
        <div class="history-item" v-for="h in appointment?.history" :key="h.id">
          <div class="history-action">{{ actionText(h.action) }}</div>
          <div class="history-time">{{ formatTime(h.createdAt) }}</div>
          <div class="history-info" v-if="h.oldTime && h.newTime">
            {{ formatTime(h.oldTime) }} → {{ formatTime(h.newTime) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="actions" v-if="canOperate">
      <button class="btn-reschedule" @click="showReschedule = true">
        改期
      </button>
      <button class="btn-cancel" @click="showCancel = true">
        取消预约
      </button>
    </div>

    <!-- 改期弹窗 -->
    <div class="modal" v-if="showReschedule">
      <div class="modal-content">
        <h3>选择新时间</h3>
        <input type="datetime-local" v-model="newTime" />
        <textarea v-model="rescheduleNotes" placeholder="改期原因（选填）"></textarea>
        <div class="modal-actions">
          <button @click="showReschedule = false">取消</button>
          <button @click="submitReschedule" :disabled="!newTime">确认改期</button>
        </div>
      </div>
    </div>

    <!-- 取消弹窗 -->
    <div class="modal" v-if="showCancel">
      <div class="modal-content">
        <h3>取消预约</h3>
        <p>确定要取消这个预约吗？</p>
        <textarea v-model="cancelReason" placeholder="取消原因（选填）"></textarea>
        <div class="modal-actions">
          <button @click="showCancel = false">不取消</button>
          <button class="danger" @click="submitCancel">确认取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const appointment = ref<any>(null)
const showReschedule = ref(false)
const showCancel = ref(false)
const newTime = ref('')
const rescheduleNotes = ref('')
const cancelReason = ref('')

const statusText = computed(() => {
  const map: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    reschedule: '待确认改期',
    in_service: '服务中',
    completed: '已完成',
    cancelled_by_customer: '已取消',
    cancelled_by_merchant: '商家取消',
  }
  return map[appointment.value?.status] || appointment.value?.status
})

const statusDesc = computed(() => {
  const map: Record<string, string> = {
    pending: '请等待商家确认',
    confirmed: '预约已确认，请按时到店',
    reschedule: '商家提议改期，请确认或拒绝',
    in_service: '宠物正在接受服务',
    completed: '服务已完成',
    cancelled_by_customer: '您已取消此预约',
    cancelled_by_merchant: '商家已取消此预约',
  }
  return map[appointment.value?.status] || ''
})

const canOperate = computed(() => {
  return ['pending', 'confirmed', 'reschedule'].includes(appointment.value?.status)
})

onMounted(async () => {
  await loadAppointment()
})

async function loadAppointment() {
  const { data } = await axios.get(`/api/v1/h5/appointments/${route.params.id}`)
  appointment.value = data.data
}

async function submitReschedule() {
  try {
    await axios.put(`/api/v1/h5/appointments/${route.params.id}/reschedule`, {
      proposedTime: newTime.value,
      notes: rescheduleNotes.value,
    })
    showReschedule.value = false
    await loadAppointment()
  } catch (e: any) {
    alert(e.response?.data?.message || '改期失败')
  }
}

async function submitCancel() {
  try {
    await axios.put(`/api/v1/h5/appointments/${route.params.id}/cancel`, {
      reason: cancelReason.value,
    })
    router.back()
  } catch (e: any) {
    alert(e.response?.data?.message || '取消失败')
  }
}

function formatTime(time: string | Date) {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function actionText(action: string) {
  const map: Record<string, string> = {
    create: '创建预约',
    confirm: '确认预约',
    reschedule: '提议改期',
    accept: '接受改期',
    reject: '拒绝改期',
    cancel: '取消预约',
    complete: '完成服务',
  }
  return map[action] || action
}
</script>
```

**Step 2: 提交**

```bash
git add apps/customer-h5/src/pages/AppointmentDetailPage.vue
git commit -m "feat(h5): add appointment detail page"
```

---

### Task 3.4: 创建宠物管理页面

**Files:**
- Create: `apps/customer-h5/src/pages/PetsPage.vue`
- Create: `apps/customer-h5/src/pages/PetDetailPage.vue`

**Step 1: 创建宠物列表页面**

```vue
<!-- apps/customer-h5/src/pages/PetsPage.vue -->
<template>
  <div class="pets-page">
    <div class="header">
      <h1>我的宠物</h1>
      <button class="add-btn" @click="goToAdd">+ 添加</button>
    </div>

    <div class="loading" v-if="loading">加载中...</div>

    <div class="empty" v-else-if="pets.length === 0">
      <div class="empty-icon">🐾</div>
      <p>还没有添加宠物</p>
      <button @click="goToAdd">添加第一只宠物</button>
    </div>

    <div class="pet-list" v-else>
      <div class="pet-card" v-for="pet in pets" :key="pet.id" @click="goToDetail(pet.id)">
        <div class="pet-avatar">
          <img v-if="pet.avatar" :src="pet.avatar" />
          <span v-else>{{ pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐱' : '🐾' }}</span>
        </div>
        <div class="pet-info">
          <div class="pet-name">{{ pet.name }}</div>
          <div class="pet-breed">{{ pet.breed || '未知品种' }}</div>
        </div>
        <div class="pet-arrow">›</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const pets = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  await loadPets()
})

async function loadPets() {
  try {
    const { data } = await axios.get('/api/v1/h5/pets')
    pets.value = data.data
  } finally {
    loading.value = false
  }
}

function goToAdd() {
  router.push('/pet/new')
}

function goToDetail(id: string) {
  router.push(`/pet/${id}`)
}
</script>
```

**Step 2: 创建宠物详情/编辑页面**

```vue
<!-- apps/customer-h5/src/pages/PetDetailPage.vue -->
<template>
  <div class="pet-detail-page">
    <div class="header">
      <button class="back-btn" @click="router.back()">‹ 返回</button>
      <h1>{{ isNew ? '添加宠物' : '编辑宠物' }}</h1>
      <button class="save-btn" @click="save" :disabled="saving">
        {{ saving ? '保存中...' : '保存' }}
      </button>
    </div>

    <div class="form">
      <div class="form-item">
        <label>宠物名称 *</label>
        <input type="text" v-model="form.name" placeholder="请输入宠物名称" />
      </div>

      <div class="form-item">
        <label>宠物类型 *</label>
        <div class="type-selector">
          <button :class="{ active: form.species === 'dog' }" @click="form.species = 'dog'">
            🐕 狗狗
          </button>
          <button :class="{ active: form.species === 'cat' }" @click="form.species = 'cat'">
            🐱 猫咪
          </button>
          <button :class="{ active: form.species === 'other' }" @click="form.species = 'other'">
            🐾 其他
          </button>
        </div>
      </div>

      <div class="form-item">
        <label>品种</label>
        <input type="text" v-model="form.breed" placeholder="如：金毛、英短" />
      </div>

      <div class="form-item">
        <label>性别</label>
        <div class="gender-selector">
          <button :class="{ active: form.gender === 'male' }" @click="form.gender = 'male'">
            公
          </button>
          <button :class="{ active: form.gender === 'female' }" @click="form.gender = 'female'">
            母
          </button>
          <button :class="{ active: form.gender === 'unknown' }" @click="form.gender = 'unknown'">
            未知
          </button>
        </div>
      </div>

      <div class="form-item">
        <label>生日</label>
        <input type="date" v-model="form.birthday" />
      </div>

      <div class="form-item">
        <label>体重(kg)</label>
        <input type="number" step="0.1" v-model="form.weight" placeholder="如：5.5" />
      </div>

      <div class="form-item">
        <label>备注</label>
        <textarea v-model="form.notes" placeholder="如：怕生、特殊习惯等"></textarea>
      </div>
    </div>

    <button class="delete-btn" v-if="!isNew" @click="deletePet">删除宠物</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const isNew = computed(() => route.params.id === 'new')
const saving = ref(false)

const form = ref({
  name: '',
  species: 'dog' as 'dog' | 'cat' | 'other',
  breed: '',
  gender: 'unknown' as 'male' | 'female' | 'unknown',
  birthday: '',
  weight: '',
  notes: '',
})

onMounted(async () => {
  if (!isNew.value) {
    await loadPet()
  }
})

async function loadPet() {
  const { data } = await axios.get(`/api/v1/h5/pets/${route.params.id}`)
  const pet = data.data
  form.value = {
    name: pet.name,
    species: pet.species,
    breed: pet.breed || '',
    gender: pet.gender || 'unknown',
    birthday: pet.birthday ? pet.birthday.split('T')[0] : '',
    weight: pet.weight || '',
    notes: pet.notes || '',
  }
}

async function save() {
  if (!form.value.name) {
    alert('请输入宠物名称')
    return
  }

  saving.value = true
  try {
    const data = {
      ...form.value,
      weight: form.value.weight ? parseFloat(form.value.weight) : null,
    }

    if (isNew.value) {
      await axios.post('/api/v1/h5/pets', data)
    } else {
      await axios.put(`/api/v1/h5/pets/${route.params.id}`, data)
    }

    router.back()
  } catch (e: any) {
    alert(e.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function deletePet() {
  if (!confirm('确定要删除这只宠物吗？')) return

  try {
    await axios.delete(`/api/v1/h5/pets/${route.params.id}`)
    router.back()
  } catch (e: any) {
    alert(e.response?.data?.message || '删除失败')
  }
}
</script>
```

**Step 3: 提交**

```bash
git add apps/customer-h5/src/pages/PetsPage.vue
git add apps/customer-h5/src/pages/PetDetailPage.vue
git commit -m "feat(h5): add pets management pages"
```

---

## Phase 4: 集成与测试

### Task 4.1: 更新路由配置

**Files:**
- Modify: `apps/customer-h5/src/router/index.ts`

**Step 1: 添加路由守卫和新路由**

```typescript
// apps/customer-h5/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../pages/HomePage.vue'),
  },
  {
    path: '/auth',
    name: 'auth',
    component: () => import('../pages/AuthPage.vue'),
  },
  {
    path: '/booking',
    name: 'booking',
    component: () => import('../pages/BookingPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/appointments',
    name: 'appointments',
    component: () => import('../pages/MyAppointmentsPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/appointment/:id',
    name: 'appointment-detail',
    component: () => import('../pages/AppointmentDetailPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/pets',
    name: 'pets',
    component: () => import('../pages/PetsPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/pet/:id',
    name: 'pet-detail',
    component: () => import('../pages/PetDetailPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/success',
    name: 'success',
    component: () => import('../pages/SuccessPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ path: '/', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
```

**Step 2: 提交**

```bash
git add apps/customer-h5/src/router/index.ts
git commit -m "feat(h5): update router with auth guard"
```

---

### Task 4.2: 添加环境配置

**Files:**
- Create: `apps/customer-h5/.env.development`
- Create: `apps/customer-h5/.env.production`

**Step 1: 创建开发环境配置**

```env
# apps/customer-h5/.env.development
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WECHAT_APP_ID=
VITE_WECHAT_REDIRECT_URI=
```

**Step 2: 创建生产环境配置**

```env
# apps/customer-h5/.env.production
VITE_API_BASE_URL=/api/v1
VITE_WECHAT_APP_ID=
VITE_WECHAT_REDIRECT_URI=
```

**Step 3: 提交**

```bash
git add apps/customer-h5/.env.*
git commit -m "feat(h5): add environment config"
```

---

### Task 4.3: 添加后端环境配置

**Files:**
- Modify: `apps/backend/.env`

**Step 1: 添加微信测试号配置**

```env
# 微信测试号配置
WECHAT_TEST_APP_ID=
WECHAT_TEST_APP_SECRET=
WECHAT_OAUTH_REDIRECT=
```

**Step 2: 提交**

```bash
git add apps/backend/.env.example
git commit -m "feat(backend): add wechat config to env example"
```

---

### Task 4.4: 创建测试数据脚本

**Files:**
- Modify: `apps/backend/src/modules/dev/dev.controller.ts`

**Step 1: 添加H5测试数据创建方法**

```typescript
// 在 DevController 中添加

@Post('h5/seed')
async seedH5Data() {
  // 创建测试H5客户
  // 创建测试宠物
  // 创建测试预约
  return { message: 'H5测试数据创建成功' };
}
```

**Step 2: 提交**

```bash
git add apps/backend/src/modules/dev/dev.controller.ts
git commit -m "feat(backend): add h5 seed data endpoint"
```

---

### Task 4.5: 验证与测试

**Step 1: 启动后端服务**

```bash
cd apps/backend
pnpm dev
```

**Step 2: 启动H5服务**

```bash
cd apps/customer-h5
pnpm dev
```

**Step 3: 测试流程**

1. 访问 http://localhost:5175
2. 点击授权按钮，模拟授权流程
3. 测试预约创建
4. 测试预约列表
5. 测试预约详情
6. 测试宠物管理

**Step 4: 最终提交**

```bash
git add -A
git commit -m "feat: complete h5 appointment flow implementation"
```

---

## 总结

### 文件清单

**后端新增文件：**
- `apps/backend/src/modules/h5-customer/h5-customer.entity.ts`
- `apps/backend/src/modules/h5-customer/h5-pet.entity.ts`
- `apps/backend/src/modules/h5-customer/h5-customer.module.ts`
- `apps/backend/src/modules/appointment/appointment-history.entity.ts`
- `apps/backend/src/modules/appointment/h5-appointment.service.ts`
- `apps/backend/src/modules/appointment/h5-appointment.controller.ts`
- `apps/backend/src/modules/appointment/h5-appointment.dto.ts`
- `apps/backend/src/modules/auth/wechat.service.ts`
- `apps/backend/src/modules/auth/wechat.dto.ts`
- `apps/backend/src/modules/auth/h5-auth.controller.ts`
- `apps/backend/src/modules/notification/notification.entity.ts`
- `apps/backend/src/modules/notification/notification.module.ts`
- `apps/backend/src/modules/notification/notification.service.ts`

**前端新增/修改文件：**
- `apps/customer-h5/src/stores/user.ts`
- `apps/customer-h5/src/pages/AuthPage.vue`
- `apps/customer-h5/src/pages/AppointmentDetailPage.vue`
- `apps/customer-h5/src/pages/PetsPage.vue`
- `apps/customer-h5/src/pages/PetDetailPage.vue`
- `apps/customer-h5/src/router/index.ts`
- `apps/customer-h5/.env.development`
- `apps/customer-h5/.env.production`

### 后续优化

1. 添加单元测试
2. 优化UI细节
3. 添加错误边界处理
4. 添加加载状态优化
5. 添加下拉刷新
6. 添加骨架屏
7. 性能优化