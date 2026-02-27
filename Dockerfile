FROM node:18-alpine AS builder

WORKDIR /app

# 复制 workspace 配置
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制所有 package.json
COPY apps/backend/package.json ./apps/backend/
COPY packages/types/package.json ./packages/types/
COPY packages/types/tsconfig.json ./packages/types/
COPY packages/types/src ./packages/types/src
COPY packages/utils/package.json ./packages/utils/
COPY packages/utils/tsconfig.json ./packages/utils/
COPY packages/utils/src ./packages/utils/src

# 安装 pnpm 并安装依赖
RUN npm install -g pnpm@8.15.0
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY apps/backend ./apps/backend
COPY tsconfig.json ./

# 构建
RUN pnpm --filter @petlianbao/backend build

# 生产阶段
FROM node:18-alpine AS production

WORKDIR /app

# 复制 workspace 配置
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 复制 package.json 和源码（types 和 utils 是 TypeScript 源码，需要在运行时编译）
COPY apps/backend/package.json ./apps/backend/
COPY packages/types/package.json ./packages/types/
COPY packages/types/tsconfig.json ./packages/types/
COPY packages/types/src ./packages/types/src
COPY packages/utils/package.json ./packages/utils/
COPY packages/utils/tsconfig.json ./packages/utils/
COPY packages/utils/src ./packages/utils/src

# 安装 pnpm 并安装生产依赖
RUN npm install -g pnpm@8.15.0
RUN pnpm install --frozen-lockfile --ignore-scripts

# 复制构建产物
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

WORKDIR /app/apps/backend

RUN mkdir -p uploads

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

CMD ["node", "dist/main"]