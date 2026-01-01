import { PrismaClient, UserRole } from '@prisma/client'
import { hashPassword } from '../app/utils/crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Verificar se já existe um admin
  const existingAdmin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN }
  })

  if (existingAdmin) {
    console.log('✅ Admin user already exists, skipping seed.')
    return
  }

  // Criar senha padrão do admin (deve ser alterada no primeiro login)
  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123'
  const hashedPassword = await hashPassword(defaultPassword)

  // Criar usuário admin
  const admin = await prisma.user.create({
    data: {
      name: 'Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@saveenv.local',
      password: hashedPassword,
      role: UserRole.ADMIN,
      adminProfile: {
        create: {
          isActive: true,
          permissions: {
            manageUsers: true,
            manageProjects: true,
            manageSystem: true,
            viewAuditLogs: true,
          }
        }
      }
    },
    include: {
      adminProfile: true
    }
  })

  console.log('✅ Admin user and admin profile created successfully!')
  console.log(`📧 Email: ${admin.email}`)
  console.log(`🔑 Password: ${defaultPassword}`)
  console.log(`🆔 Admin ID: ${admin.adminProfile?.id}`)
  console.log('⚠️  IMPORTANT: Change the default password after first login!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

