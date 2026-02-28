# 宠物档案功能设计

## 概述

为每个客户建立宠物档案，支持一个客户关联多只宠物，记录宠物详细信息用于服务参考和营销提醒。

## 数据模型

### Pet Entity

```typescript
@Entity('pets')
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'name', length: 50 })
  name: string;

  @Column({ name: 'species', length: 20 })
  species: 'dog' | 'cat' | 'other';

  @Column({ name: 'breed', length: 50 })
  breed: string;

  @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  weight: number;

  @Column({ name: 'birthday', type: 'date', nullable: true })
  birthday: Date;

  @Column({ name: 'feeding', type: 'text', nullable: true })
  feeding: string;

  @Column({ name: 'allergy', type: 'text', nullable: true })
  allergy: string;

  @Column({ name: 'behavior', type: 'text', nullable: true })
  behavior: string;

  @Column({ name: 'photo', length: 255, nullable: true })
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

## API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /pets/:customerId | 获取客户的所有宠物 |
| POST | /pets | 添加宠物 |
| GET | /pets/:id | 获取宠物详情 |
| PUT | /pets/:id | 更新宠物信息 |
| DELETE | /pets/:id | 删除宠物 |

## 页面设计

### 1. 客户详情页改造

在现有客户详情页添加"宠物档案"入口：

```
客户详情
├── 基本信息（宠物名、品种、手机）
├── 消费记录
├── 预约记录
└── 宠物档案 ← 新增
```

### 2. 宠物列表页

- 展示该客户所有宠物
- 显示宠物头像、名字、品种
- 添加/编辑/删除宠物

### 3. 宠物详情/编辑页

表单字段：
- 名字 *（必填）
- 物种 *（猫/狗/其他）
- 品种 *（必填）
- 体重 *（必填，kg）
- 生日
- 饮食习惯
- 过敏史
- 行为特点
- 照片
- 备注
- 下次疫苗日期
- 下次驱虫日期

## 现有数据迁移

为每个现有客户自动创建一条宠物记录：
- name = 原 petName
- species = 根据品种智能判断（狗/猫/其他）
- breed = 原 petBreed
- weight = null

## 待实现功能（可选）

1. **服务提醒**：疫苗/驱虫到期前3天提醒
2. **生日祝福**：生日前1天提醒
3. **群发通知**：按宠物类型筛选客户

## 实现步骤

1. 创建 Pet Entity
2. 创建 Pet Module/Service/Controller
3. 修改客户详情页，添加宠物入口
4. 创建宠物列表页面
5. 创建宠物编辑页面
6. 数据迁移脚本
7. 添加操作日志记录
