# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 workspace 配置和所有 package.json
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/types/package.json packages/types/tsconfig.json ./packages/types/
COPY packages/utils/package.json packages/utils/tsconfig.json ./packages/utils/

# 安装 pnpm
RUN npm install -g pnpm@8.15.0

# 安装所有依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY apps/backend ./apps/backend
COPY packages/types/src ./packages/types/src
COPY packages/utils/src ./packages/utils/src

# 构建 types 和 utils
RUN pnpm --filter @petlianbao/types build && \
    pnpm --filter @petlianbao/utils build

# 构建 backend
RUN pnpm --filter @petlianbao/backend build

# 生产阶段
FROM node:18-alpine AS production

WORKDIR /app

# 只安装运行时必需的工具
RUN apk add --no-cache tini

# 复制 workspace 配置
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/

# 安装 pnpm 和生产依赖
RUN npm install -g pnpm@8.15.0 && \
    pnpm install --prod --frozen-lockfile --ignore-scripts

# 从构建阶段复制构建产物
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/utils/dist ./packages/utils/dist

# 切换到 backend 工作目录
WORKDIR /app/apps/backend

# 创建必要的目录
RUN mkdir -p uploads

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

# 使用 tini 作为 init 进程
ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/main"]