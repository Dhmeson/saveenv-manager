#!/bin/sh

# Aguarda o banco de dados ficar disponível (opcional, mas recomendado)
echo "Aguardando banco de dados..."

# Aplica as migrações ou sincroniza o schema do Prisma
echo "Sincronizando banco de dados com Prisma..."
npx prisma db push --accept-data-loss # Use 'migrate deploy' se preferir algo mais rígido

# Executa seed para criar admin inicial (se não existir)
echo "Executando seed para criar admin inicial..."
npm run db:seed || true

# Inicia a aplicação
echo "Iniciando aplicação Next.js..."
npm start