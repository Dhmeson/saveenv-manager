#!/usr/bin/env bun
/**
 * Script para verificar se as variáveis de ambiente estão configuradas corretamente
 * Execute com: bun run scripts/check-env.ts
 */

console.log('🔍 Verificando variáveis de ambiente...\n')

const requiredVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
]

const optionalVars = [
  'NEXTAUTH_URL',
  'DOMAIN',
  'PORT',
  'NODE_ENV',
]

let hasErrors = false

// Verificar variáveis obrigatórias
console.log('📋 Variáveis obrigatórias:')
for (const varName of requiredVars) {
  const value = process.env[varName]
  if (!value) {
    console.log(`  ❌ ${varName}: NÃO DEFINIDA`)
    hasErrors = true
  } else {
    // Mascarar valores sensíveis
    const masked = varName.includes('SECRET') || varName.includes('PASSWORD') || varName.includes('URL')
      ? value.substring(0, 20) + '...'
      : value
    console.log(`  ✅ ${varName}: ${masked}`)
  }
}

console.log('\n📋 Variáveis opcionais:')
for (const varName of optionalVars) {
  const value = process.env[varName]
  if (value) {
    console.log(`  ✅ ${varName}: ${value}`)
  } else {
    console.log(`  ⚠️  ${varName}: não definida (usando padrão)`)
  }
}

// Verificar DATABASE_URL especificamente
console.log('\n🔗 Verificando DATABASE_URL:')
const dbUrl = process.env.DATABASE_URL
if (dbUrl) {
  try {
    const url = new URL(dbUrl)
    console.log(`  ✅ Protocolo: ${url.protocol}`)
    console.log(`  ✅ Host: ${url.hostname}`)
    console.log(`  ✅ Porta: ${url.port || '5432 (padrão)'}`)
    console.log(`  ✅ Database: ${url.pathname.slice(1)}`)
    console.log(`  ✅ Usuário: ${url.username || 'não especificado'}`)
  } catch (error) {
    console.log(`  ❌ DATABASE_URL inválida: ${error}`)
    hasErrors = true
  }
} else {
  hasErrors = true
}

// Verificar Prisma Client
console.log('\n📦 Verificando Prisma Client:')
async function checkPrisma() {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    console.log('  ✅ Prisma Client importado com sucesso')
    
    // Tentar conectar
    try {
      await prisma.$connect()
      console.log('  ✅ Conexão com banco de dados estabelecida')
      await prisma.$disconnect()
    } catch (error: any) {
      console.log(`  ❌ Erro ao conectar: ${error.message}`)
      console.log('  💡 Verifique se:')
      console.log('     - O PostgreSQL está rodando')
      console.log('     - A DATABASE_URL está correta')
      console.log('     - As credenciais estão válidas')
      return true // hasErrors = true
    }
  } catch (error: any) {
    console.log(`  ❌ Erro ao importar Prisma Client: ${error.message}`)
    console.log('  💡 Execute: bun run db:generate')
    return true // hasErrors = true
  }
  return false
}

// Executar verificação assíncrona
checkPrisma().then((prismaError) => {
  const finalHasErrors = hasErrors || prismaError
  
  console.log('\n' + '='.repeat(50))
  if (finalHasErrors) {
    console.log('❌ Alguns problemas foram encontrados.')
    console.log('\n💡 Soluções:')
    console.log('  1. Crie um arquivo .env.local na raiz do projeto')
    console.log('  2. Adicione as variáveis obrigatórias:')
    console.log('     DATABASE_URL="postgresql://user:password@localhost:5432/dbname"')
    console.log('     NEXTAUTH_SECRET="sua-chave-secreta-aqui"')
    console.log('     NEXTAUTH_URL="http://localhost:3000"')
    console.log('  3. Execute: bun run db:generate')
    console.log('  4. Execute: bun run db:push')
    process.exit(1)
  } else {
    console.log('✅ Todas as verificações passaram!')
    process.exit(0)
  }
})

