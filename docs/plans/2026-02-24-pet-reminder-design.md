# 宠物关键日期提醒功能设计

## 概述

支持店主筛选生日、疫苗、驱虫即将到期的宠物，一键发送祝福/提醒消息。

## 功能设计

### 1. 提醒查询API

**API**: `GET /pets/reminders`

**参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | 筛选类型：birthday/vaccine/deworm/all |
| days | number | 到期天数：1/3/7 |

**响应**:
```json
{
  "pets": [
    {
      "id": "xxx",
      "name": "旺财",
      "breed": "金毛",
      "customerPhone": "13800138000",
      "type": "birthday", // 或 vaccine/deworm
      "date": "2024-03-15",
      "daysLeft": 3
    }
  ]
}
```

### 2. 消息发送API

**API**: `POST /pets/reminders/send`

**参数**:
```json
{
  "petIds": ["xxx"],
  "type": "birthday", // birthday/vaccine/deworm
  "message": "自定义消息内容"
}
```

### 3. 消息模板管理

**API**:
- `GET /pets/reminders/templates` - 获取模板
- `PUT /pets/reminders/templates` - 更新模板

**默认模板**:
```json
{
  "birthday": "尊敬的客户，祝您家{petName}生日快乐！🎂",
  "vaccine": "您好，您家{petName}的疫苗即将到期，请及时接种💉",
  "deworm": "您好，您家{petName}的驱虫即将到期，请及时驱虫🐛"
}
```

## 页面设计

### 1. 首页快捷入口

在首页增加"宠物提醒"角标，显示待提醒数量

### 2. 宠物提醒页面

```
宠物提醒
├── 标签筛选：全部 | 生日 | 疫苗 | 驱虫
├── 到期范围：7天 | 3天 | 1天
├── 提醒列表
│   ├── 宠物信息（名字、品种）
│   ├── 客户信息（手机号）
│   ├── 提醒类型和到期日
│   └── 发送状态
├── 底部操作栏
│   ├── 全选
│   ├── 发送祝福/提醒
│   └── 编辑模板
└── 模板编辑弹窗
```

## 数据库设计

### ReminderTemplate Entity

```typescript
@Entity('reminder_templates')
export class ReminderTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({ name: 'birthday_template', type: 'text' })
  birthdayTemplate: string;

  @Column({ name: 'vaccine_template', type: 'text' })
  vaccineTemplate: string;

  @Column({ name: 'deworm_template', type: 'text' })
  dewormTemplate: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

## 实现步骤

1. 创建 ReminderTemplate 实体
2. 添加提醒查询API（按类型和天数筛选）
3. 添加消息发送API（预留实现）
4. 添加模板管理API
5. 首页添加提醒入口和角标
6. 创建宠物提醒页面
7. 创建模板编辑功能
