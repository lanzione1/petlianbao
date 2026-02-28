# 宠联宝 (PetLianBao)

> 让专心服务宠物的你，轻松搞定生意。

小微宠物服务数字化工具箱与产业赋能平台

## 功能特性

- **智能预约日历** - 在线预约、自动微信提醒、防跑单
- **客户小账本** - 3秒建档、消费流水、智能标签
- **极速收银台** - 3步收银、多支付方式、日结报表
- **营销小喇叭** - 模板化海报、优惠券、自动唤醒
- **数据报表** - 日报、月报、客户分析、服务排行

## 技术栈

| 类型 | 技术 |
|------|------|
| 后端 | NestJS + TypeScript + MySQL/PostgreSQL + Redis |
| 商家端 | 原生微信小程序 |
| 客户端 | Vue3 + Vite (H5) |
| 部署 | Docker + Nginx + 腾讯云 |

## 项目结构

```
petlianbao/
├── apps/
│   ├── backend/           # NestJS 后端
│   ├── merchant-miniapp/  # 商家端小程序
│   ├── customer-h5/       # 客户预约 H5
│   └── admin-web/         # 管理后台 (Vue3)
├── packages/
│   ├── types/             # 共享类型
│   └── utils/             # 共享工具
├── docs/                  # 文档
├── deploy/                # 部署配置
└── .github/workflows/     # CI/CD
```

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8
- Docker & Docker Compose

### 安装依赖

```bash
npm install -g pnpm
pnpm install
```

### 启动开发环境

```bash
# 1. 启动数据库
docker-compose up -d

# 2. 配置环境变量
cp apps/backend/.env.example apps/backend/.env

# 3. 启动后端
pnpm dev:backend

# 4. 启动管理后台 (新终端)
pnpm dev:admin

# 5. 启动H5 (新终端)
pnpm dev:h5

# 6. 小程序：用微信开发者工具打开 apps/merchant-miniapp
```

### 访问地址

| 服务 | 地址 |
|------|------|
| 后端 API | http://localhost:3000/api/v1 |
| 管理后台 | http://localhost:5174 |
| H5 预约 | http://localhost:5173 |

## API 文档

详见 [API.md](./docs/API.md)

## 部署

### 生产环境部署

```bash
cd deploy
cp .env.example .env
# 编辑 .env 填写配置
./deploy.sh
```

### Docker Compose

```bash
docker-compose -f deploy/docker-compose.prod.yml up -d
```

## 开发进度

- [x] Phase 1: 基础搭建
- [x] Phase 2: 预约模块
- [x] Phase 3: 客户+收银模块
- [x] Phase 4: 营销+报表模块
- [x] Phase 5: 部署配置

## 文档

- [技术设计文档](docs/plans/2026-02-20-petlianbao-design.md)
- [API 文档](docs/API.md)
- [实施计划](docs/plans/)

## License

Private - All rights reserved
