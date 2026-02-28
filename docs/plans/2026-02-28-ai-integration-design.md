# 宠联宝 AI 集成设计方案

> 创建时间：2026-02-28
> 状态：待实施（等核心业务功能完善后启动）

## 一、项目背景

### 1.1 AI 集成目标

让宠联宝具备 AI Agent 能力，实现：
- **智能预约助手**：商家通过自然语言完成预约操作
- **经营数据洞察**：商家查询经营数据，获取 AI 洞察建议
- **H5 智能客服**：C 端客户自助咨询

### 1.2 实施策略

**先完善核心业务功能，再集成 AI**

理由：
1. AI Tools 需要调用完善的业务服务
2. AI 是"增强"，不是"基础"，用户先能用起来是第一位
3. 业务不完善，AI 能力也受限

## 二、技术选型

### 2.1 Agent 框架：Mastra

选择理由：
- 开源免费（Apache 2.0）
- 支持 2594 个模型，87 个提供商
- 原生支持 DeepSeek、通义千问等国产模型
- 内置 Memory、Workflow、Tools 机制
- TypeScript 原生，与 NestJS 无缝集成

GitHub: https://github.com/mastra-ai/mastra

### 2.2 模型选择

| 模型 | 费用 | 说明 |
|------|------|------|
| DeepSeek V3 | ¥1/百万 token | 主力模型，性价比最高 |
| 通义千问 | 阿里云定价 | 备用模型，微信生态集成方便 |

### 2.3 费用说明

- **Mastra 框架**：免费
- **模型费用**：直接付给模型商，无中间溢价
- **存储**：共享现有 PostgreSQL，无额外成本
- **预估日成本**：100 商家 × 20 对话 ≈ ¥1-2/天

## 三、技术架构

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                   NestJS 单体应用架构                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   微信小程序 ──┐                                                │
│                │     ┌──────────────────┐     ┌─────────────────┐│
│   H5 客户端 ───┼────▶│   NestJS API     │────▶│  AI Module      ││
│                │     │   (现有业务)      │     │  (Mastra)       ││
│   后台管理 ────┘     └──────────────────┘     └─────────────────┘│
│                              │                       │          │
│                              ▼                       ▼          │
│                        PostgreSQL              DeepSeek/通义千问│
│                        (共享数据库)                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 AI 模块架构

```
apps/backend/src/modules/ai/
├── ai.module.ts                    # NestJS 模块
├── ai.controller.ts                # API 控制器
├── ai.service.ts                   # AI 服务
│
├── mastra/                         # Mastra 配置
│   ├── index.ts                    # Mastra 实例导出
│   └── storage.ts                  # PostgreSQL 存储配置
│
├── agents/                         # Agent 定义
│   ├── index.ts                    # 导出所有 agents
│   ├── appointment.agent.ts        # 智能预约助手
│   └── insight.agent.ts            # 经营数据洞察
│
├── tools/                          # AI 工具
│   ├── index.ts                    # 导出所有 tools
│   ├── appointment.tools.ts        # 预约相关工具
│   ├── customer.tools.ts           # 客户相关工具
│   └── report.tools.ts             # 报表相关工具
│
├── prompts/                        # 提示词
│   └── system-prompts.ts           # 系统提示词模板
│
└── dto/
    ├── chat.dto.ts                 # 对话请求 DTO
    └── response.dto.ts             # 响应 DTO
```

## 四、AI 场景设计

### 4.1 智能预约助手（优先级最高）

**入口**：小程序首页「AI 助手」悬浮按钮

**能力矩阵**：

| Tool 名称 | 功能 | 输入 | 输出 |
|-----------|------|------|------|
| create_appointment | 创建预约 | 客户名/宠物名/服务/时间 | 预约确认卡片 |
| query_appointments | 查询预约 | 日期范围/状态 | 预约列表 |
| reschedule_appointment | 改期预约 | 预约 ID/新时间 | 更新结果 |
| cancel_appointment | 取消预约 | 预约 ID/原因 | 取消结果 |
| check_availability | 检查空闲 | 日期/服务 | 可用时段 |
| search_customer | 搜索客户 | 姓名/电话/宠物名 | 客户列表 |

**对话示例**：

商家: "小王的泰迪周三下午洗澡，大概3点"
AI: 已为「小王 - 泰迪」创建预约：
    服务：洗澡
    时间：周三（3月5日）15:00
    [确认] [修改]

### 4.2 经营数据洞察

**入口**：首页「AI 洞察」卡片

**能力矩阵**：

| Tool 名称 | 功能 | 输入 | 输出 |
|-----------|------|------|------|
| get_business_overview | 经营概览 | 时间范围 | 收入/订单/客户数据 |
| analyze_customer_trend | 客户趋势 | 时间范围 | 新客/回头客/流失分析 |
| get_service_ranking | 服务排行 | 时间范围 | 热门服务排行 |
| find_inactive_customers | 流失客户 | 天数阈值 | 流失客户列表 |
| get_revenue_trend | 收入趋势 | 时间范围 | 收入变化曲线 |

### 4.3 H5 智能客服

**入口**：H5 预约页面右下角「智能客服」按钮

**能力矩阵**：

| Tool 名称 | 功能 | 输入 | 输出 |
|-----------|------|------|------|
| get_service_list | 服务列表 | 无 | 服务项目及价格 |
| check_available_slots | 可预约时间 | 日期/服务 | 可用时段 |
| get_shop_info | 店铺信息 | 无 | 营业时间/地址 |
| query_appointment_status | 预约状态 | 手机号后4位 | 预约状态 |
| answer_faq | 常见问题 | 问题类型 | 标准答案 |

## 五、语音输入方案

### 5.1 技术方案

```
微信小程序
     │
     ▼
┌─────────────┐     ┌─────────────────────────────────────┐
│ wx.getRecor │     │         后端 API                     │
│ derManager  │────▶│  POST /api/v1/ai/speech-to-text     │
└─────────────┘     └──────────────┬──────────────────────┘
     录制音频                        │
     获取临时文件                     ▼
                     ┌─────────────────────────────┐
                     │    微信同声传译 API          │
                     │    (微信内置支持，免费)      │
                     └──────────────┬──────────────┘
                                    │
                                    ▼
                            返回文字 + 传入 Agent
```

## 六、依赖安装

pnpm add @mastra/core @mastra/memory @mastra/pg zod

## 七、配置更新

### 7.1 环境变量

AI_ENABLED=true
DEEPSEEK_API_KEY=sk-xxx
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
QWEN_API_KEY=sk-xxx
AI_PRIMARY_MODEL=deepseek/deepseek-chat

### 7.2 configuration.ts 新增

ai: {
  enabled: process.env.AI_ENABLED === 'true',
  deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
  qwenApiKey: process.env.QWEN_API_KEY,
  primaryModel: process.env.AI_PRIMARY_MODEL || 'deepseek/deepseek-chat',
}

## 八、API 设计

POST /api/v1/ai/chat           # 对话
POST /api/v1/ai/stream         # 流式对话（SSE）
POST /api/v1/ai/speech-to-text # 语音转文字
GET  /api/v1/ai/threads/:id    # 获取对话历史

## 九、实施计划

### 9.1 前置条件

核心业务功能完善：
- 预约管理
- 客户管理
- 收银/会员卡
- 报表/营销

### 9.2 实施阶段

| 阶段 | 时间 | 内容 |
|------|------|------|
| Phase 1 | Week 1 | AI 模块基础设施、Mastra 集成 |
| Phase 2 | Week 2-3 | 智能预约 Agent、Tools 实现 |
| Phase 3 | Week 4 | 语音输入支持 |
| Phase 4 | Week 5 | 小程序对话组件、前端集成 |
| Phase 5 | Week 6 | 经营洞察 Agent、优化上线 |

## 十、风险与应对

| 风险 | 应对 |
|------|------|
| API 调用延迟 | 流式响应 + 缓存热门问题 |
| Token 成本 | DeepSeek 低成本 + 配额限制 |
| 模型回答不准确 | 工具结果验证 + 人工确认 |
| 并发压力大 | Redis 队列 + 异步处理 |

## 十一、参考资源

- Mastra 官网：https://mastra.ai
- Mastra GitHub：https://github.com/mastra-ai/mastra
- Mastra 文档：https://mastra.ai/docs
- DeepSeek API：https://platform.deepseek.com
- 通义千问 API：https://dashscope.aliyun.com

---

## 附录：CloudBase MCP 说明

腾讯云 CloudBase MCP 是 AI 辅助开发工具，用于：
- AI IDE 中操作腾讯云资源
- 一键部署应用
- 不是 Agent 运行时框架

与 Mastra 的关系：
- **CloudBase MCP** = 开发阶段 AI 助手（帮你写代码、部署）
- **Mastra** = 运行时 AI Agent 框架（让你的应用智能化）

两者可以组合使用，但 CloudBase MCP 不能替代 Mastra 的 Agent 功能。
