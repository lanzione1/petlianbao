# 微信云托管部署指南

本指南帮助你将宠联宝后端部署到微信云托管，使用微信云托管自带的 MySQL 数据库。

## 前置准备

### 1. 准备微信小程序

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 获取小程序 AppID 和 AppSecret

### 2. 注册 Upstash Redis (可选，免费)

1. 访问 [upstash.com](https://upstash.com) 注册账号
2. 创建 Redis 数据库
3. 记录：
   - Endpoint: `xxxxx.upstash.io`
   - Password

> 不配置 Redis 也可以运行，会自动使用内存缓存

## 部署步骤

### 第一步：微信云托管创建服务

1. 登录 [微信云托管控制台](https://cloud.weixin.qq.com/)
2. 创建新服务
3. 选择「通过 Dockerfile 构建」
4. 上传代码或关联 Git 仓库

#### 构建配置
- **Dockerfile 路径**: `deploy/wechat-cloud/Dockerfile`
- **构建上下文**: 项目根目录

### 第二步：创建 MySQL 数据库

1. 在微信云托管控制台，进入「数据库」
2. 创建 MySQL 数据库
3. 记录数据库连接信息：
   - 主机地址
   - 端口 (默认 3306)
   - 用户名 (root)
   - 密码
   - 数据库名

### 第三步：配置环境变量

在微信云托管服务设置中添加环境变量：

```
# 数据库配置 (微信云托管 MySQL)
DATABASE_TYPE=mysql
DATABASE_HOST=your-mysql-host.mysql.ap-shanghai.run.tcloudbase.com
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=你的MySQL密码
DATABASE_NAME=petlianbao

# Redis 配置 (可选，使用 Upstash)
REDIS_HOST=xxxxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=你的Upstash密码
REDIS_TLS=true

# JWT 配置
JWT_SECRET=生成一个强密码
JWT_EXPIRES_IN=7d

# 微信小程序配置
WECHAT_APP_ID=你的小程序AppID
WECHAT_APP_SECRET=你的小程序AppSecret

# CORS 配置
CORS_ORIGINS=https://你的H5域名,https://你的管理后台域名

# 服务配置
PORT=80
NODE_ENV=production
```

### 第四步：部署

点击「部署」按钮，等待构建完成。

首次部署时，TypeORM 会自动创建所有数据表（synchronize: true）。

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
A: 
1. 确认 MySQL 数据库已创建
2. 检查环境变量中的连接信息是否正确
3. 确认 DATABASE_TYPE 设置为 mysql

### Q: Redis 连接失败
A: Upstash 需要 TLS 连接，确保 `REDIS_TLS=true`。如果暂时不需要缓存，可以不配置 Redis

### Q: 微信登录失败
A: 确保 WECHAT_APP_ID 和 WECHAT_APP_SECRET 配置正确

### Q: 想切换回 PostgreSQL
A: 修改环境变量：
```
DATABASE_TYPE=postgres
DATABASE_HOST=db.xxxxx.supabase.co
DATABASE_PORT=5432
DATABASE_SSL=true
```

## 费用说明

- **微信云托管 MySQL**: 按量付费，有免费额度
- **Upstash Redis**: 免费 10,000 请求/天
- **微信云托管容器**: 
  - 按量付费，小流量场景费用很低
  - 设置最小实例为 0 可以节省费用（冷启动约 3-5 秒）

## 配置文件说明

```
deploy/wechat-cloud/
├── Dockerfile          # 微信云托管专用 Dockerfile
├── cloudbaserc.json    # 微信云托管配置
└── .env.example        # 环境变量模板
```

## 数据库兼容性

本项目支持 MySQL 和 PostgreSQL 双数据库：

| 特性 | MySQL | PostgreSQL |
|------|-------|------------|
| JSON 类型 | json | json/jsonb |
| UUID | 通过 CHAR(36) | 原生支持 |
| 全文搜索 | 支持 | 支持 |
| 适用场景 | 微信云托管 | Supabase 等 |

通过 `DATABASE_TYPE` 环境变量切换。