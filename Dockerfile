# 1. Dependências
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
RUN npx prisma generate

# 2. Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# 3. Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Instalar dependências do sistema
RUN apk add --no-cache openssl

# Criar usuário de segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia arquivos necessários (Next.js standalone mode)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Copiar Prisma Client gerado e node_modules necessários
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Instalar Prisma CLI localmente (acessível pelo usuário nextjs)
RUN npm install -g prisma@6.14.0

# Criar diretório de cache com permissões corretas
RUN mkdir -p /app/.next/cache && \
    chown -R nextjs:nodejs /app

# Criar script de inicialização
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'set -e' >> /app/entrypoint.sh && \
    echo 'echo "Waiting for database..."' >> /app/entrypoint.sh && \
    echo 'sleep 3' >> /app/entrypoint.sh && \
    echo 'echo "Generating Prisma Client..."' >> /app/entrypoint.sh && \
    echo 'npx prisma generate || true' >> /app/entrypoint.sh && \
    echo 'echo "Synchronizing database with Prisma..."' >> /app/entrypoint.sh && \
    echo 'npx prisma db push --accept-data-loss || true' >> /app/entrypoint.sh && \
    echo 'echo "Starting application..."' >> /app/entrypoint.sh && \
    echo 'exec node server.js' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

USER nextjs

#EXPOSE 4001

ENTRYPOINT ["/app/entrypoint.sh"]