FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY apps/backend ./apps/backend
COPY packages/types/src ./packages/types/src
COPY packages/types/package.json ./packages/types/
COPY packages/utils/src ./packages/utils/src
COPY packages/utils/package.json ./packages/utils/
COPY tsconfig.json ./

WORKDIR /app/apps/backend
RUN npm install
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/node_modules ./node_modules
COPY --from=builder /app/apps/backend/package.json ./

RUN mkdir -p uploads

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

CMD ["node", "dist/main"]