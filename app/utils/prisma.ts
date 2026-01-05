import { PrismaClient } from '@prisma/client'

// Singleton pattern para evitar múltiplas instâncias do Prisma Client
// Importante quando usando Bun com Next.js
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// export const prisma = new PrismaClient({
//     log: [
//       {
//         emit: 'event',
//         level: 'query',
//       },
//       {
//         emit: 'stdout',
//         level: 'error',
//       },
//       {
//         emit: 'stdout',
//         level: 'info',
//       },
//       {
//         emit: 'stdout',
//         level: 'warn',
//       },
//     ],
//   })
  
//   prisma.$on('query', (e) => {
//     console.log('Query: ' + e.query)
//     console.log('Params: ' + e.params)
//     console.log('Duration: ' + e.duration + 'ms')
//   })