# Multi-stage build для оптимизации размера образа

# Stage 1: Dependencies
FROM node:20.17.9-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Устанавливаем pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Копируем файлы для установки зависимостей
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20.17.9-alpine AS builder
WORKDIR /app

# Устанавливаем pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Копируем зависимости из deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Делаем исполняемым entrypoint скрипт
RUN chmod +x ./docker-entrypoint.sh

# Генерируем Prisma Client
RUN npx prisma generate

# Собираем приложение
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# Stage 3: Runner
FROM node:20.17.9-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Устанавливаем зависимости для Prisma и клиент PostgreSQL (нужны для миграций)
RUN apk add --no-cache openssl postgresql-client

# Создаем непривилегированного пользователя
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем необходимые файлы
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Копируем Prisma binaries и клиент
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Копируем entrypoint скрипт
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

# Убеждаемся что entrypoint скрипт исполняемый перед сменой владельца
RUN chmod +x ./docker-entrypoint.sh

# Меняем владельца файлов
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
