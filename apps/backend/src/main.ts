import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as dns from 'dns';
import { AppModule } from './app.module';
import configuration from './config/configuration';

// 强制使用 IPv4，解决腾讯云不支持 IPv6 的问题
dns.setDefaultResultOrder('ipv4first');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.setGlobalPrefix('api/v1');
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 静态文件：提供 uploads 目录的文件访问
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // CORS 配置：支持微信小程序、H5 和管理后台
  const corsOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',') 
    : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174', 'https://lanzione1.github.io'];
  
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  const port = configuration().port || 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`应用运行在: http://localhost:${port}`);
  console.log(`API 文档: http://localhost:${port}/api/v1`);
}
bootstrap();
