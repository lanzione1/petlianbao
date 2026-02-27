# 套餐管理 API 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 创建套餐管理后端API和前端管理页面，支持套餐的CRUD和上下架功能

**Architecture:** 
- 后端：NestJS + TypeORM，创建Package实体和API接口
- 前端：Vue3 + adminApi，调用后端API实现动态管理

**Tech Stack:** NestJS, TypeORM, Vue3 Composition API

---

### Task 1: 创建套餐实体 Package Entity

**Files:**
- Create: `apps/backend/src/modules/package/package.entity.ts`
- Modify: `apps/backend/src/modules/admin/admin.module.ts`

**Step 1: 创建套餐实体**

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('packages')
export class Package {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  name: string;

  @Column({ name: 'type', length: 20 })
  type: string;

  @Column({ type: 'int', default: 0 })
  price: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', default: [] })
  features: string[];

  @Column({ length: 20, default: 'active' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

**Step 2: 在 AdminModule 中注册 Package 实体**

修改 `apps/backend/src/modules/admin/admin.module.ts`:
```typescript
import { Package } from '../package/package.entity';

// 在 @Module({
//   imports: [
//     TypeOrmModule.forFeature([...])
//   ]
// })
// 添加 Package 到 forFeature 数组
TypeOrmModule.forFeature([Admin, AdminLog, Merchant, Customer, Appointment, Transaction, Service, Media, Withdrawal, Package]),
```

---

### Task 2: 添加套餐管理 API 接口

**Files:**
- Modify: `apps/backend/src/modules/admin/admin.controller.ts`
- Modify: `apps/backend/src/modules/admin/admin.service.ts`

**Step 1: 在 AdminService 中添加套餐方法**

```typescript
// 在 AdminService 中添加
async getPackages() {
  return this.packageRepository.find({ order: { price: 'ASC' } });
}

async getPackage(id: string) {
  return this.packageRepository.findOne({ where: { id } });
}

async createPackage(data: {
  name: string;
  type: string;
  price: number;
  description?: string;
  features?: string[];
}) {
  const pkg = this.packageRepository.create(data);
  return this.packageRepository.save(pkg);
}

async updatePackage(id: string, data: Partial<{
  name: string;
  type: string;
  price: number;
  description: string;
  features: string[];
  status: string;
}>) {
  await this.packageRepository.update(id, data);
  return this.getPackage(id);
}

async deletePackage(id: string) {
  await this.packageRepository.delete(id);
  return { success: true };
}

async updatePackageStatus(id: string, status: string) {
  await this.packageRepository.update(id, { status });
  return this.getPackage(id);
}
```

**Step 2: 在 AdminController 中添加路由**

```typescript
@UseGuards(AuthGuard('jwt'))
@Get('packages')
async getPackages() {
  return this.adminService.getPackages();
}

@UseGuards(AuthGuard('jwt'))
@Get('packages/:id')
async getPackage(@Param('id') id: string) {
  return this.adminService.getPackage(id);
}

@UseGuards(AuthGuard('jwt'))
@Post('packages')
async createPackage(@Body() dto: {
  name: string;
  type: string;
  price: number;
  description?: string;
  features?: string[];
}) {
  return this.adminService.createPackage(dto);
}

@UseGuards(AuthGuard('jwt'))
@Put('packages/:id')
async updatePackage(
  @Param('id') id: string,
  @Body() dto: {
    name?: string;
    type?: string;
    price?: number;
    description?: string;
    features?: string[];
    status?: string;
  },
) {
  return this.adminService.updatePackage(id, dto);
}

@UseGuards(AuthGuard('jwt'))
@Delete('packages/:id')
async deletePackage(@Param('id') id: string) {
  return this.adminService.deletePackage(id);
}

@UseGuards(AuthGuard('jwt'))
@Put('packages/:id/status')
async updatePackageStatus(
  @Param('id') id: string,
  @Body('status') status: string,
) {
  return this.adminService.updatePackageStatus(id, status);
}
```

---

### Task 3: 添加前端 API 调用

**Files:**
- Modify: `apps/admin-web/src/api/index.ts`

**Step 1: 添加套餐 API 方法**

```typescript
// 在 adminApi 对象中添加
// 套餐管理
getPackages: () => api.get('/admin/packages'),
getPackage: (id: string) => api.get(`/admin/packages/${id}`),
createPackage: (data: any) => api.post('/admin/packages', data),
updatePackage: (id: string, data: any) => api.put(`/admin/packages/${id}`, data),
deletePackage: (id: string) => api.delete(`/admin/packages/${id}`),
updatePackageStatus: (id: string, status: string) => 
  api.put(`/admin/packages/${id}/status`, { status }),
```

---

### Task 4: 创建套餐管理前端页面

**Files:**
- Modify: `apps/admin-web/src/pages/PackagesPage.vue`

**Step 1: 重写 PackagesPage.vue 实现动态管理**

```vue
<template>
  <div class="packages-page">
    <div class="page-header">
      <h3>套餐管理</h3>
      <button class="btn btn-primary" @click="openModal()">新建套餐</button>
    </div>

    <div class="packages-grid">
      <div v-for="pkg in packages" :key="pkg.id" class="package-card">
        <div class="package-header">
          <span :class="['package-badge', 'badge-' + pkg.type]">{{ getTypeName(pkg.type) }}</span>
          <span class="package-price">{{ formatPrice(pkg.price) }}</span>
        </div>
        <h4 class="package-name">{{ pkg.name }}</h4>
        <p class="package-desc">{{ pkg.description || '暂无描述' }}</p>
        <ul class="package-features">
          <li v-for="(feature, i) in pkg.features" :key="i">{{ feature }}</li>
        </ul>
        <div class="package-footer">
          <span :class="['package-status', pkg.status === 'active' ? 'status-active' : 'status-inactive']">
            {{ pkg.status === 'active' ? '在售' : '已下架' }}
          </span>
          <div class="package-actions">
            <button class="btn btn-sm" @click="editPackage(pkg)">编辑</button>
            <button 
              class="btn btn-sm" 
              :class="pkg.status === 'active' ? 'btn-danger' : 'btn-success'"
              @click="toggleStatus(pkg)"
            >
              {{ pkg.status === 'active' ? '下架' : '上架' }}
            </button>
            <button class="btn btn-sm btn-danger" @click="deletePackage(pkg)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h3>{{ editingId ? '编辑套餐' : '新建套餐' }}</h3>
        <form @submit.prevent="savePackage">
          <div class="form-group">
            <label>套餐名称</label>
            <input v-model="form.name" class="form-input" required />
          </div>
          <div class="form-group">
            <label>套餐类型</label>
            <select v-model="form.type" class="form-input" required>
              <option value="free">免费版</option>
              <option value="basic">基础版</option>
              <option value="pro">专业版</option>
              <option value="enterprise">企业版</option>
            </select>
          </div>
          <div class="form-group">
            <label>价格（元/月）</label>
            <input v-model.number="form.price" type="number" class="form-input" required />
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea v-model="form.description" class="form-input" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label>功能特性（每行一个）</label>
            <textarea v-model="form.featuresText" class="form-input" rows="4" placeholder="每行一个功能"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn" @click="showModal = false">取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { adminApi } from '@/api'

const packages = ref<any[]>([])
const showModal = ref(false)
const editingId = ref('')

const form = reactive({
  name: '',
  type: 'basic',
  price: 0,
  description: '',
  featuresText: ''
})

onMounted(() => {
  loadPackages()
})

async function loadPackages() {
  try {
    packages.value = await adminApi.getPackages()
  } catch (e) {
    console.error('加载套餐失败', e)
  }
}

function getTypeName(type: string) {
  const names: Record<string, string> = { free: '免费版', basic: '基础版', pro: '专业版', enterprise: '企业版' }
  return names[type] || type
}

function formatPrice(price: number) {
  return price > 0 ? `¥${price / 100}/月` : '免费'
}

function openModal() {
  editingId.value = ''
  resetForm()
  showModal.value = true
}

function editPackage(pkg: any) {
  editingId.value = pkg.id
  form.name = pkg.name
  form.type = pkg.type
  form.price = pkg.price / 100
  form.description = pkg.description || ''
  form.featuresText = (pkg.features || []).join('\n')
  showModal.value = true
}

async function toggleStatus(pkg: any) {
  const newStatus = pkg.status === 'active' ? 'inactive' : 'active'
  try {
    await adminApi.updatePackageStatus(pkg.id, newStatus)
    pkg.status = newStatus
  } catch (e) {
    alert('操作失败')
  }
}

async function deletePackage(pkg: any) {
  if (!confirm(`确定删除套餐"${pkg.name}"吗？`)) return
  try {
    await adminApi.deletePackage(pkg.id)
    loadPackages()
  } catch (e) {
    alert('删除失败')
  }
}

async function savePackage() {
  const data = {
    name: form.name,
    type: form.type,
    price: form.price * 100,
    description: form.description,
    features: form.featuresText.split('\n').filter(f => f.trim())
  }
  try {
    if (editingId.value) {
      await adminApi.updatePackage(editingId.value, data)
    } else {
      await adminApi.createPackage(data)
    }
    showModal.value = false
    loadPackages()
    resetForm()
  } catch (e) {
    alert('保存失败')
  }
}

function resetForm() {
  editingId.value = ''
  form.name = ''
  form.type = 'basic'
  form.price = 0
  form.description = ''
  form.featuresText = ''
}
</script>

<style scoped>
.packages-page { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-header h3 { margin: 0; }
.packages-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.package-card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.package-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.package-badge { padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 500; }
.badge-free { background: #f5f5f5; color: #666; }
.badge-basic { background: #e6f7ff; color: #1890ff; }
.badge-pro { background: #f6ffed; color: #52c41a; }
.badge-enterprise { background: #fff7e6; color: #fa8c16; }
.package-price { font-size: 20px; font-weight: 600; color: #52c41a; }
.package-name { margin: 0 0 8px; font-size: 18px; }
.package-desc { color: #666; font-size: 14px; margin-bottom: 16px; }
.package-features { list-style: none; padding: 0; margin: 0 0 16px; }
.package-features li { padding: 6px 0; font-size: 14px; color: #666; border-bottom: 1px solid #f0f0f0; }
.package-features li:last-child { border-bottom: none; }
.package-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid #eee; }
.package-status { font-size: 12px; }
.status-active { color: #52c41a; }
.status-inactive { color: #999; }
.package-actions { display: flex; gap: 8px; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: 12px; padding: 24px; width: 90%; max-width: 500px; }
.modal h3 { margin: 0 0 20px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; font-size: 14px; color: #666; }
.form-input { width: 100%; padding: 10px 12px; border: 1px solid #d9d9d9; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
.form-input:focus { outline: none; border-color: #1890ff; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
</style>
```

---

### Task 5: 初始化默认套餐数据

**Files:**
- Modify: `apps/backend/src/modules/admin/admin.service.ts`

**Step 1: 在 initSuperAdmin 方法中添加默认套餐初始化**

```typescript
async initSuperAdmin() {
  // ... 现有代码 ...

  // 初始化默认套餐
  const existingPackages = await this.packageRepository.count();
  if (existingPackages === 0) {
    const defaultPackages = [
      { name: '免费版', type: 'free', price: 0, description: '适合个人店主试用', features: ['基础客户管理', '最多50个客户', '基础预约功能'], status: 'active' },
      { name: '基础版', type: 'basic', price: 9900, description: '适合小型宠物店', features: ['无限客户管理', '套餐管理', '预约管理', '基础统计'], status: 'active' },
      { name: '专业版', type: 'pro', price: 29900, description: '适合成长型宠物店', features: ['基础版全部功能', '会员营销', '短信通知', '高级统计', '自定义服务'], status: 'active' },
      { name: '企业版', type: 'enterprise', price: 99900, description: '适合连锁宠物店', features: ['专业版全部功能', '多门店管理', '员工管理', 'API接口', '专属客服'], status: 'active' },
    ];
    for (const pkg of defaultPackages) {
      await this.packageRepository.save(this.packageRepository.create(pkg));
    }
  }
}
```

---

### Task 6: 测试验证

**Step 1: 重启后端服务**

```bash
cd apps/backend && pnpm start:dev
```

**Step 2: 调用初始化接口创建默认套餐**

```bash
curl -X POST http://localhost:3000/api/v1/admin/init
```

**Step 3: 验证前端**

访问 http://localhost:5173/packages
- 应该显示4个默认套餐卡片
- 可以新建、编辑、删除套餐
- 可以上下架套餐

---

**Plan complete. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
