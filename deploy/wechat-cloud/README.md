# 微信云托管 + Supabase 部署指南

本指南帮助你将宠联宝后端部署到微信云托管，使用 Supabase 作为 PostgreSQL 数据库。

## 前置准备

### 1. 注册 Supabase (免费)

1. 访问 [supabase.com](https://supabase.com) 注册账号
2. 创建新项目
3. 记录以下信息：
   - 项目 URL: `db.xxxxx.supabase.co`
   - 数据库密码（创建时设置）

### 2. 注册 Upstash Redis (可选，免费)

1. 访问 [upstash.com](https://upstash.com) 注册账号
2. 创建 Redis 数据库
3. 记录：
   - Endpoint: `xxxxx.upstash.io`
   - Password

> 不配置 Redis 也可以运行，会自动使用内存缓存

### 3. 准备微信小程序

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 获取小程序 AppID 和 AppSecret

## 部署步骤

### 第一步：初始化数据库

1. 进入 Supabase 控制台 -> SQL Editor
2. 运行数据库迁移（或使用同步模式自动创建表）

### 第二步：微信云托管配置

1. 登录 [微信云托管控制台](https://cloud.weixin.qq.com/)
2. 创建新服务
3. 选择「通过 Dockerfile 构建」
4. 上传代码或关联 Git 仓库

#### 构建配置
- **Dockerfile 路径**: `deploy/wechat-cloud/Dockerfile`
- **构建上下文**: 项目根目录

### 第三步：配置环境变量

在微信云托管服务设置中添加环境变量：

```
DATABASE_HOST=db.xxxxx.supabase.co
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=你的Supabase数据库密码
DATABASE_NAME=postgres
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false

REDIS_HOST=xxxxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=你的Upstash密码
REDIS_TLS=true

JWT_SECRET=生成一个强密码
JWT_EXPIRES_IN=7d

WECHAT_APP_ID=你的小程序AppID
WECHAT_APP_SECRET=你的小程序AppSecret

CORS_ORIGINS=https://你的H5域名,https://你的管理后台域名
PORT=80
NODE_ENV=production
```

### 第四步：部署

点击「部署」按钮，等待构建完成。

### 第五步：验证

访问 `{服务地址}/api/v1/health` 确认服务正常。

## 小程序配置

修改 `apps/merchant-miniapp/utils/api.js`：

```javascript
// 将 localhost 改为微信云托管服务地址
const API_BASE_URL = 'https://your-service-url/api/v1';
```

## H5 和管理后台配置

修改相应的 API 地址配置文件。

## 常见问题

### Q: 数据库连接失败
A: 检查 Supabase 的连接字符串，确保 SSL 设置正确

### Q: Redis 连接失败
A: Upstash 需要 TLS 连接，确保 `REDIS_TLS=true`。如果暂时不需要缓存，可以不配置 Redis

### Q: 微信登录失败
A: 确保 WECHAT_APP_ID 和 WECHAT_APP_SECRET 配置正确

## 费用说明

- **Supabase**: 免费 500MB 数据库 + 1GB 文件存储
- **Upstash**: 免费 10,000 请求/天
- **微信云托管**: 
  - 按量付费，小流量场景费用很低
  - 设置最小实例为 0 可以节省费用（冷启动约 3-5 秒）

## 配置文件说明

```
deploy/wechat-cloud/
├── Dockerfile          # 微信云托管专用 Dockerfile
├── cloudbaserc.json    # 微信云托管配置
└── .env.example        # 环境变量模板
```