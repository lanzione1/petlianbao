FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package.json 文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/

# 安装 pnpm 并安装依赖
RUN npm install -g pnpm@8.15.0 && pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建后端
RUN pnpm --filter @petlianbao/backend build

# 生产阶段
FROM node:18-alpine AS production

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@8.15.0

# 复制 workspace 配置
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/

# 只安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 从构建阶段复制构建产物
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/utils/dist ./packages/utils/dist

# 切换到 backend 工作目录
WORKDIR /app/apps/backend

# 创建 uploads 目录
RUN mkdir -p uploads

# 环境变量
ENV NODE_ENV=production
ENV PORT=80

# 微信云托管使用 80 端口
EXPOSE 80

# 启动命令
CMD ["node", "dist/main"]