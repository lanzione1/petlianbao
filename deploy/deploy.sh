#!/bin/bash

# 宠联宝部署脚本

set -e

echo "🚀 开始部署宠联宝..."

# 检查环境变量
if [ ! -f .env ]; then
    echo "❌ 错误: 请先创建 .env 文件"
    echo "   cp .env.example .env"
    exit 1
fi

# 加载环境变量
source .env

# 检查必要的环境变量
required_vars=("DB_PASSWORD" "REDIS_PASSWORD" "JWT_SECRET" "WECHAT_APP_ID" "WECHAT_APP_SECRET")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ 错误: 缺少环境变量 $var"
        exit 1
    fi
done

# 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 构建并启动
echo "🔨 构建 Docker 镜像..."
docker-compose -f docker-compose.prod.yml build

echo "🚀 启动服务..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 健康检查
echo "🔍 健康检查..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ 部署成功！"
    echo "   API: https://api.petlianbao.com"
else
    echo "❌ 健康检查失败，请检查日志"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi
