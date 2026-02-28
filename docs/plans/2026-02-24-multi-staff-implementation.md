# 多店员管理功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现多店员管理功能，支持管理员添加/删除店员，区分权限，记录操作日志

**Architecture:** 
- 新增 Staff 实体存储店员信息，与 Merchant 一对多关系
- 新增 OperationLog 实体记录所有操作
- 在 Auth 模块中支持多用户登录
- 添加权限守卫区分管理员和店员

**Tech Stack:** NestJS, TypeORM, PostgreSQL, 微信小程序

---

## Task 1: 创建 Staff 实体

**Files:**
- Create: `apps/backend/src/modules/staff/staff.entity.ts`
- Modify: `apps/backend/src/app.module.ts` - 添加 Staff 模块导入

**Step 1: 创建 staff.entity.ts**

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Merchant } from '../merchant/merchant.entity';

@Entity('staffs')
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'openid', unique: true, length: 100 })
  openid: string;

  @Column({ name: 'nickname', length: 50, nullable: true })
  nickname: string;

  @Column({ name: 'avatar', length: 255, nullable: true })
  avatar: string;

  @Column({ name: 'role', default: 'staff', length: 20 })
  role: 'admin' | 'staff';

  @Column({ name: 'status', default: 'active', length: 20 })
  status: 'active' | 'disabled';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

**Step 2: 运行数据库同步**

Run: `cd apps/backend && pnpm migration:generate -- src/migrations/StaffEntity`
Expected: 生成迁移文件

**Step 3: Commit**

```bash
git add apps/backend/src/modules/staff/ apps/backend/src/app.module.ts
git commit -m "feat: add Staff entity"
```

---

## Task 2: 创建 OperationLog 实体

**Files:**
- Create: `apps/backend/src/modules/staff/operation-log.entity.ts`
- Modify: `apps/backend/src/app.module.ts` - 添加 OperationLog 实体导入

**Step 1: 创建 operation-log.entity.ts**

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Merchant } from '../merchant/merchant.entity';

@Entity('operation_logs')
export class OperationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'staff_id' })
  staffId: string;

  @Column({ name: 'staff_name', length: 50 })
  staffName: string;

  @Column({ name: 'action', length: 50 })
  action: string;

  @Column({ name: 'target_type', length: 50 })
  targetType: string;

  @Column({ name: 'target_id', nullable: true })
  targetId: string;

  @Column({ name: 'details', type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

**Step 2: 运行数据库同步**

**Step 3: Commit**

```bash
git add apps/backend/src/modules/staff/
git commit -m "feat: add OperationLog entity"
```

---

## Task 3: 创建 Staff 模块和服务

**Files:**
- Create: `apps/backend/src/modules/staff/staff.module.ts`
- Create: `apps/backend/src/modules/staff/staff.service.ts`
- Create: `apps/backend/src/modules/staff/staff.controller.ts`

**Step 1: 创建 staff.service.ts**

```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from './staff.entity';
import { OperationLog } from './operation-log.entity';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private staffsRepository: Repository<Staff>,
    @InjectRepository(OperationLog)
    private logsRepository: Repository<OperationLog>,
  ) {}

  async findAll(merchantId: string): Promise<Staff[]> {
    return this.staffsRepository.find({
      where: { merchantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Staff> {
    const staff = await this.staffsRepository.findOne({ where: { id } });
    if (!staff) {
      throw new NotFoundException('店员不存在');
    }
    return staff;
  }

  async findByOpenid(openid: string): Promise<Staff | null> {
    return this.staffsRepository.findOne({ where: { openid } });
  }

  async create(merchantId: string, data: {
    openid: string;
    nickname?: string;
    avatar?: string;
    role?: 'admin' | 'staff';
  }): Promise<Staff> {
    const existing = await this.staffsRepository.findOne({
      where: { openid: data.openid },
    });
    
    if (existing) {
      if (existing.merchantId === merchantId) {
        throw new ForbiddenException('该用户已是店员');
      }
      throw new ForbiddenException('该用户已在其他店铺');
    }

    const staff = this.staffsRepository.create({
      merchantId,
      openid: data.openid,
      nickname: data.nickname || '店员',
      avatar: data.avatar,
      role: data.role || 'staff',
      status: 'active',
    });

    const result = await this.staffsRepository.save(staff);
    
    await this.log(merchantId, result.id, result.nickname, 'add_staff', 'staff', result.id, {
      nickname: result.nickname,
      role: result.role,
    });

    return result;
  }

  async remove(id: string, merchantId: string): Promise<void> {
    const staff = await this.findOne(id);
    if (staff.merchantId !== merchantId) {
      throw new ForbiddenException('无权操作');
    }
    if (staff.role === 'admin') {
      throw new ForbiddenException('不能删除管理员');
    }
    
    await this.log(merchantId, staff.id, staff.nickname, 'remove_staff', 'staff', staff.id, {
      nickname: staff.nickname,
    });

    await this.staffsRepository.delete(id);
  }

  async updateStatus(id: string, status: 'active' | 'disabled', merchantId: string): Promise<Staff> {
    const staff = await this.findOne(id);
    if (staff.merchantId !== merchantId) {
      throw new ForbiddenException('无权操作');
    }
    
    await this.staffsRepository.update(id, { status });
    
    await this.log(merchantId, staff.id, staff.nickname, 
      status === 'active' ? 'enable_staff' : 'disable_staff', 
      'staff', id, { nickname: staff.nickname, status }
    );

    return this.findOne(id);
  }

  async log(
    merchantId: string,
    staffId: string,
    staffName: string,
    action: string,
    targetType: string,
    targetId: string,
    details: Record<string, any>,
  ): Promise<void> {
    const log = this.logsRepository.create({
      merchantId,
      staffId,
      staffName,
      action,
      targetType,
      targetId,
      details,
    });
    await this.logsRepository.save(log);
  }

  async findLogs(merchantId: string, options?: {
    staffId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ data: OperationLog[]; total: number }> {
    const query = this.logsRepository.createQueryBuilder('log')
      .where('log.merchantId = :merchantId', { merchantId });

    if (options?.staffId) {
      query.andWhere('log.staffId = :staffId', { staffId: options.staffId });
    }
    if (options?.action) {
      query.andWhere('log.action = :action', { action: options.action });
    }
    if (options?.startDate) {
      query.andWhere('log.createdAt >= :startDate', { startDate: options.startDate });
    }
    if (options?.endDate) {
      query.andWhere('log.createdAt <= :endDate', { endDate: options.endDate });
    }

    const total = await query.getCount();
    
    const data = await query
      .orderBy('log.createdAt', 'DESC')
      .skip(options?.offset || 0)
      .take(options?.limit || 50)
      .getMany();

    return { data, total };
  }
}
```

**Step 2: 创建 staff.controller.ts**

```typescript
import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StaffService } from './staff.service';
import { IsUUID, IsString, IsOptional, IsEnum } from 'class-validator';

class CreateStaffDto {
  @IsString()
  openid: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

class UpdateStatusDto {
  @IsEnum(['active', 'disabled'])
  status: 'active' | 'disabled';
}

@Controller('staffs')
@UseGuards(AuthGuard('jwt'))
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  findAll(@Request() req) {
    return this.staffService.findAll(req.user.merchantId);
  }

  @Get('me')
  getMe(@Request() req) {
    return this.staffService.findOne(req.user.staffId);
  }

  @Post()
  create(@Request() req, @Body() createStaffDto: CreateStaffDto) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('只有管理员可以添加店员');
    }
    return this.staffService.create(req.user.merchantId, createStaffDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', IsUUID) id: string) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('只有管理员可以删除店员');
    }
    return this.staffService.remove(id, req.user.merchantId);
  }

  @Put(':id/status')
  updateStatus(
    @Request() req,
    @Param('id', IsUUID) id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('只有管理员可以修改店员状态');
    }
    return this.staffService.updateStatus(id, updateStatusDto.status, req.user.merchantId);
  }
}
```

**Step 3: 创建 staff.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staff } from './staff.entity';
import { OperationLog } from './operation-log.entity';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Staff, OperationLog])],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
```

**Step 4: 修改 app.module.ts 导入 StaffModule**

**Step 5: Commit**

```bash
git add apps/backend/src/modules/staff/ apps/backend/src/app.module.ts
git commit -m "feat: add Staff module with CRUD"
```

---

## Task 4: 修改 Auth 模块支持多用户登录

**Files:**
- Modify: `apps/backend/src/modules/auth/auth.service.ts`
- Modify: `apps/backend/src/modules/auth/auth.controller.ts`
- Modify: `apps/backend/src/modules/auth/jwt.strategy.ts`

**Step 1: 修改 jwt.strategy.ts**

```typescript
// 在 validate 方法中返回 staff 信息
async validate(payload: { merchantId: string; openid: string; staffId?: string }) {
  if (payload.staffId) {
    const staff = await this.staffService.findOne(payload.staffId);
    return { 
      merchantId: staff.merchantId, 
      staffId: staff.id, 
      openid: staff.openid,
      nickname: staff.nickname,
      role: staff.role,
    };
  }
  
  // 原有的商家登录逻辑...
}
```

**Step 2: 修改 auth.service.ts 中的 wechatLogin 方法**

```typescript
async wechatLogin(code: string) {
  // ... 获取 openid 逻辑不变

  // 查找是否有对应的店员
  const staff = await this.staffService.findByOpenid(openid);
  
  if (staff) {
    // 店员登录
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

  // 原有的商家登录逻辑...
}
```

**Step 3: Commit**

```bash
git add apps/backend/src/modules/auth/
git commit -m "feat: auth support multi-staff login"
```

---

## Task 5: 创建操作日志服务

**Files:**
- Modify: `apps/backend/src/modules/staff/staff.service.ts` - 已有 log 方法
- Create: `apps/backend/src/modules/staff/logs.controller.ts`

**Step 1: 创建 logs.controller.ts**

```typescript
import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StaffService } from './staff.service';
import { IsOptional, IsString, IsDateString } from 'class-validator';

class QueryLogsDto {
  @IsOptional()
  @IsString()
  staffId?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  limit?: number;

  @IsOptional()
  offset?: number;
}

@Controller('logs')
@UseGuards(AuthGuard('jwt'))
export class LogsController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  findAll(@Request() req, @Query() query: QueryLogsDto) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('只有管理员可以查看操作日志');
    }
    return this.staffService.findLogs(req.user.merchantId, {
      ...query,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });
  }
}
```

**Step 2: 在 staff.module.ts 中注册 LogsController**

**Step 3: Commit**

```bash
git add apps/backend/src/modules/staff/
git commit -m "feat: add operation logs API"
```

---

## Task 6: 在现有 API 中集成操作日志

**Files:**
- Modify: `apps/backend/src/modules/customer/customers.service.ts`
- Modify: `apps/backend/src/modules/appointment/appointments.service.ts`
- Modify: `apps/backend/src/modules/billing/billing.service.ts`

**Step 1: 在 CustomersService 中注入 StaffService 并记录日志**

每个 create/update/delete 操作都需要调用 staffService.log

**Step 2: 在 AppointmentsService 中记录日志**

**Step 3: 在 BillingService 中记录日志**

**Step 4: Commit**

```bash
git add apps/backend/src/modules/customer/ apps/backend/src/modules/appointment/ apps/backend/src/modules/billing/
git commit -m "feat: integrate operation logging in existing services"
```

---

## Task 7: 小程序店员管理页面

**Files:**
- Create: `apps/merchant-miniapp/pages/staff/index.js`
- Create: `apps/merchant-miniapp/pages/staff/index.wxml`
- Create: `apps/merchant-miniapp/pages/staff/index.wxss`
- Create: `apps/merchant-miniapp/pages/staff/index.json`
- Modify: `apps/merchant-miniapp/pages/mine/index.js` - 添加店员管理入口
- Modify: `apps/merchant-miniapp/app.json` - 添加页面路由

**Step 1: 创建 staff 页面**

**Step 2: 修改 mine 页面添加入口**

**Step 3: Commit**

```bash
git add apps/merchant-miniapp/pages/staff/ apps/merchant-miniapp/pages/mine/ apps/merchant-miniapp/app.json
git commit -m "feat: add staff management page in miniapp"
```

---

## Task 8: 小程序操作日志页面

**Files:**
- Create: `apps/merchant-miniapp/pages/logs/index.js`
- Create: `apps/merchant-miniapp/pages/logs/index.wxml`
- Create: `apps/merchant-miniapp/pages/logs/index.wxss`
- Create: `apps/merchant-miniapp/pages/logs/index.json`
- Modify: `apps/merchant-miniapp/pages/mine/index.js` - 添加日志入口

**Step 1: 创建 logs 页面**

**Step 2: Commit**

```bash
git add apps/merchant-miniapp/pages/logs/
git commit -m "feat: add operation logs page in miniapp"
```

---

## Task 9: 添加权限守卫

**Files:**
- Create: `apps/backend/src/common/guards/role.guard.ts`
- Modify: 需要权限控制的 controller

**Step 1: 创建 role.guard.ts**

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private allowedRoles: string[]) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('未登录');
    }
    
    if (!this.allowedRoles.includes(user.role)) {
      throw new ForbiddenException('权限不足');
    }
    
    return true;
  }
}
```

**Step 2: 在报表、店铺设置等 controller 中添加守卫**

**Step 3: Commit**

```bash
git add apps/backend/src/common/guards/
git commit -m "feat: add role-based access guard"
```

---

## 执行顺序

1. Task 1: 创建 Staff 实体
2. Task 2: 创建 OperationLog 实体
3. Task 3: 创建 Staff 模块和服务
4. Task 4: 修改 Auth 支持多用户登录
5. Task 5: 创建操作日志 API
6. Task 6: 在现有服务中集成日志
7. Task 7: 小程序店员管理页面
8. Task 8: 小程序操作日志页面
9. Task 9: 添加权限守卫

---

**Plan complete and saved to `docs/plans/2026-02-24-multi-staff-implementation.md`. Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
