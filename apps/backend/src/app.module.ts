import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { CustomerModule } from './modules/customer/customer.module';
import { BillingModule } from './modules/billing/billing.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { ReportModule } from './modules/report/report.module';
import { PublicModule } from './modules/public/public.module';
import { HealthModule } from './modules/health/health.module';
import { AdminModule } from './modules/admin/admin.module';
import { StaffModule } from './modules/staff/staff.module';
import { DevModule } from './modules/dev/dev.module';
import { PetModule } from './modules/pet/pet.module';
import { H5CustomerModule } from './modules/h5-customer/h5-customer.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get('redis.host');
        
        if (!redisHost) {
          console.log('未配置 Redis，使用内存缓存');
          return { ttl: 60 * 60 * 1000 };
        }

        const redisConfig: any = {
          socket: {
            host: redisHost,
            port: configService.get('redis.port'),
          },
        };

        if (configService.get('redis.password')) {
          redisConfig.password = configService.get('redis.password');
        }

        if (configService.get('redis.tls')) {
          redisConfig.socket.tls = true;
        }

        try {
          const store = await redisStore(redisConfig);
          console.log('Redis 连接成功');
          return { store, ttl: 60 * 60 * 1000 };
        } catch (e) {
          console.log('Redis 连接失败，使用内存缓存:', e.message);
          return { ttl: 60 * 60 * 1000 };
        }
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1秒
        limit: 10, // 每秒最多10个请求
      },
      {
        name: 'medium',
        ttl: 10000, // 10秒
        limit: 50, // 每10秒最多50个请求
      },
      {
        name: 'long',
        ttl: 60000, // 1分钟
        limit: 200, // 每分钟最多200个请求
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get('nodeEnv');
        const dbType = configService.get('database.type') || 'mysql';
        
        console.log('[TypeORM] Database type:', dbType);
        console.log('[TypeORM] Database host:', configService.get('database.host'));
        console.log('[TypeORM] Database port:', configService.get('database.port'));
        console.log('[TypeORM] Database username:', configService.get('database.username'));
        console.log('[TypeORM] Database name:', configService.get('database.database'));
        
        const baseConfig: any = {
          type: dbType,
          host: configService.get('database.host'),
          port: configService.get('database.port'),
          username: configService.get('database.username'),
          password: configService.get('database.password'),
          database: configService.get('database.database'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: nodeEnv === 'development',
          logging: nodeEnv === 'development',
          autoLoadEntities: true,
        };

        // 对于 MySQL，不需要显式设置 driver，TypeORM 会自动加载 mysql2
        // 对于 PostgreSQL，需要显式设置 driver 为 pg
        if (dbType === 'postgres') {
          baseConfig.driver = require('pg');
          if (configService.get('database.ssl')) {
            baseConfig.ssl = {
              rejectUnauthorized: configService.get('database.sslRejectUnauthorized'),
            };
          }
        }

        return baseConfig;
      },
      inject: [ConfigService],
    }),
    AuthModule,
    MerchantModule,
    AppointmentModule,
    CustomerModule,
    BillingModule,
    MarketingModule,
    ReportModule,
    PublicModule,
    HealthModule,
    AdminModule,
    StaffModule,
    DevModule,
    PetModule,
    H5CustomerModule,
    NotificationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
