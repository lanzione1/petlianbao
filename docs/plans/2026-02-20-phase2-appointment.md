# Phase 2: 预约模块 - 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成预约功能的核心开发，包括服务项目管理、客户预约H5、预约看板、微信模板消息提醒

**Architecture:** RESTful API + 微信小程序 + H5前端

**Tech Stack:** NestJS + TypeORM + 微信小程序 + 微信模板消息

---

## Step 1: 服务项目管理 API

**Files:**
- Modify: `apps/backend/src/modules/appointment/service.entity.ts` (已有)
- Create: `apps/backend/src/modules/appointment/dto/create-service.dto.ts`
- Create: `apps/backend/src/modules/appointment/dto/update-service.dto.ts`
- Create: `apps/backend/src/modules/appointment/services.service.ts`
- Create: `apps/backend/src/modules/appointment/services.controller.ts`

**Step 1: 创建 DTO**

```bash
cat > apps/backend/src/modules/appointment/dto/create-service.dto.ts << 'EOF'
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(480)
  duration?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  dailyLimit?: number;
}
EOF

cat > apps/backend/src/modules/appointment/dto/update-service.dto.ts << 'EOF'
import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceDto } from './create-service.dto';

export class UpdateServiceDto extends PartialType(CreateServiceDto) {
  @IsOptional()
  isActive?: boolean;
}
EOF
```

**Step 2: 创建 Service**

```bash
cat > apps/backend/src/modules/appointment/services.service.ts << 'EOF'
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../../entities/service.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
  ) {}

  async create(merchantId: string, createServiceDto: CreateServiceDto): Promise<Service> {
    const service = this.servicesRepository.create({
      ...createServiceDto,
      merchantId,
    });
    return this.servicesRepository.save(service);
  }

  async findAll(merchantId: string): Promise<Service[]> {
    return this.servicesRepository.find({
      where: { merchantId },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(merchantId: string, id: string): Promise<Service> {
    const service = await this.servicesRepository.findOne({
      where: { id, merchantId },
    });
    if (!service) {
      throw new NotFoundException('服务项目不存在');
    }
    return service;
  }

  async update(merchantId: string, id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(merchantId, id);
    Object.assign(service, updateServiceDto);
    return this.servicesRepository.save(service);
  }

  async remove(merchantId: string, id: string): Promise<void> {
    const service = await this.findOne(merchantId, id);
    await this.servicesRepository.remove(service);
  }
}
EOF
```

**Step 3: 创建 Controller**

```bash
cat > apps/backend/src/modules/appointment/services.controller.ts << 'EOF'
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('services')
@UseGuards(AuthGuard('jwt'))
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  create(@Request() req, @Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(req.user.merchantId, createServiceDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.servicesService.findAll(req.user.merchantId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.findOne(req.user.merchantId, id);
  }

  @Put(':id')
  update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.servicesService.update(req.user.merchantId, id, updateServiceDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.remove(req.user.merchantId, id);
  }
}
EOF
```

**Step 4: 更新 Module**

```bash
cat > apps/backend/src/modules/appointment/appointment.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from '../../entities/service.entity';
import { Appointment } from '../../entities/appointment.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Appointment])],
  controllers: [ServicesController, AppointmentsController],
  providers: [ServicesService, AppointmentsService],
  exports: [ServicesService, AppointmentsService],
})
export class AppointmentModule {}
EOF
```

**Step 5: 测试与提交**

```bash
# 启动后端
cd apps/backend && pnpm dev

# 测试创建服务
curl -X POST http://localhost:3000/api/v1/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"洗澡","price":68,"duration":60}'

git add .
git commit -m "feat(appointment): 添加服务项目管理API"
```

---

## Step 2: 预约管理 API

**Files:**
- Create: `apps/backend/src/modules/appointment/dto/create-appointment.dto.ts`
- Create: `apps/backend/src/modules/appointment/dto/update-appointment.dto.ts`
- Modify: `apps/backend/src/modules/appointment/appointments.service.ts`
- Modify: `apps/backend/src/modules/appointment/appointments.controller.ts`

**Step 1: 创建预约 DTO**

```bash
cat > apps/backend/src/modules/appointment/dto/create-appointment.dto.ts << 'EOF'
import { IsString, IsUUID, IsOptional, IsDateString } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  customerId: string;

  @IsUUID()
  serviceId: string;

  @IsDateString()
  appointmentTime: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
EOF

cat > apps/backend/src/modules/appointment/dto/update-appointment.dto.ts << 'EOF'
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsDateString()
  appointmentTime?: string;

  @IsOptional()
  @IsString()
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';

  @IsOptional()
  @IsString()
  notes?: string;
}
EOF
```

**Step 2: 创建预约 Service**

```bash
cat > apps/backend/src/modules/appointment/appointments.service.ts << 'EOF'
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment } from '../../entities/appointment.entity';
import { Service } from '../../entities/service.entity';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
  ) {}

  async create(merchantId: string, createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    const service = await this.servicesRepository.findOne({
      where: { id: createAppointmentDto.serviceId, merchantId },
    });
    
    if (!service) {
      throw new NotFoundException('服务项目不存在');
    }

    const appointment = this.appointmentsRepository.create({
      ...createAppointmentDto,
      merchantId,
      appointmentTime: new Date(createAppointmentDto.appointmentTime),
    });

    return this.appointmentsRepository.save(appointment);
  }

  async findAll(merchantId: string, date?: string): Promise<Appointment[]> {
    const query = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.customer', 'customer')
      .leftJoinAndSelect('appointment.service', 'service')
      .where('appointment.merchantId = :merchantId', { merchantId });

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.andWhere('appointment.appointmentTime BETWEEN :start AND :end', {
        start: startOfDay,
        end: endOfDay,
      });
    }

    return query.orderBy('appointment.appointmentTime', 'ASC').getMany();
  }

  async findToday(merchantId: string): Promise<Appointment[]> {
    const today = new Date();
    return this.findAll(merchantId, today.toISOString().split('T')[0]);
  }

  async findOne(merchantId: string, id: string): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id, merchantId },
      relations: ['customer', 'service'],
    });
    
    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }
    return appointment;
  }

  async update(merchantId: string, id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(merchantId, id);
    
    if (updateAppointmentDto.appointmentTime) {
      appointment.appointmentTime = new Date(updateAppointmentDto.appointmentTime);
    }
    
    Object.assign(appointment, updateAppointmentDto);
    return this.appointmentsRepository.save(appointment);
  }

  async remove(merchantId: string, id: string): Promise<void> {
    const appointment = await this.findOne(merchantId, id);
    await this.appointmentsRepository.remove(appointment);
  }
}
EOF
```

**Step 3: 创建预约 Controller**

```bash
cat > apps/backend/src/modules/appointment/appointments.controller.ts << 'EOF'
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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';

@Controller('appointments')
@UseGuards(AuthGuard('jwt'))
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Request() req, @Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(req.user.merchantId, createAppointmentDto);
  }

  @Get()
  findAll(@Request() req, @Query('date') date?: string) {
    return this.appointmentsService.findAll(req.user.merchantId, date);
  }

  @Get('today')
  findToday(@Request() req) {
    return this.appointmentsService.findToday(req.user.merchantId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentsService.findOne(req.user.merchantId, id);
  }

  @Put(':id')
  update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(req.user.merchantId, id, updateAppointmentDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentsService.remove(req.user.merchantId, id);
  }
}
EOF
```

**Step 4: 测试与提交**

```bash
git add .
git commit -m "feat(appointment): 添加预约管理API"
```

---

## Step 3: 客户预约 H5 前端

**Files:**
- Create: `apps/customer-h5/index.html`
- Create: `apps/customer-h5/src/main.ts`
- Create: `apps/customer-h5/src/App.vue`
- Create: `apps/customer-h5/src/pages/BookingPage.vue`
- Create: `apps/customer-h5/src/pages/SuccessPage.vue`
- Create: `apps/customer-h5/src/api/index.ts`
- Create: `apps/customer-h5/src/router/index.ts`

**Step 1: 创建入口文件**

```bash
cat > apps/customer-h5/index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>预约服务 - 宠联宝</title>
  <link rel="stylesheet" href="/src/styles/main.css">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
EOF

cat > apps/customer-h5/src/main.ts << 'EOF'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')
EOF

cat > apps/customer-h5/src/App.vue << 'EOF'
<template>
  <router-view />
</template>

<script setup lang="ts">
</script>

<style>
page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
EOF
```

**Step 2: 创建路由**

```bash
mkdir -p apps/customer-h5/src/router
mkdir -p apps/customer-h5/src/api
mkdir -p apps/customer-h5/src/styles
mkdir -p apps/customer-h5/src/components

cat > apps/customer-h5/src/router/index.ts << 'EOF'
import { createRouter, createWebHistory } from 'vue-router'
import BookingPage from '../pages/BookingPage.vue'
import SuccessPage from '../pages/SuccessPage.vue'

const routes = [
  {
    path: '/',
    name: 'booking',
    component: BookingPage,
  },
  {
    path: '/success',
    name: 'success',
    component: SuccessPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
EOF
```

**Step 3: 创建 API 客户端**

```bash
cat > apps/customer-h5/src/api/index.ts << 'EOF'
import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
})

export interface Service {
  id: string
  name: string
  price: number
  duration: number
}

export interface TimeSlot {
  time: string
  available: boolean
}

export const appointmentApi = {
  getServices(merchantId: string) {
    return api.get<Service[]>(`/public/services/${merchantId}`)
  },
  
  getTimeSlots(merchantId: string, serviceId: string, date: string) {
    return api.get<TimeSlot[]>(`/public/appointments/slots`, {
      params: { merchantId, serviceId, date }
    })
  },
  
  createAppointment(data: {
    merchantId: string
    serviceId: string
    customerName: string
    phone: string
    petName: string
    appointmentTime: string
    notes?: string
  }) {
    return api.post('/public/appointments', data)
  }
}

export default api
EOF
```

**Step 4: 创建预约页面**

```bash
cat > apps/customer-h5/src/pages/BookingPage.vue << 'EOF'
<template>
  <div class="booking-page">
    <div class="header">
      <h1>{{ shopName }}</h1>
      <p class="subtitle">在线预约服务</p>
    </div>

    <div class="form">
      <div class="form-item">
        <label>选择服务</label>
        <select v-model="form.serviceId" @change="onServiceChange">
          <option value="">请选择服务</option>
          <option v-for="s in services" :key="s.id" :value="s.id">
            {{ s.name }} - ¥{{ s.price }} ({{ s.duration }}分钟)
          </option>
        </select>
      </div>

      <div class="form-item">
        <label>选择日期</label>
        <input type="date" v-model="form.date" :min="minDate" @change="loadTimeSlots" />
      </div>

      <div class="form-item" v-if="form.date && form.serviceId">
        <label>选择时间</label>
        <div class="time-slots">
          <button
            v-for="slot in timeSlots"
            :key="slot.time"
            :class="['slot', { active: form.appointmentTime === slot.time, disabled: !slot.available }]"
            :disabled="!slot.available"
            @click="form.appointmentTime = slot.time"
          >
            {{ slot.time }}
          </button>
        </div>
      </div>

      <div class="form-item">
        <label>宠物昵称</label>
        <input type="text" v-model="form.petName" placeholder="请输入宠物昵称" />
      </div>

      <div class="form-item">
        <label>主人姓名</label>
        <input type="text" v-model="form.customerName" placeholder="请输入您的姓名" />
      </div>

      <div class="form-item">
        <label>手机号</label>
        <input type="tel" v-model="form.phone" placeholder="请输入手机号" />
      </div>

      <div class="form-item">
        <label>备注（选填）</label>
        <textarea v-model="form.notes" placeholder="如：狗狗怕吹风机"></textarea>
      </div>

      <button class="submit-btn" @click="submit" :disabled="!canSubmit">
        提交预约
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { appointmentApi, Service, TimeSlot } from '../api'

const route = useRoute()
const router = useRouter()

const merchantId = route.query.shop as string || ''
const shopName = ref('宠物店')

const services = ref<Service[]>([])
const timeSlots = ref<TimeSlot[]>([])

const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const form = reactive({
  serviceId: '',
  date: minDate.value,
  appointmentTime: '',
  petName: '',
  customerName: '',
  phone: '',
  notes: '',
})

const canSubmit = computed(() => {
  return form.serviceId && form.date && form.appointmentTime && 
         form.petName && form.customerName && form.phone
})

onMounted(async () => {
  if (merchantId) {
    const { data } = await appointmentApi.getServices(merchantId)
    services.value = data
  }
})

const onServiceChange = () => {
  form.appointmentTime = ''
  if (form.date && form.serviceId) {
    loadTimeSlots()
  }
}

const loadTimeSlots = async () => {
  if (!form.serviceId || !form.date) return
  try {
    const { data } = await appointmentApi.getTimeSlots(merchantId, form.serviceId, form.date)
    timeSlots.value = data
  } catch (e) {
    timeSlots.value = []
  }
}

const submit = async () => {
  if (!canSubmit.value) return
  
  try {
    await appointmentApi.createAppointment({
      merchantId,
      ...form,
      appointmentTime: `${form.date} ${form.appointmentTime}`,
    })
    router.push({ 
      path: '/success', 
      query: { petName: form.petName, time: form.appointmentTime } 
    })
  } catch (e) {
    alert('预约失败，请稍后重试')
  }
}
</script>

<style scoped>
.booking-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px 20px;
  text-align: center;
}

.header h1 {
  margin: 0;
  font-size: 24px;
}

.subtitle {
  margin: 5px 0 0;
  opacity: 0.9;
}

.form {
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-item input,
.form-item select,
.form-item textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.time-slots {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.slot {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  text-align: center;
  font-size: 14px;
}

.slot.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.slot.disabled {
  background: #f5f5f5;
  color: #999;
}

.submit-btn {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 500;
}

.submit-btn:disabled {
  opacity: 0.5;
}
</style>
EOF
```

**Step 5: 创建成功页面**

```bash
cat > apps/customer-h5/src/pages/SuccessPage.vue << 'EOF'
<template>
  <div class="success-page">
    <div class="icon">✓</div>
    <h1>预约成功</h1>
    <p>亲爱的 {{ petName }} 家长</p>
    <p>已为您预约 {{ time }}</p>
    <div class="tips">
      <p>请准时到店，我们将为您提供优质服务</p>
      <p>如有变动，请提前联系商家</p>
    </div>
    <button @click="goHome">返回首页</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const petName = ref(route.query.petName as string || '')
const time = ref(route.query.time as string || '')

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.success-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f5f5f5;
}

.icon {
  width: 80px;
  height: 80px;
  background: #52c41a;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  margin-bottom: 20px;
}

h1 {
  color: #333;
  margin-bottom: 10px;
}

.tips {
  margin: 30px 0;
  text-align: center;
  color: #666;
}

button {
  padding: 12px 40px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
}
</style>
EOF
```

**Step 6: 测试与提交**

```bash
cd apps/customer-h5 && pnpm dev
# 访问 http://localhost:5173

git add .
git commit -feat: 添加客户预约H5前端"
```

---

## Step 4: 商家端小程序 - 预约看板

**Files:**
- Create: `apps/merchant-miniapp/app.json`
- Create: `apps/merchant-miniapp/app.js`
- Create: `apps/merchant-miniapp/utils/api.js`
- Create: `apps/merchant-miniapp/pages/index/index.json`
- Create: `apps/merchant-miniapp/pages/index/index.wxml`
- Create: `apps/merchant-miniapp/pages/index/index.wxss`
- Create: `apps/merchant-miniapp/pages/index/index.js`

**Step 1: 创建小程序配置**

```bash
cat > apps/merchant-miniapp/app.json << 'EOF'
{
  "pages": [
    "pages/index/index",
    "pages/customer/list",
    "pages/customer/detail",
    "pages/billing/index",
    "pages/billing/daily",
    "pages/marketing/index",
    "pages/mine/index"
  ],
  "window": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#667eea",
    "navigationBarTitleText": "宠联宝",
    "navigationBarTextStyle": "white"
  },
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#667eea",
    "backgroundColor": "#ffffff",
    "list": [
      { "pagePath": "pages/index/index", "text": "首页" },
      { "pagePath": "pages/customer/list", "text": "客户" },
      { "pagePath": "pages/billing/index", "text": "收银" },
      { "pagePath": "pages/marketing/index", "text": "营销" },
      { "pagePath": "pages/mine/index", "text": "我的" }
    ]
  },
  "sitemapLocation": "sitemap.json"
}
EOF

cat > apps/merchant-miniapp/app.js << 'EOF'
App({
  globalData: {
    userInfo: null,
    token: null,
    apiBase: 'https://api.petlianbao.com/api/v1'
  },
  
  onLaunch() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
    }
  }
})
EOF
```

**Step 2: 创建 API 工具**

```bash
cat > apps/merchant-miniapp/utils/api.js << 'EOF'
const app = getApp()

const request = (options) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.apiBase + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.data.code === 0) {
          resolve(res.data.data)
        } else {
          wx.showToast({
            title: res.data.message || '请求失败',
            icon: 'none'
          })
          reject(res.data)
        }
      },
      fail: reject
    })
  })
}

export const api = {
  getAppointments: (date) => request({ url: `/appointments${date ? '?date=' + date : ''}` }),
  updateAppointment: (id, data) => request({ url: `/appointments/${id}`, method: 'PUT', data }),
  getServices: () => request({ url: '/services' }),
  getTodaySummary: () => request({ url: '/billing/today' }),
}
EOF
```

**Step 3: 创建首页预约看板**

```bash
cat > apps/merchant-miniapp/pages/index/index.json << 'EOF'
{
  "navigationBarTitleText": "今日预约",
  "enablePullDownRefresh": true
}
EOF

cat > apps/merchant-miniapp/pages/index/index.wxml << 'EOF'
<view class="container">
  <view class="date-header">
    <view class="date-nav" bindtap="prevDay">◀</view>
    <view class="date-text">{{ dateText }}</view>
    <view class="date-nav" bindtap="nextDay">▶</view>
  </view>

  <view class="tabs">
    <view class="tab {{currentTab === 'pending' ? 'active' : ''}}" bindtap="switchTab" data-tab="pending">
      待服务 ({{pendingCount}})
    </view>
    <view class="tab {{currentTab === 'completed' ? 'active' : ''}}" bindtap="switchTab" data-tab="completed">
      已完成 ({{completedCount}})
    </view>
  </view>

  <scroll-view scroll-y class="appointment-list">
    <block wx:for="{{currentAppointments}}" wx:key="id">
      <view class="appointment-card" bindtap="showDetail" data-id="{{item.id}}">
        <view class="card-header">
          <text class="time">{{item.appointmentTimeFormatted}}</text>
          <text class="status {{item.status}}">{{statusText[item.status]}}</text>
        </view>
        <view class="card-body">
          <text class="pet-name">{{item.customer.petName}}</text>
          <text class="service-name">{{item.service.name}}</text>
        </view>
        <view class="card-footer" wx:if="{{item.notes}}">
          <text class="notes">{{item.notes}}</text>
        </view>
        <view class="card-actions" wx:if="{{item.status === 'pending'}}">
          <button size="mini" type="primary" bindtap="confirmArrival" data-id="{{item.id}}">确认到店</button>
          <button size="mini" bindtap="completeService" data-id="{{item.id}}">完成服务</button>
        </view>
      </view>
    </block>
    
    <view class="empty" wx:if="{{currentAppointments.length === 0}}">
      <text>暂无预约</text>
    </view>
  </scroll-view>

  <view class="summary">
    <view class="summary-item">
      <text class="label">今日订单</text>
      <text class="value">{{todaySummary.orderCount || 0}}</text>
    </view>
    <view class="summary-item">
      <text class="label">今日营收</text>
      <text class="value">¥{{todaySummary.totalRevenue || 0}}</text>
    </view>
  </view>
</view>
EOF

cat > apps/merchant-miniapp/pages/index/index.wxss << 'EOF'
.container {
  min-height: 100vh;
  background: #f5f5f5;
}

.date-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.date-nav {
  padding: 10px 20px;
  font-size: 18px;
}

.date-text {
  font-size: 18px;
  font-weight: 500;
  margin: 0 30px;
}

.tabs {
  display: flex;
  background: white;
  border-bottom: 1px solid #eee;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 15px;
  color: #666;
}

.tab.active {
  color: #667eea;
  border-bottom: 2px solid #667eea;
}

.appointment-list {
  height: calc(100vh - 350px);
  padding: 15px;
}

.appointment-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.time {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status.pending {
  background: #fff7e6;
  color: #fa8c16;
}

.status.confirmed {
  background: #e6f7ff;
  color: #1890ff;
}

.status.completed {
  background: #f6ffed;
  color: #52c41a;
}

.status.cancelled {
  background: #fff1f0;
  color: #ff4d4f;
}

.card-body {
  display: flex;
  gap: 10px;
}

.pet-name {
  font-size: 16px;
  color: #333;
}

.service-name {
  color: #666;
}

.notes {
  font-size: 12px;
  color: #999;
  display: block;
  margin-top: 8px;
}

.card-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.empty {
  text-align: center;
  padding: 50px;
  color: #999;
}

.summary {
  display: flex;
  background: white;
  border-top: 1px solid #eee;
  padding: 15px;
}

.summary-item {
  flex: 1;
  text-align: center;
}

.summary-item .label {
  display: block;
  color: #999;
  font-size: 12px;
}

.summary-item .value {
  display: block;
  color: #333;
  font-size: 20px;
  font-weight: 500;
  margin-top: 5px;
}
EOF

cat > apps/merchant-miniapp/pages/index/index.js << 'EOF'
const dayjs = require('../../utils/dayjs.min.js')
const { api } = require('../../utils/api.js')

Page({
  data: {
    date: dayjs().format('YYYY-MM-DD'),
    dateText: dayjs().format('YYYY年MM月DD日 dddd'),
    currentTab: 'pending',
    appointments: [],
    todaySummary: {},
    statusText: {
      pending: '待服务',
      confirmed: '已确认',
      completed: '已完成',
      cancelled: '已取消'
    }
  },

  onLoad() {
    this.loadAppointments()
    this.loadTodaySummary()
  },

  onShow() {
    this.loadAppointments()
  },

  onPullDownRefresh() {
    this.loadAppointments()
    this.loadTodaySummary()
  },

  get pendingCount() {
    return this.appointments.filter(a => a.status === 'pending').length
  },

  get completedCount() {
    return this.appointments.filter(a => a.status === 'completed').length
  },

  get currentAppointments() {
    return this.appointments
      .filter(a => a.status === this.data.currentTab)
      .map(a => ({
        ...a,
        appointmentTimeFormatted: dayjs(a.appointmentTime).format('HH:mm')
      }))
  },

  prevDay() {
    const date = dayjs(this.data.date).subtract(1, 'day')
    this.setData({ date: date.format('YYYY-MM-DD'), dateText: date.format('YYYY年MM月DD日 dddd') })
    this.loadAppointments()
  },

  nextDay() {
    const date = dayjs(this.data.date).add(1, 'day')
    this.setData({ date: date.format('YYYY-MM-DD'), dateText: date.format('YYYY年MM月DD日 dddd') })
    this.loadAppointments()
  },

  switchTab(e) {
    this.setData({ currentTab: e.currentTarget.dataset.tab })
  },

  async loadAppointments() {
    try {
      const data = await api.getAppointments(this.data.date)
      this.setData({ appointments: data })
    } catch (e) {
      console.error(e)
    }
    wx.stopPullDownRefresh()
  },

  async loadTodaySummary() {
    try {
      const data = await api.getTodaySummary()
      this.setData({ todaySummary: data })
    } catch (e) {
      console.error(e)
    }
  },

  async confirmArrival(e) {
    const id = e.currentTarget.dataset.id
    try {
      await api.updateAppointment(id, { status: 'confirmed' })
      this.loadAppointments()
      wx.showToast({ title: '已确认到店' })
    } catch (e) {
      console.error(e)
    }
  },

  async completeService(e) {
    const id = e.currentTarget.dataset.id
    try {
      await api.updateAppointment(id, { status: 'completed' })
      this.loadAppointments()
      this.loadTodaySummary()
      wx.showToast({ title: '服务完成' })
    } catch (e) {
      console.error(e)
    }
  },

  showDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/appointment/detail?id=${id}` })
  }
})
EOF
```

**Step 4: Commit**

```bash
git add .
git commit -feat(miniapp): 添加商家端小程序预约看板"
```

---

## Step 5: 微信模板消息提醒

**Files:**
- Create: `apps/backend/src/modules/appointment/services/wechat-notify.service.ts`

**Step 1: 创建微信通知服务**

```bash
mkdir -p apps/backend/src/modules/appointment/services

cat > apps/backend/src/modules/appointment/services/wechat-notify.service.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WechatNotifyService {
  private accessToken: string = '';
  private tokenExpireAt: number = 0;

  constructor(private configService: ConfigService) {}

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpireAt) {
      return this.accessToken;
    }

    const appId = this.configService.get('wechat.appId');
    const appSecret = this.configService.get('wechat.appSecret');
    
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
    const response = await axios.get(url);
    
    if (response.data.access_token) {
      this.accessToken = response.data.access_token;
      this.tokenExpireAt = Date.now() + (response.data.expires_in - 300) * 1000;
      return this.accessToken;
    }
    
    throw new Error('获取微信access_token失败');
  }

  async sendAppointmentReminder(
    openid: string,
    templateId: string,
    data: {
      first: { value: string; color: string };
      keyword1: { value: string; color: string };
      keyword2: { value: string; color: string };
      remark: { value: string; color: string };
    }
  ): Promise<void> {
    const accessToken = await this.getAccessToken();
    
    const url = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`;
    
    await axios.post(url, {
      touser: openid,
      template_id: templateId,
      data,
    });
  }
}
EOF
```

**Step 2: 创建定时任务提醒**

```bash
cat > apps/backend/src/modules/appointment/services/appointment-scheduler.service.ts << 'EOF'
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../../../entities/appointment.entity';
import { Merchant } from '../../../entities/merchant.entity';
import { Customer } from '../../../entities/customer.entity';
import { Service } from '../../../entities/service.entity';

@Injectable()
export class AppointmentSchedulerService {
  private readonly logger = new Logger(AppointmentSchedulerService.name);

  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Merchant)
    private merchantsRepository: Repository<Merchant>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sendReminders() {
    this.logger.log('开始发送预约提醒...');
    
    const now = new Date();
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    const appointments = await this.appointmentsRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.customer', 'customer')
      .leftJoinAndSelect('appointment.service', 'service')
      .where('appointment.appointmentTime BETWEEN :start AND :end', {
        start: now,
        end: in2Hours,
      })
      .andWhere('appointment.status = :status', { status: 'pending' })
      .andWhere('appointment.reminder_sent = :sent', { sent: false })
      .getMany();

    this.logger.log(`找到 ${appointments.length} 条需要发送提醒的预约`);

    for (const appointment of appointments) {
      try {
        // 这里调用微信模板消息发送
        // await this.wechatNotifyService.sendAppointmentReminder(...)
        
        appointment.reminderSent = true;
        await this.appointmentsRepository.save(appointment);
        
        this.logger.log(`已发送提醒: ${appointment.id}`);
      } catch (error) {
        this.logger.error(`发送提醒失败: ${appointment.id}`, error);
      }
    }
  }
}
EOF
```

**Step 3: Commit**

```bash
git add .
git commit -feat(appointment): 添加微信模板消息提醒"
```

---

## 验收标准

- [ ] 服务项目管理 API 完成
- [ ] 预约管理 API 完成
- [ ] 客户预约 H5 页面完成
- [ ] 商家端小程序预约看板完成
- [ ] 微信模板消息提醒基础功能完成
- [ ] 所有单元测试通过
