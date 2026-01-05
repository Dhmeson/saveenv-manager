# 1. Dependências
FROM oven/bun:1.1-alpine AS deps
# Prisma precisa de openssl e libc6-compat para o engine de query
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

COPY package.json bun.lockb ./
COPY prisma ./prisma/

# Bun install é extremamente rápido e já lida com resoluções de pacotes
RUN bun install --frozen-lockfile
RUN bunx prisma generate

# 2. Builder
FROM oven/bun:1.1-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Next.js funciona perfeitamente com Bun para o build
RUN bun run build

# 3. Runner (Camada Final Ultra-Leve)
FROM oven/bun:1.1-alpine AS runner
WORKDIR /app

# Atualização de segurança para limpar vulnerabilidades da base Alpine
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache openssl dumb-init

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Criar usuário não-root
RUN addgroup --system --gid 1001 bunjs && \
    adduser --system --uid 1001 bunuser

# Copiamos o standalone do Next.js
# Nota: O Next.js standalone ainda usa 'node server.js' internamente, 
# mas o Bun consegue executar esse arquivo com alta performance.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=bunuser:bunjs /app/.next/standalone ./
COPY --from=builder --chown=bunuser:bunjs /app/.next/static ./.next/static
COPY --from=builder --chown=bunuser:bunjs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=bunuser:bunjs /app/prisma ./prisma
COPY --from=builder --chown=bunuser:bunjs /app/entrypoint.sh ./entrypoint.sh

RUN chmod +x /app/entrypoint.sh

USER bunuser


# Usamos o Bun para rodar o servidor standalone
ENTRYPOINT ["/usr/bin/dumb-init", "--", "/app/entrypoint.sh"]