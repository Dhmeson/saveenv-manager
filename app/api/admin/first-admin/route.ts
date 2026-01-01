import { NextResponse } from 'next/server'
import { prisma } from '@/app/utils/prisma'
import { hashPassword } from '@/app/utils/crypto'
import { UserRole } from '@prisma/client'

export async function POST(req: Request) {
  try {
    // Verificar se já existe admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN }
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin already exists' },
        { status: 403 }
      )
    }

    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verificar se o email já está em uso
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    const hashed = await hashPassword(password)

    // Criar usuário admin com perfil de admin
    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
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
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    return NextResponse.json(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create first admin error:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

