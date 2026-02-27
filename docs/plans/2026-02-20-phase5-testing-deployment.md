# Phase 5: 测试与上线 - 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成功能测试、性能优化、安全审计、小程序审核、正式上线

**Tech Stack:** Jest + 微信开发者工具 + 腾讯云

---

## Step 1: 测试环境搭建

**Files:**
- Create: `apps/backend/jest.config.js`
- Create: `apps/backend/test/app.e2e-spec.ts`
- Create: `apps/backend/test/jest-e2e.json`

**Step 1: 创建 Jest 配置**

```bash
cat > apps/backend/jest.config.js << 'EOF'
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
EOF

cat > apps/backend/test/jest-e2e.json << 'EOF'
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
EOF

cat > apps/backend/test/app.e2e-spec.ts << 'EOF'
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    it('/api/v1/auth/wechat/login (POST) - should login with wechat code', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/wechat/login')
        .send({ code: 'test_code' })
        .expect(201);
    });
  });

  describe('Services', () => {
    let token: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/wechat/login')
        .send({ code: 'test_code' });
      token = response.body.access_token;
    });

    it('/api/v1/services (GET) - should get services list', () => {
      return request(app.getHttpServer())
        .get('/api/v1/services')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('/api/v1/services (POST) - should create service', () => {
      return request(app.getHttpServer())
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '洗澡',
          price: 68,
          duration: 60,
        })
        .expect(201);
    });
  });

  describe('Appointments', () => {
    let token: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/wechat/login')
        .send({ code: 'test_code' });
      token = response.body.access_token;
    });

    it('/api/v1/appointments (GET) - should get appointments', () => {
      return request(app.getHttpServer())
        .get('/api/v1/appointments')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('/api/v1/appointments/today (GET) - should get today appointments', () => {
      return request(app.getHttpServer())
        .get('/api/v1/appointments/today')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('Customers', () => {
    let token: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/wechat/login')
        .send({ code: 'test_code' });
      token = response.body.access_token;
    });

    it('/api/v1/customers (GET) - should get customers list', () => {
      return request(app.getHttpServer())
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  describe('Billing', () => {
    let token: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/wechat/login')
        .send({ code: 'test_code' });
      token = response.body.access_token;
    });

    it('/api/v1/billing/today (GET) - should get today transactions', () => {
      return request(app.getHttpServer())
        .get('/api/v1/billing/today')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('/api/v1/billing/daily-summary (GET) - should get daily summary', () => {
      return request(app.getHttpServer())
        .get('/api/v1/billing/daily-summary')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });
});
EOF
```

**Step 2: 添加测试脚本**

```bash
# 更新 package.json 添加测试脚本
cat > apps/backend/package.json << 'EOF'
{
  "name": "@petlianbao/backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "nest start",
    "lint": "eslint \"src/**/*.ts\" --fix",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "typeorm": "typeorm-ts-node-commonjs",
    "migration:generate": "pnpm typeorm migration:generate -d src/config/data-source.ts",
    "migration:run": "pnpm typeorm migration:run -d src/config/data-source.ts"
  }
}
EOF
```

**Step 3: Commit**

```bash
git add .
git commit - "test: 添加测试配置"
```

---

## Step 2: 性能优化

**Files:**
- Modify: `apps/backend/src/main.ts` (添加缓存和限流)
- Create: `apps/backend/src/common/filters/http-exception.filter.ts`

**Step 1: 添加性能优化中间件**

```bash
# 安装限流和缓存包
cd apps/backend
pnpm add @nestjs/throttler cache-manager cache-manager-redis-store

cat > apps/backend/src/main.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppModule } from './app.module';
import { configuration } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api/v1');
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 限流配置
  app.useGlobalGuards(
    new ThrottlerModule.register([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
  );

  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  });

  const port = configuration().port || 3000;
  await app.listen(port);
  
  console.log(`应用运行在: http://localhost:${port}`);
}

bootstrap();
EOF
```

**Step 2: 添加全局异常过滤器**

```bash
mkdir -p apps/backend/src/common/filters

cat > apps/backend/src/common/filters/http-exception.filter.ts << 'EOF'
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message || message;
    }

    response.status(status).json({
      code: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
EOF

# 更新 main.ts 使用异常过滤器
cat > apps/backend/src/main.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { configuration } from './config/configuration';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api/v1');
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  });

  const port = configuration().port || 3000;
  await app.listen(port);
  
  console.log(`应用运行在: http://localhost:${port}`);
}

bootstrap();
EOF
```

**Step 3: Commit**

```bash
git add .
git commit - "perf: 添加性能优化和异常处理"
```

---

## Step 3: 安全审计

**Files:**
- Create: `apps/backend/.env.production.example`
- Create: `docker-compose.prod.yml`

**Step 1: 创建生产环境配置示例**

```bash
cat > apps/backend/.env.production.example << 'EOF'
# Database
DATABASE_HOST=your-rds-endpoint
DATABASE_PORT=5432
DATABASE_USER=petlianbao
DATABASE_PASSWORD=strong-password-here
DATABASE_NAME=petlianbao

# Redis
REDIS_HOST=your-redis-endpoint
REDIS_PORT=6379

# JWT
JWT_SECRET=super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# WeChat
WECHAT_APP_ID=your-wechat-app-id
WECHAT_APP_SECRET=your-wechat-app-secret
WECHAT_TEMPLATE_ID=your-template-id

# Server
PORT=3000
NODE_ENV=production
EOF
```

**Step 2: 创建生产环境 Docker Compose**

```bash
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - apps/backend/.env
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: petlianbao
      POSTGRES_USER: petlianbao
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_prod_data:/data
    restart: unless-stopped

volumes:
  postgres_prod_data:
  redis_prod_data:
EOF
```

**Step 3: 创建 Dockerfile**

```bash
mkdir -p apps/backend
cat > apps/backend/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["node", "dist/main"]
EOF
```

**Step 4: Commit**

```bash
git add .
git commit - "chore: 添加生产环境配置和Dockerfile"
```

---

## Step 4: 小程序审核准备

**Files:**
- Create: `apps/merchant-miniapp/project.config.json`
- Create: `apps/merchant-miniapp/sitemap.json`
- Create: `apps/merchant-miniapp/app.js` (完整版本)

**Step 1: 配置小程序项目**

```bash
cat > apps/merchant-miniapp/project.config.json << 'EOF'
{
  "description": "宠联宝商家端小程序",
  "packOptions": {
    "ignore": []
  },
  "setting": {
    "bundle": false,
    "userConfirmedBundleSwitch": false,
    "urlCheck": true,
    "scopeDataCheck": false,
    "coverView": true,
    "es6": true,
    "postcss": true,
    "compileHotReLoad": false,
    "lazyloadPlaceholderEnable": false,
    "preloadBackgroundData": false,
    "minified": true,
    "autoAudits": false,
    "newFeature": false,
    "uglifyFileName": false,
    "uploadWithSourceMap": true,
    "useIsolateContext": true,
    "nodeModules": false,
    "enhance": true,
    "useMultiFrameRuntime": true,
    "showShadowRootInWxmlPanel": true,
    "packNpmManually": false,
    "enableEngineNative": false,
    "packNpmRelationList": [],
    "minifyWXSS": true,
    "showES6CompileOption": false,
    "minifyWXML": true,
    "babelSetting": {
      "ignore": [],
      "disablePlugins": [],
      "outputPath": ""
    }
  },
  "compileType": "miniprogram",
  "libVersion": "2.19.4",
  "appid": "your-appid-here",
  "projectname": "petlianbao-merchant",
  "condition": {}
}
EOF

cat > apps/merchant-miniapp/sitemap.json << 'EOF'
{
  "desc": "关于本文件的更多信息，请参考文档 https://developers.weixin.qq.com/miniprogram/dev/framework/sitemap.html",
  "rules": [{
    "action": "allow",
    "page": "*"
  }]
}
EOF
```

**Step 2: 更新 app.js 完整版本**

```bash
cat > apps/merchant-miniapp/app.js << 'EOF'
App({
  globalData: {
    userInfo: null,
    token: null,
    apiBase: 'https://api.petlianbao.com/api/v1',
    merchantId: null
  },
  
  onLaunch() {
    this.checkLogin()
  },

  checkLogin() {
    const token = wx.getStorageSync('token')
    const merchantId = wx.getStorageSync('merchantId')
    if (token) {
      this.globalData.token = token
      this.globalData.merchantId = merchantId
    }
  },

  login(code) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.apiBase}/auth/wechat/login`,
        method: 'POST',
        data: { code },
        success: (res) => {
          if (res.data.code === 0) {
            const { access_token, merchant } = res.data.data
            this.globalData.token = access_token
            this.globalData.merchantId = merchant.id
            wx.setStorageSync('token', access_token)
            wx.setStorageSync('merchantId', merchant.id)
            resolve(res.data.data)
          } else {
            reject(new Error(res.data.message))
          }
        },
        fail: reject
      })
    })
  }
})
EOF
```

**Step 3: 准备审核材料**

```markdown
# 小程序审核材料

## 类目选择
- 商家自营 (需要营业执照)

## 所需资质
1. 营业执照
2. 宠物服务相关经营许可

## 功能页面说明
1. 首页/预约看板 - 展示今日预约列表
2. 客户管理 - 管理客户档案
3. 收银台 - 快速收款
4. 营销工具 - 发送优惠券
5. 我的 - 商家设置

## 隐私政策
需要添加隐私政策页面: /pages/mine/privacy
```

**Step 4: Commit**

```bash
git add .
git commit - "chore: 准备小程序审核材料"
```

---

## Step 5: 部署上线

**Step 1: 购买腾讯云资源**

```
1. CVM 云服务器 (2核4G) - ~100元/月
2. PostgreSQL 云数据库 (1核2G) - ~80元/月
3. Redis 云缓存 - ~50元/月
4. COS 对象存储 - ~10元/月
5. 域名 + SSL证书 - ~100元/年
```

**Step 2: 部署后端**

```bash
# 1. 克隆代码到服务器
git clone your-repo-url /var/www/petlianbao

# 2. 安装依赖
cd /var/www/petlianbao
pnpm install

# 3. 配置环境变量
cp apps/backend/.env.production.example apps/backend/.env
vim apps/backend/.env  # 编辑配置

# 4. 构建
pnpm build

# 5. 使用 PM2 启动
pnpm add -g pm2
pm2 start apps/backend/dist/main.js --name petlianbao

# 6. 配置 Nginx
sudo vim /etc/nginx/sites-available/petlianbao
```

**Step 3: 提交小程序审核**

1. 登录微信公众平台
2. 上传小程序代码
3. 填写审核信息
4. 提交审核

**Step 4: 验证上线**

```bash
# API 健康检查
curl https://api.petlianbao.com/api/v1/health

# 小程序可用性检查
# 在微信开发者工具中预览
```

---

## Step 6: 上线检查清单

**功能检查:**
- [ ] 微信登录正常
- [ ] 服务项目 CRUD 正常
- [ ] 预约创建/查看/修改正常
- [ ] 客户创建/查看/编辑正常
- [ ] 收银台正常
- [ ] 日结报表正常
- [ ] 营销工具正常
- [ ] 数据报表正常

**性能检查:**
- [ ] API 响应时间 < 500ms
- [ ] 小程序页面加载 < 2s
- [ ] 无内存泄漏

**安全检查:**
- [ ] JWT 认证正常
- [ ] 接口限流正常
- [ ] SQL 注入防护正常
- [ ] XSS 防护正常

---

## 验收标准

- [ ] 所有单元测试通过
- [ ] E2E 测试通过
- [ ] 性能符合要求
- [ ] 安全审计通过
- [ ] 小程序审核通过
- [ ] 生产环境部署完成
- [ ] 上线验证通过
