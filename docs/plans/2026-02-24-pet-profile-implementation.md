# 宠物档案功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 为每个客户建立宠物档案，支持一个客户关联多只宠物

**Architecture:** 创建独立的Pet实体，与Customer一对多关系；在客户详情页添加宠物入口；创建宠物列表和编辑页面

**Tech Stack:** NestJS, TypeORM, PostgreSQL, 微信小程序

---

## Task 1: 创建 Pet 实体

**Files:**
- Create: `apps/backend/src/modules/pet/pet.entity.ts`
- Modify: `apps/backend/src/app.module.ts`

**Step 1: 创建 pet.entity.ts**

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
import { Customer } from '../customer/customer.entity';

@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 20 })
  species: 'dog' | 'cat' | 'other';

  @Column({ length: 50 })
  breed: string;

  @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  weight: number;

  @Column({ type: 'date', nullable: true })
  birthday: Date;

  @Column({ type: 'text', nullable: true })
  feeding: string;

  @Column({ type: 'text', nullable: true })
  allergy: string;

  @Column({ type: 'text', nullable: true })
  behavior: string;

  @Column({ length: 255, nullable: true })
  photo: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'next_vaccine_date', type: 'date', nullable: true })
  nextVaccineDate: Date;

  @Column({ name: 'next_deworm_date', type: 'date', nullable: true })
  nextDewormDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

**Step 2: 检查编译**

Run: `cd apps/backend && pnpm typecheck`

**Step 3: Commit**

```bash
git add apps/backend/src/modules/pet/
git commit -m "feat: add Pet entity"
```

---

## Task 2: 创建 Pet Module/Service/Controller

**Files:**
- Create: `apps/backend/src/modules/pet/pet.module.ts`
- Create: `apps/backend/src/modules/pet/pet.service.ts`
- Create: `apps/backend/src/modules/pet/pet.controller.ts`

**Step 1: 创建 pet.service.ts**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from './pet.entity';

@Injectable()
export class PetService {
  constructor(
    @InjectRepository(Pet)
    private petsRepository: Repository<Pet>,
  ) {}

  async findByCustomer(customerId: string): Promise<Pet[]> {
    return this.petsRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Pet> {
    const pet = await this.petsRepository.findOne({ where: { id } });
    if (!pet) {
      throw new NotFoundException('宠物不存在');
    }
    return pet;
  }

  async create(customerId: string, data: Partial<Pet>): Promise<Pet> {
    const pet = this.petsRepository.create({
      ...data,
      customerId,
    });
    return this.petsRepository.save(pet);
  }

  async update(id: string, data: Partial<Pet>): Promise<Pet> {
    await this.petsRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.petsRepository.delete(id);
  }
}
```

**Step 2: 创建 pet.controller.ts**

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PetService } from './pet.service';
import { IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';

class CreatePetDto {
  @IsString()
  name: string;

  @IsEnum(['dog', 'cat', 'other'])
  species: 'dog' | 'cat' | 'other';

  @IsString()
  breed: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsDateString()
  birthday?: string;

  @IsOptional()
  @IsString()
  feeding?: string;

  @IsOptional()
  @IsString()
  allergy?: string;

  @IsOptional()
  @IsString()
  behavior?: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  nextVaccineDate?: string;

  @IsOptional()
  @IsDateString()
  nextDewormDate?: string;
}

@Controller('pets')
@UseGuards(AuthGuard('jwt'))
export class PetController {
  constructor(private readonly petService: PetService) {}

  @Get('customer/:customerId')
  findByCustomer(@Request() req, @Param('customerId') customerId: string) {
    return this.petService.findByCustomer(customerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.petService.findOne(id);
  }

  @Post()
  create(@Request() req, @Body() createPetDto: CreatePetDto) {
    return this.petService.create(req.user.merchantId, createPetDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updatePetDto: CreatePetDto) {
    return this.petService.update(id, updatePetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.petService.remove(id);
  }
}
```

**Step 3: 创建 pet.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pet } from './pet.entity';
import { PetService } from './pet.service';
import { PetController } from './pet.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Pet])],
  controllers: [PetController],
  providers: [PetService],
  exports: [PetService],
})
export class PetModule {}
```

**Step 4: 修改 app.module.ts 导入 PetModule**

**Step 5: Commit**

```bash
git add apps/backend/src/modules/pet/ apps/backend/src/app.module.ts
git commit -m "feat: add Pet module with CRUD"
```

---

## Task 3: 添加数据迁移脚本（为现有客户创建宠物档案）

**Files:**
- Modify: `apps/backend/src/modules/dev/dev.controller.ts`

**Step 1: 添加迁移接口**

```typescript
@Post('migrate-pets')
@UseGuards(AuthGuard('jwt'))
async migratePets(@Request() req) {
  const merchantId = req.user.merchantId;
  const customerRepo = this.dataSource.getRepository(Customer);
  const petRepo = this.dataSource.getRepository(Pet);

  const customers = await customerRepo.find({ where: { merchantId } });
  
  let created = 0;
  for (const customer of customers) {
    if (customer.petName) {
      const existingPets = await petRepo.count({ where: { customerId: customer.id } });
      if (existingPets === 0) {
        const species = this.guessSpecies(customer.petBreed);
        await petRepo.save({
          customerId: customer.id,
          name: customer.petName,
          species,
          breed: customer.petBreed || '未知',
        });
        created++;
      }
    }
  }

  return { message: `已为 ${created} 个客户创建宠物档案` };
}

private guessSpecies(breed: string): 'dog' | 'cat' | 'other' {
  if (!breed) return 'other';
  const lower = breed.toLowerCase();
  if (lower.includes('狗') || lower.includes('犬') || ['金毛', '柯基', '泰迪', '萨摩耶', '哈士奇', '阿拉斯加'].some(b => lower.includes(b))) {
    return 'dog';
  }
  if (lower.includes('猫') || lower.includes('喵')) {
    return 'cat';
  }
  return 'other';
}
```

**Step 2: Commit**

```bash
git add apps/backend/src/modules/dev/dev.controller.ts
git commit -m "feat: add pet migration script"
```

---

## Task 4: 小程序 - 客户详情页添加宠物入口

**Files:**
- Modify: `apps/merchant-miniapp/pages/customer/detail.wxml`
- Modify: `apps/merchant-miniapp/pages/customer/detail.js`

**Step 1: 修改 detail.wxml 添加宠物入口**

在现有页面添加"宠物档案"菜单项

**Step 2: 修改 detail.js 添加跳转**

```javascript
goPets() {
  const id = this.data.customer.id;
  wx.navigateTo({ url: `/pages/pet/list?customerId=${id}&customerName=${this.data.customer.petName}` });
}
```

**Step 3: Commit**

```bash
git add apps/merchant-miniapp/pages/customer/detail.*
git commit -m "feat: add pet entry in customer detail"
```

---

## Task 5: 小程序 - 宠物列表页

**Files:**
- Create: `apps/merchant-miniapp/pages/pet/list.js`
- Create: `apps/merchant-miniapp/pages/pet/list.wxml`
- Create: `apps/merchant-miniapp/pages/pet/list.wxss`
- Create: `apps/merchant-miniapp/pages/pet/list.json`
- Modify: `apps/merchant-miniapp/app.json`

**Step 1: 创建 list.js**

```javascript
const API_URL = 'http://localhost:3000/api/v1';

Page({
  data: {
    customerId: '',
    customerName: '',
    pets: [],
    loading: true
  },

  onLoad(options) {
    this.setData({
      customerId: options.customerId,
      customerName: options.customerName || '客户'
    });
  },

  onShow() {
    this.loadPets();
  },

  loadPets() {
    const token = wx.getStorageSync('token');
    wx.request({
      url: `${API_URL}/pets/customer/${this.data.customerId}`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        this.setData({ pets: res.data || [], loading: false });
      },
      fail: () => {
        this.setData({ loading: false });
      }
    });
  },

  addPet() {
    wx.navigateTo({
      url: `/pages/pet/edit?customerId=${this.data.customerId}`
    });
  },

  editPet(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/pet/edit?id=${id}&customerId=${this.data.customerId}`
    });
  }
});
```

**Step 2: 创建 list.wxml**

```xml
<view class="container">
  <view class="header">
    <text class="title">{{customerName}}的宠物</text>
  </view>

  <view class="pet-list">
    <view wx:if="{{loading}}" class="loading">加载中...</view>
    <view wx:elif="{{pets.length === 0}}" class="empty">暂无宠物档案</view>
    <view wx:else>
      <view class="pet-card" wx:for="{{pets}}" wx:key="id" bindtap="editPet" data-id="{{item.id}}">
        <view class="pet-avatar">{{item.name[0]}}</view>
        <view class="pet-info">
          <text class="pet-name">{{item.name}}</text>
          <text class="pet-breed">{{item.species === 'dog' ? '🐕' : item.species === 'cat' ? '🐱' : '🐾'}} {{item.breed}}</text>
        </view>
        <text class="arrow">></text>
      </view>
    </view>
  </view>

  <button class="btn-add" bindtap="addPet">添加宠物</button>
</view>
```

**Step 3: 创建 list.wxss**

```css
.container { padding: 30rpx; min-height: 100vh; background: #f5f5f5; }
.header { text-align: center; margin-bottom: 40rpx; }
.title { font-size: 36rpx; font-weight: bold; color: #333; }
.pet-list { background: #fff; border-radius: 16rpx; }
.loading, .empty { padding: 60rpx; text-align: center; color: #999; }
.pet-card { display: flex; align-items: center; padding: 30rpx; border-bottom: 1rpx solid #f0f0f0; }
.pet-avatar { width: 100rpx; height: 100rpx; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 40rpx; margin-right: 20rpx; }
.pet-info { flex: 1; }
.pet-name { font-size: 32rpx; color: #333; font-weight: 500; }
.pet-breed { font-size: 26rpx; color: #999; }
.arrow { color: #ccc; font-size: 32rpx; }
.btn-add { position: fixed; bottom: 40rpx; left: 30rpx; right: 30rpx; height: 88rpx; line-height: 88rpx; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; border-radius: 44rpx; }
```

**Step 4: 创建 list.json**

```json
{ "navigationBarTitleText": "宠物档案", "enablePullDownRefresh": true }
```

**Step 5: 修改 app.json 添加页面**

**Step 6: Commit**

```bash
git add apps/merchant-miniapp/pages/pet/ apps/merchant-miniapp/app.json
git commit -m "feat: add pet list page"
```

---

## Task 6: 小程序 - 宠物编辑页

**Files:**
- Create: `apps/merchant-miniapp/pages/pet/edit.js`
- Create: `apps/merchant-miniapp/pages/pet/edit.wxml`
- Create: `apps/merchant-miniapp/pages/pet/edit.wxss`
- Create: `apps/merchant-miniapp/pages/pet/edit.json`

**Step 1: 创建 edit.js**

```javascript
const API_URL = 'http://localhost:3000/api/v1';

Page({
  data: {
    id: '',
    customerId: '',
    form: {
      name: '',
      species: 'dog',
      breed: '',
      weight: '',
      birthday: '',
      feeding: '',
      allergy: '',
      behavior: '',
      notes: '',
      nextVaccineDate: '',
      nextDewormDate: ''
    },
    speciesOptions: [
      { value: 'dog', label: '🐕 狗' },
      { value: 'cat', label: '🐱 猫' },
      { value: 'other', label: '🐾 其他' }
    ]
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id, customerId: options.customerId });
      this.loadPet(options.id);
    } else {
      this.setData({ customerId: options.customerId });
    }
  },

  loadPet(id) {
    const token = wx.getStorageSync('token');
    wx.request({
      url: `${API_URL}/pets/${id}`,
      method: 'GET',
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        if (res.data) {
          const form = { ...res.data };
          if (form.birthday) form.birthday = form.birthday.split('T')[0];
          if (form.nextVaccineDate) form.nextVaccineDate = form.nextVaccineDate.split('T')[0];
          if (form.nextDewormDate) form.nextDewormDate = form.nextDewormDate.split('T')[0];
          this.setData({ form });
        }
      }
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onSpeciesChange(e) {
    this.setData({ 'form.species': this.data.speciesOptions[e.detail.value].value });
  },

  submit() {
    const { form, id, customerId } = this.data;
    if (!form.name) { wx.showToast({ title: '请输入名字', icon: 'none' }); return; }
    if (!form.breed) { wx.showToast({ title: '请输入品种', icon: 'none' }); return; }
    if (!form.weight) { wx.showToast({ title: '请输入体重', icon: 'none' }); return; }

    const token = wx.getStorageSync('token');
    const url = id ? `${API_URL}/pets/${id}` : `${API_URL}/pets`;
    const method = id ? 'PUT' : 'POST';

    wx.request({
      url,
      method,
      header: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { ...form, customerId },
      success: () => {
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1000);
      },
      fail: () => {
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    });
  },

  deletePet() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这只宠物吗？',
      success: (res) => {
        if (res.confirm) {
          const token = wx.getStorageSync('token');
          wx.request({
            url: `${API_URL}/pets/${this.data.id}`,
            method: 'DELETE',
            header: { 'Authorization': `Bearer ${token}` },
            success: () => {
              wx.showToast({ title: '已删除', icon: 'success' });
              setTimeout(() => wx.navigateBack(), 1000);
            }
          });
        }
      }
    });
  }
});
```

**Step 2: 创建 edit.wxml**

```xml
<view class="container">
  <view class="form-group">
    <text class="label">名字 *</text>
    <input data-field="name" value="{{form.name}}" bindinput="onInput" placeholder="请输入宠物名字" />
  </view>

  <view class="form-group">
    <text class="label">物种 *</text>
    <picker bindchange="onSpeciesChange" value="{{speciesOptions.findIndex(s => s.value === form.species)}}" range="{{speciesOptions}}" range-key="label">
      <view class="picker">{{speciesOptions[speciesOptions.findIndex(s => s.value === form.species)].label}}</view>
    </picker>
  </view>

  <view class="form-group">
    <text class="label">品种 *</text>
    <input data-field="breed" value="{{form.breed}}" bindinput="onInput" placeholder="如：金毛、泰迪" />
  </view>

  <view class="form-group">
    <text class="label">体重(kg) *</text>
    <input data-field="weight" type="digit" value="{{form.weight}}" bindinput="onInput" placeholder="请输入体重" />
  </view>

  <view class="form-group">
    <text class="label">生日</text>
    <picker mode="date" data-field="birthday" value="{{form.birthday}}" bindchange="onInput">
      <view class="picker">{{form.birthday || '请选择生日'}}</view>
    </picker>
  </view>

  <view class="form-group">
    <text class="label">饮食习惯</text>
    <textarea data-field="feeding" value="{{form.feeding}}" bindinput="onInput" placeholder="如：每天两次狗粮" />
  </view>

  <view class="form-group">
    <text class="label">过敏史</text>
    <textarea data-field="allergy" value="{{form.allergy}}" bindinput="onInput" placeholder="如有过敏请注明" />
  </view>

  <view class="form-group">
    <text class="label">行为特点</text>
    <textarea data-field="behavior" value="{{form.behavior}}" bindinput="onInput" placeholder="如：活泼、胆小" />
  </view>

  <view class="form-group">
    <text class="label">下次疫苗日期</text>
    <picker mode="date" data-field="nextVaccineDate" value="{{form.nextVaccineDate}}" bindchange="onInput">
      <view class="picker">{{form.nextVaccineDate || '请选择'}}</view>
    </picker>
  </view>

  <view class="form-group">
    <text class="label">下次驱虫日期</text>
    <picker mode="date" data-field="nextDewormDate" value="{{form.nextDewormDate}}" bindchange="onInput">
      <view class="picker">{{form.nextDewormDate || '请选择'}}</view>
    </picker>
  </view>

  <view class="form-group">
    <text class="label">备注</text>
    <textarea data-field="notes" value="{{form.notes}}" bindinput="onInput" placeholder="其他备注" />
  </view>

  <button class="btn-submit" bindtap="submit">保存</button>
  <button wx:if="{{id}}" class="btn-delete" bindtap="deletePet">删除宠物</button>
</view>
```

**Step 3: 创建 edit.wxss**

```css
.container { padding: 30rpx; background: #fff; }
.form-group { margin-bottom: 30rpx; }
.label { display: block; font-size: 28rpx; color: #333; margin-bottom: 10rpx; }
.label::after { content: ' *'; color: #ff4d4f; }
input, textarea, .picker { width: 100%; min-height: 80rpx; padding: 20rpx; border: 1rpx solid #d9d9d9; border-radius: 8rpx; font-size: 28rpx; box-sizing: border-box; }
.btn-submit { width: 100%; height: 88rpx; line-height: 88rpx; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; border-radius: 44rpx; margin-top: 40rpx; }
.btn-delete { width: 100%; height: 88rpx; line-height: 88rpx; background: #fff; color: #ff4d4f; border: 1rpx solid #ff4d4f; border-radius: 44rpx; margin-top: 20rpx; }
```

**Step 4: 创建 edit.json**

```json
{ "navigationBarTitleText": "宠物档案", "enablePullDownRefresh": false }
```

**Step 5: Commit**

```bash
git add apps/merchant-miniapp/pages/pet/
git commit -m "feat: add pet edit page"
```

---

## Task 7: 测试数据迁移

**Step 1: 调用迁移API**

```bash
curl -X POST http://localhost:3000/api/v1/dev/migrate-pets -H "Authorization: Bearer <token>"
```

**Step 2: Commit**

---

## 执行顺序

1. Task 1: 创建 Pet 实体
2. Task 2: 创建 Pet Module/Service/Controller
3. Task 3: 添加数据迁移脚本
4. Task 4: 客户详情页添加宠物入口
5. Task 5: 创建宠物列表页
6. Task 6: 创建宠物编辑页
7. Task 7: 测试数据迁移

---

**Plan complete and saved to `docs/plans/2026-02-24-pet-profile-implementation.md`. Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
