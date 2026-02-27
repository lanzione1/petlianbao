# 宠物关键日期提醒功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 实现宠物关键日期提醒功能，支持筛选到期宠物并发送祝福/提醒消息

**Architecture:** 在Pet模块中添加提醒查询和发送API；创建ReminderTemplate实体存储消息模板；在小程序中添加提醒页面

**Tech Stack:** NestJS, TypeORM, PostgreSQL, 微信小程序

---

## Task 1: 创建 ReminderTemplate 实体

**Files:**
- Create: `apps/backend/src/modules/pet/reminder-template.entity.ts`
- Modify: `apps/backend/src/modules/pet/pet.module.ts`

**Step 1: 创建 reminder-template.entity.ts**

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('reminder_templates')
export class ReminderTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({ name: 'birthday_template', type: 'text', default: '尊敬的客户，祝您家{petName}生日快乐！🎂' })
  birthdayTemplate: string;

  @Column({ name: 'vaccine_template', type: 'text', default: '您好，您家{petName}的疫苗即将到期，请及时接种💉' })
  vaccineTemplate: string;

  @Column({ name: 'deworm_template', type: 'text', default: '您好，您家{petName}的驱虫即将到期，请及时驱虫🐛' })
  dewormTemplate: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

**Step 2: 检查编译**

Run: `cd apps/backend && pnpm typecheck`

**Step 3: Commit**

```bash
git add apps/backend/src/modules/pet/
git commit -m "feat: add ReminderTemplate entity"
```

---

## Task 2: 添加提醒查询和发送API

**Files:**
- Modify: `apps/backend/src/modules/pet/pet.service.ts`
- Modify: `apps/backend/src/modules/pet/pet.controller.ts`

**Step 1: 修改 pet.service.ts 添加提醒方法**

```typescript
async getReminders(merchantId: string, type: string, days: number): Promise<any[]> {
  const petRepo = this.petsRepository;
  const customerRepo = this.dataSource.getRepository(Customer);
  
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  const pets = await petRepo.createQueryBuilder('pet')
    .leftJoinAndSelect('pet.customerId', 'customer')
    .where('pet.merchantId = :merchantId', { merchantId })
    .getMany();
  
  const results: any[] = [];
  
  for (const pet of pets) {
    // 检查生日
    if ((!type || type === 'all' || type === 'birthday') && pet.birthday) {
      const birthday = new Date(pet.birthday);
      birthday.setFullYear(now.getFullYear());
      if (birthday >= now && birthday <= futureDate) {
        results.push({
          ...pet,
          reminderType: 'birthday',
          reminderDate: birthday,
          daysLeft: Math.ceil((birthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        });
      }
    }
    
    // 检查疫苗
    if ((!type || type === 'all' || type === 'vaccine') && pet.nextVaccineDate) {
      const vaccineDate = new Date(pet.nextVaccineDate);
      if (vaccineDate >= now && vaccineDate <= futureDate) {
        results.push({
          ...pet,
          reminderType: 'vaccine',
          reminderDate: vaccineDate,
          daysLeft: Math.ceil((vaccineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        });
      }
    }
    
    // 检查驱虫
    if ((!type || type === 'all' || type === 'deworm') && pet.nextDewormDate) {
      const dewormDate = new Date(pet.nextDewormDate);
      if (dewormDate >= now && dewormDate <= futureDate) {
        results.push({
          ...pet,
          reminderType: 'deworm',
          reminderDate: dewormDate,
          daysLeft: Math.ceil((dewormDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        });
      }
    }
  }
  
  return results.sort((a, b) => a.daysLeft - b.daysLeft);
}

async getTemplates(merchantId: string): Promise<ReminderTemplate> {
  let template = await this.templateRepo.findOne({ where: { merchantId } });
  if (!template) {
    template = this.templateRepo.create({ merchantId });
    await this.templateRepo.save(template);
  }
  return template;
}

async updateTemplates(merchantId: string, data: any): Promise<ReminderTemplate> {
  let template = await this.templateRepo.findOne({ where: { merchantId } });
  if (!template) {
    template = this.templateRepo.create({ merchantId });
  }
  Object.assign(template, data);
  return this.templateRepo.save(template);
}

async sendReminders(merchantId: string, petIds: string[], type: string, message: string): Promise<{ total: number; sent: number }> {
  // 预留实现：模拟发送
  return { total: petIds.length, sent: petIds.length };
}
```

**Step 2: 修改 pet.controller.ts 添加路由**

```typescript
@Get('reminders')
getReminders(
  @Request() req,
  @Query('type') type: string,
  @Query('days') days: string,
) {
  return this.petService.getReminders(req.user.merchantId, type || 'all', parseInt(days) || 7);
}

@Get('reminders/templates')
getTemplates(@Request() req) {
  return this.petService.getTemplates(req.user.merchantId);
}

@Put('reminders/templates')
updateTemplates(@Request() req, @Body() body: any) {
  return this.petService.updateTemplates(req.user.merchantId, body);
}

@Post('reminders/send')
sendReminders(
  @Request() req,
  @Body() body: { petIds: string[]; type: string; message: string },
) {
  return this.petService.sendReminders(req.user.merchantId, body.petIds, body.type, body.message);
}
```

**Step 3: 检查编译并修复问题**

**Step 4: Commit**

```bash
git add apps/backend/src/modules/pet/
git commit -m "feat: add pet reminder APIs"
```

---

## Task 3: 小程序 - 首页添加提醒入口

**Files:**
- Modify: `apps/merchant-miniapp/pages/index/index.wxml`
- Modify: `apps/merchant-miniapp/pages/index/index.js`

**Step 1: 修改 index.wxml 添加提醒入口**

在首页适当位置添加提醒快捷入口，显示待提醒数量

**Step 2: 修改 index.js 添加提醒数量查询**

```javascript
async loadReminderCount() {
  try {
    const token = wx.getStorageSync('token');
    const res = await new Promise((resolve, reject) => {
      wx.request({
        url: 'http://localhost:3000/api/v1/pets/reminders',
        method: 'GET',
        header: { 'Authorization': `Bearer ${token}` },
        data: { days: 7 },
        success: resolve,
        fail: reject
      });
    });
    this.setData({ reminderCount: res.data.length });
  } catch (e) {
    console.error('加载提醒数失败', e);
  }
}

goReminders() {
  wx.navigateTo({ url: '/pages/pet/reminder/index' });
}
```

**Step 3: Commit**

```bash
git add apps/merchant-miniapp/pages/index/
git commit -m "feat: add reminder entry in homepage"
```

---

## Task 4: 小程序 - 宠物提醒页面

**Files:**
- Create: `apps/merchant-miniapp/pages/pet/reminder/index.js`
- Create: `apps/merchant-miniapp/pages/pet/reminder/index.wxml`
- Create: `apps/merchant-miniapp/pages/pet/reminder/index.wxss`
- Create: `apps/merchant-miniapp/pages/pet/reminder/index.json`
- Modify: `apps/merchant-miniapp/app.json`

**Step 1: 创建 reminder/index.js**

实现：标签筛选、到期范围筛选、列表展示、发送功能

**Step 2: 创建页面样式和结构**

**Step 3: 修改 app.json 添加页面**

**Step 4: Commit**

```bash
git add apps/merchant-miniapp/pages/pet/reminder/
git commit -m "feat: add pet reminder page"
```

---

## Task 5: 小程序 - 模板编辑功能

**Files:**
- Modify: `apps/merchant-miniapp/pages/pet/reminder/index.js`
- Modify: `apps/merchant-miniapp/pages/pet/reminder/index.wxml`

**Step 1: 添加编辑模板弹窗**

**Step 2: 实现模板保存功能**

**Step 3: Commit**

```bash
git add apps/merchant-miniapp/pages/pet/reminder/
git commit -m "feat: add template edit in reminder page"
```

---

## 执行顺序

1. Task 1: 创建 ReminderTemplate 实体
2. Task 2: 添加提醒查询和发送API
3. Task 3: 小程序首页添加提醒入口
4. Task 4: 创建宠物提醒页面
5. Task 5: 添加模板编辑功能

---

**Plan complete and saved to `docs/plans/2026-02-24-pet-reminder-implementation.md`. Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
