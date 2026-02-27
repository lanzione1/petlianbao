# Phase 1: 基础搭建 - 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 搭建完整的项目框架，包括NestJS后端、微信小程序开发环境、数据库设计

**Architecture:** Monorepo结构，使用pnpm workspaces管理三个应用

**Tech Stack:** NestJS + TypeScript + PostgreSQL + 微信小程序 + Docker

---

## Step 1: 创建项目结构

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `apps/backend/package.json`
- Create: `apps/merchant-miniapp/package.json`
- Create: `apps/customer-h5/package.json`

**Step 1: 创建根目录配置文件**

```bash
# 创建目录结构
mkdir -p apps/backend/src/modules
mkdir -p apps/backend/src/common
mkdir -p apps/merchant-miniapp/pages
mkdir -p apps/merchant-miniapp/components
mkdir -p apps/merchant-miniapp/utils
mkdir -p apps/customer-h5/src/pages
mkdir -p apps/customer-h5/src/components
mkdir -p packages/types
mkdir -p packages/utils
mkdir -p docs/plans

# 创建 pnpm-workspace.yaml
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF

# 创建根 package.json
cat > package.json << 'EOF'
{
  "name": "petlianbao",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev:backend": "pnpm --filter @petlianbao/backend dev",
    "dev:miniapp": "pnpm --filter @petlianbao/merchant-miniapp dev",
    "dev:h5": "pnpm --filter @petlianbao/customer-h5 dev",
    "build:backend": "pnpm --filter @petlianbao/backend build",
    "build:all": "pnpm -r build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
EOF
```

**Step 2: 创建后端 package.json**

```bash
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
    "typeorm": "typeorm-ts-node-commonjs",
    "migration:generate": "pnpm typeorm migration:generate -d src/config/data-source.ts",
    "migration:run": "pnpm typeorm migration:run -d src/config/data-source.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "typeorm": "^0.3.17",
    "pg": "^8.11.0",
    "redis": "^4.6.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "bcrypt": "^5.1.0",
    "axios": "^1.6.0",
    "uuid": "^9.0.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.17",
    "@types/node": "^20.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/uuid": "^9.0.0",
    "typescript": "^5.1.0",
    "ts-node": "^10.9.1",
    "eslint": "^8.42.0",
    "@typescript-eslint/eslint-plugin": "^5.59.0",
    "@typescript-eslint/parser": "^5.59.0"
  }
}
EOF
```

**Step 3: 创建小程序 package.json**

```bash
cat > apps/merchant-miniapp/package.json << 'EOF'
{
  "name": "@petlianbao/merchant-miniapp",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "echo '使用微信开发者工具打开'",
    "build": "echo '使用微信开发者工具构建'"
  },
  "dependencies": {
    "dayjs": "^1.11.0"
  },
  "devDependencies": {
    "typescript": "^5.1.0"
  }
}
EOF
```

**Step 4: 创建 H5 package.json**

```bash
cat > apps/customer-h5/package.json << 'EOF'
{
  "name": "@petlianbao/customer-h5",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.3.0",
    "vue-router": "^4.2.0",
    "axios": "^1.6.0",
    "dayjs": "^1.11.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.2.0",
    "typescript": "^5.1.0",
    "vite": "^4.4.0"
  }
}
EOF
```

**Step 5: Commit**

```bash
git add .
git commit -m "feat: 初始化项目结构"
```

---

## Step 2: 创建 TypeScript 配置

**Files:**
- Create: `tsconfig.json`
- Create: `apps/backend/tsconfig.json`
- Create: `apps/backend/nest-cli.json`
- Create: `apps/merchant-miniapp/tsconfig.json`
- Create: `apps/customer-h5/tsconfig.json`
- Create: `apps/customer-h5/vite.config.ts`

**Step 1: 创建根 tsconfig.json**

```bash
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "baseUrl": ".",
    "paths": {
      "@petlianbao/types": ["packages/types/src"],
      "@petlianbao/utils": ["packages/utils/src"]
    }
  },
  "references": [
    { "path": "./apps/backend" },
    { "path": "./apps/merchant-miniapp" },
    { "path": "./apps/customer-h5" }
  ]
}
EOF
```

**Step 2: 创建后端 tsconfig.json**

```bash
cat > apps/backend/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "declaration": false,
    "declarationMap": false,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@petlianbao/types": ["../../packages/types/src"],
      "@petlianbao/utils": ["../../packages/utils/src"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
```

**Step 3: 创建后端 nest-cli.json**

```bash
cat > apps/backend/nest-cli.json << 'EOF'
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
EOF
```

**Step 4: 创建小程序 tsconfig.json**

```bash
cat > apps/merchant-miniapp/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.d.ts"]
}
EOF
```

**Step 5: 创建 H5 tsconfig.json 和 vite.config.ts**

```bash
cat > apps/customer-h5/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

cat > apps/customer-h5/tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
EOF

cat > apps/customer-h5/vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
EOF
```

**Step 6: Commit**

```bash
git add .
git commit -feat: 添加TypeScript配置"
```

---

## Step 3: 创建 Docker 开发环境

**Files:**
- Create: `docker-compose.yml`
- Create: `apps/backend/.env.example`

**Step 1: 创建 docker-compose.yml**

```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: petlianbao-postgres
    environment:
      POSTGRES_DB: petlianbao
      POSTGRES_USER: petlianbao
      POSTGRES_PASSWORD: petlianbao123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U petlianbao"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: petlianbao-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
EOF
```

**Step 2: 创建环境变量示例**

```bash
cat > apps/backend/.env.example << 'EOF'
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=petlianbao
DATABASE_PASSWORD=petlianbao123
DATABASE_NAME=petlianbao

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# WeChat
WECHAT_APP_ID=your-app-id
WECHAT_APP_SECRET=your-app-secret

# Server
PORT=3000
NODE_ENV=development
EOF
```

**Step 3: 启动 Docker**

```bash
docker-compose up -d
# 验证
docker-compose ps
# 期望输出: petlianbao-postgres, petlianbao-redis 状态为 healthy
```

**Step 4: Commit**

```bash
git add .
git commit -m "feat: 添加Docker开发环境配置"
```

---

## Step 4: 创建 NestJS 基础架构

**Files:**
- Create: `apps/backend/src/main.ts`
- Create: `apps/backend/src/app.module.ts`
- Create: `apps/backend/src/config/configuration.ts`
- Create: `apps/backend/src/config/data-source.ts`

**Step 1: 创建 main.ts**

```bash
cat > apps/backend/src/main.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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

**Step 2: 创建 configuration.ts**

```bash
cat > apps/backend/src/config/configuration.ts << 'EOF'
export const configuration = () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'petlianbao',
    password: process.env.DATABASE_PASSWORD || 'petlianbao123',
    database: process.env.DATABASE_NAME || 'petlianbao',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
  },
  nodeEnv: process.env.NODE_ENV || 'development',
});
EOF
```

**Step 3: 创建 app.module.ts**

```bash
cat > apps/backend/src/app.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configuration } from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { CustomerModule } from './modules/customer/customer.module';
import { BillingModule } from './modules/billing/billing.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { ReportModule } from './modules/report/report.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/entities/*.entity{.ts,.js}'],
        synchronize: configService.get('nodeEnv') === 'development',
        logging: configService.get('nodeEnv') === 'development',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    MerchantModule,
    AppointmentModule,
    CustomerModule,
    BillingModule,
    MarketingModule,
    ReportModule,
  ],
})
export class AppModule {}
EOF
```

**Step 4: 创建 data-source.ts (用于 TypeORM CLI)**

```bash
cat > apps/backend/src/config/data-source.ts << 'EOF'
import { DataSource } from 'typeorm';
import { configuration } from './configuration';

const config = configuration();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
  logging: false,
});
EOF
```

**Step 5: Commit**

```bash
git add .
git commit -m "feat: 创建NestJS基础架构"
```

---

## Step 5: 创建数据库实体

**Files:**
- Create: `apps/backend/src/entities/merchant.entity.ts`
- Create: `apps/backend/src/entities/service.entity.ts`
- Create: `apps/backend/src/entities/customer.entity.ts`
- Create: `apps/backend/src/entities/appointment.entity.ts`
- Create: `apps/backend/src/entities/transaction.entity.ts`
- Create: `apps/backend/src/entities/campaign.entity.ts`

**Step 1: 创建 Merchant 实体**

```bash
cat > apps/backend/src/entities/merchant.entity.ts << 'EOF'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Service } from './service.entity';
import { Customer } from './customer.entity';
import { Appointment } from './appointment.entity';
import { Transaction } from './transaction.entity';
import { Campaign } from './campaign.entity';

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'openid', unique: true, length: 100 })
  openid: string;

  @Column({ name: 'shop_name', length: 100 })
  shopName: string;

  @Column({ name: 'phone', length: 20, nullable: true })
  phone: string;

  @Column({ name: 'address', length: 200, nullable: true })
  address: string;

  @Column({ name: 'business_hours', type: 'jsonb', default: {} })
  businessHours: Record<string, any>;

  @Column({ name: 'plan_type', default: 'free', length: 20 })
  planType: string;

  @Column({ name: 'plan_expired_at', nullable: true })
  planExpiredAt: Date;

  @OneToMany(() => Service, (service) => service.merchant)
  services: Service[];

  @OneToMany(() => Customer, (customer) => customer.merchant)
  customers: Customer[];

  @OneToMany(() => Appointment, (appointment) => appointment.merchant)
  appointments: Appointment[];

  @OneToMany(() => Transaction, (transaction) => transaction.merchant)
  transactions: Transaction[];

  @OneToMany(() => Campaign, (campaign) => campaign.merchant)
  campaigns: Campaign[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
EOF
```

**Step 2: 创建 Service 实体**

```bash
cat > apps/backend/src/entities/service.entity.ts << 'EOF'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Merchant } from './merchant.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 60 })
  duration: number;

  @Column({ name: 'daily_limit', default: 10 })
  dailyLimit: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @ManyToOne(() => Merchant, (merchant) => merchant.services)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
EOF
```

**Step 3: 创建 Customer 实体**

```bash
cat > apps/backend/src/entities/customer.entity.ts << 'EOF'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Merchant } from './merchant.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({ name: 'pet_name', length: 50 })
  petName: string;

  @Column({ name: 'pet_breed', length: 50, nullable: true })
  petBreed: string;

  @Column({ name: 'pet_birthday', type: 'date', nullable: true })
  petBirthday: Date;

  @Column({ name: 'phone', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  @Column({ name: 'total_spent', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ name: 'visit_count', default: 0 })
  visitCount: number;

  @Column({ name: 'last_visit_at', nullable: true })
  lastVisitAt: Date;

  @ManyToOne(() => Merchant, (merchant) => merchant.customers)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
EOF
```

**Step 4: 创建 Appointment 实体**

```bash
cat > apps/backend/src/entities/appointment.entity.ts << 'EOF'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Merchant } from './merchant.entity';
import { Customer } from './customer.entity';
import { Service } from './service.entity';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'service_id' })
  serviceId: string;

  @Column({ name: 'appointment_time', type: 'timestamp' })
  appointmentTime: Date;

  @Column({ default: 'pending', length: 20 })
  status: AppointmentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'reminder_sent', default: false })
  reminderSent: boolean;

  @ManyToOne(() => Merchant, (merchant) => merchant.appointments)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @ManyToOne(() => Customer, (customer) => customer.appointments)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Service, (service) => service.appointments)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
EOF
```

**Step 5: 创建 Transaction 实体**

```bash
cat > apps/backend/src/entities/transaction.entity.ts << 'EOF'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Merchant } from './merchant.entity';
import { Customer } from './customer.entity';
import { Appointment } from './appointment.entity';

export type PaymentMethod = 'wechat' | 'alipay' | 'cash' | 'member';
export type TransactionStatus = 'completed' | 'refunded';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'appointment_id', nullable: true })
  appointmentId: string;

  @Column({ type: 'jsonb' })
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ name: 'payment_method', length: 20 })
  paymentMethod: PaymentMethod;

  @Column({ default: 'completed', length: 20 })
  status: TransactionStatus;

  @ManyToOne(() => Merchant, (merchant) => merchant.transactions)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @ManyToOne(() => Customer, (customer) => customer.transactions)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Appointment, (appointment) => appointment.transactions)
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
EOF
```

**Step 6: 创建 Campaign 实体**

```bash
cat > apps/backend/src/entities/campaign.entity.ts << 'EOF'
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Merchant } from './merchant.entity';

export type CampaignType = 'poster' | 'coupon' | 'birthday' | 'broadcast';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({ length: 20 })
  type: CampaignType;

  @Column({ length: 100, nullable: true })
  title: string;

  @Column({ type: 'jsonb', nullable: true })
  content: Record<string, any>;

  @Column({ name: 'target_tags', type: 'jsonb', default: [] })
  targetTags: string[];

  @Column({ name: 'sent_count', default: 0 })
  sentCount: number;

  @ManyToOne(() => Merchant, (merchant) => merchant.campaigns)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
EOF
```

**Step 7: Commit**

```bash
git add .
git commit -m "feat: 创建数据库实体"
```

---

## Step 6: 创建空模块骨架

**Files:**
- Create: `apps/backend/src/modules/auth/auth.module.ts`
- Create: `apps/backend/src/modules/merchant/merchant.module.ts`
- Create: `apps/backend/src/modules/appointment/appointment.module.ts`
- Create: `apps/backend/src/modules/customer/customer.module.ts`
- Create: `apps/backend/src/modules/billing/billing.module.ts`
- Create: `apps/backend/src/modules/marketing/marketing.module.ts`
- Create: `apps/backend/src/modules/report/report.module.ts`

**Step 1: 创建所有模块骨架**

```bash
# Auth 模块
cat > apps/backend/src/modules/auth/auth.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { WechatStrategy } from './strategies/wechat.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, WechatStrategy],
  exports: [AuthService],
})
export class AuthModule {}
EOF
```

类似方式创建其他模块骨架...

**Step 2: Commit**

```bash
git add .
git commit -m "feat: 创建模块骨架"
```

---

## Step 7: 验证开发环境

**Step 1: 安装依赖**

```bash
pnpm install
```

**Step 2: 复制环境变量**

```bash
cp apps/backend/.env.example apps/backend/.env
```

**Step 3: 启动 Docker 数据库**

```bash
docker-compose up -d
```

**Step 4: 尝试启动后端**

```bash
cd apps/backend
pnpm dev
# 期望：应用启动成功，监听端口 3000
```

**Step 5: Commit**

```bash
git add .
git commit -m "chore: 完成Phase 1基础搭建"
```

---

## 验收标准

- [ ] Monorepo 项目结构创建完成
- [ ] Docker 环境可正常启动 PostgreSQL 和 Redis
- [ ] NestJS 后端可正常启动
- [ ] TypeORM 实体定义完成
- [ ] 所有模块骨架已创建
