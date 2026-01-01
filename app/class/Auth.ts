import { prisma } from '@/app/utils/prisma'
import { hashPassword, verifyPassword } from '@/app/utils/crypto'
import { UserRole } from '@prisma/client'

export interface RegisterParams {
  name: string
  email: string
  password: string
  role?: UserRole
}

export interface LoginParams {
  email: string
  password: string
}

export class Auth {
  static async registerUser({ name, email, password, role = UserRole.USER }: RegisterParams) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      throw new Error('Email already registered')
    }

    const hashed = await hashPassword(password)

    // Create user with USER role by default (admin can create users with different roles)
    const user = await prisma.user.create({
      data: { 
        name, 
        email, 
        password: hashed,
        role: role || UserRole.USER
      },
      select: { id: true, email: true, name: true, role: true }
    })

    return user
  }

  static async loginUser({ email, password }: LoginParams) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new Error('Invalid credentials')
    }
    const ok = await verifyPassword(password, user.password)
    if (!ok) {
      throw new Error('Invalid credentials')
    }
    return user
  }
}


