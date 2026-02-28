# 宠联宝部署指南

## 架构概览

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ GitHub Pages │     │ 微信云托管    │     │  Supabase    │
│  (静态托管)   │     │  (后端API)    │     │  (数据库)    │
│              │     │              │     │              │
│ • H5 前端    │◄───►│ • NestJS    │◄───►│ • PostgreSQL │
│ • 管理后台   │     │ • 80端口    │     │ • 500MB免费  │
│ • 免费       │     │ • 按量付费   │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Upstash    │
                     │   (缓存)     │
                     │ • Redis     │
                     │ • 可选      │
                     └──────────────┘
```

## 一、准备工作

### 1.1 注册账号

| 平台 | 地址 | 用途 | 免费额度 |
|------|------|------|----------|
| GitHub | github.com | 代码托管 + 前端部署 | 免费 |
| Supabase | supabase.com | PostgreSQL 数据库 | 500MB |
| Upstash | upstash.com | Redis 缓存（可选） | 10,000请求/天 |
| Docker Hub | hub.docker.com | 镜像仓库 | 1个私有仓库 |
| 微信云托管 | cloud.weixin.qq.com | 后端容器 | 按量付费 |

### 1.2 获取微信小程序信息

登录 [微信公众平台](https://mp.weixin.qq.com)：
- AppID
- AppSecret

## 二、配置 Supabase

### 2.1 创建项目

1. 登录 Supabase 控制台
2. 点击「New Project」
3. 填写项目名称和数据库密码
4. 选择离用户最近的区域
5. 等待项目创建完成

### 2.2 获取连接信息

进入 Settings → Database：
- Host: `db.xxxxx.supabase.co`
- Port: `5432`
- User: `postgres`
- Password: 你设置的密码
- Database: `postgres`

### 2.3 配置连接池（推荐）

进入 Settings → Database → Connection pooling：
- 启用 Connection pooling
- 记录连接池信息

## 三、配置 Upstash（可选）

### 3.1 创建 Redis

1. 登录 Upstash 控制台
2. 创建 Redis 数据库
3. 记录：
   - Endpoint: `xxxxx.upstash.io`
   - Port: `6379`
   - Password

> 不配置 Redis 也能运行，会自动使用内存缓存。

## 四、配置 Docker Hub

### 4.1 创建仓库

1. 登录 Docker Hub
2. 创建仓库 `petlianbao`

### 4.2 创建 Access Token

Account Settings → Security → New Access Token

## 五、配置 GitHub

### 5.1 推送代码

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/petlianbao.git
git push -u origin main
```

### 5.2 配置 Secrets

进入仓库 Settings → Secrets and variables → Actions，添加：

| Secret 名称 | 说明 |
|-------------|------|
| `DOCKERHUB_USERNAME` | Docker Hub 用户名 |
| `DOCKERHUB_TOKEN` | Docker Hub Access Token |
| `API_BASE_URL` | 后端 API 地址，如 `https://xxx.run.tcloudbase.com/api/v1` |

### 5.3 启用 GitHub Pages

进入仓库 Settings → Pages：
- Source: GitHub Actions

## 六、部署后端到微信云托管

### 6.1 创建服务

1. 登录微信云托管控制台
2. 创建新服务
3. 选择「镜像拉取」方式
4. 填写 Docker Hub 镜像地址：`你的用户名/petlianbao:latest`

### 6.2 配置环境变量

```
DATABASE_HOST=db.xxxxx.supabase.co
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=你的Supabase密码
DATABASE_NAME=postgres
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false

REDIS_HOST=xxxxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=你的Upstash密码
REDIS_TLS=true

JWT_SECRET=生成一个随机字符串
JWT_EXPIRES_IN=7d

WECHAT_APP_ID=你的小程序AppID
WECHAT_APP_SECRET=你的小程序AppSecret

CORS_ORIGINS=https://你的用户名.github.io
PORT=80
NODE_ENV=production
```

### 6.3 配置规格

- CPU: 0.5核
- 内存: 512MB
- 最小实例: 0（省钱）
- 最大实例: 5

### 6.4 部署

点击部署，等待完成。

## 七、更新 API 地址

微信云托管部署完成后，获取服务地址，更新：

### 7.1 更新 GitHub Secret

更新 `API_BASE_URL` 为实际的服务地址。

### 7.2 手动触发前端部署

Actions → Deploy Frontend → Run workflow

## 八、访问地址

部署完成后：

| 服务 | 地址 |
|------|------|
| H5 预约 | `https://你的用户名.github.io/h5/` |
| 管理后台 | `https://你的用户名.github.io/admin/` |
| 后端 API | `https://你的微信云托管地址/api/v1` |

## 九、自动部署流程

```
推送代码到 main 分支
        ↓
 GitHub Actions 自动触发
        ↓
    ┌───┴───┐
    ↓       ↓
前端构建   后端构建
    ↓       ↓
部署到    推送到
Pages    Docker Hub
         ↓
      微信云托管
      手动更新镜像
```

## 十、常见问题

### Q: 前端访问显示空白
A: 检查 VITE_API_BASE_URL 是否配置正确

### Q: 后端数据库连接失败
A: 检查 Supabase 连接信息和 SSL 配置

### Q: CORS 错误
A: 确保后端 CORS_ORIGINS 包含前端域名

### Q: 微信登录失败
A: 检查 WECHAT_APP_ID 和 WECHAT_APP_SECRET

## 十一、费用估算

小规模使用（每月）：

| 服务 | 费用 |
|------|------|
| GitHub Pages | 免费 |
| Supabase | 免费 |
| Upstash | 免费 |
| Docker Hub | 免费 |
| 微信云托管 | 约 10-50 元（取决于流量） |

**总计：约 10-50 元/月**