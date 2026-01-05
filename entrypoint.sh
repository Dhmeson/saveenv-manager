#!/bin/sh

# Aguarda o banco de dados ficar disponível (opcional, mas recomendado)
echo "Aguardando banco de dados..."

# Aplica as migrações ou sincroniza o schema do Prisma
echo "Sincronizando banco de dados com Prisma..."
bun prisma db push --accept-data-loss # Use 'migrate deploy' se preferir algo mais rígido



# Inicia a aplicação
echo "Iniciando aplicação Next.js com Bun..."
bun server.js