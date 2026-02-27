FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/

RUN npm install -g pnpm@8.15.0 && pnpm install --frozen-lockfile

COPY apps/backend ./apps/backend
COPY packages/types/src ./packages/types/src
COPY packages/utils/src ./packages/utils/src

RUN pnpm --filter @petlianbao/backend build

FROM node:18-alpine AS production

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/types/package.json ./packages/types/
COPY packages/types/src ./packages/types/src
COPY packages/utils/package.json ./packages/utils/
COPY packages/utils/src ./packages/utils/src

RUN npm install -g pnpm@8.15.0 && \
    pnpm install --prod --frozen-lockfile --ignore-scripts

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

WORKDIR /app/apps/backend

RUN mkdir -p uploads

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

CMD ["node", "dist/main"]