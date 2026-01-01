import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/utils/auth'
import { prisma } from '@/app/utils/prisma'
import { Auth } from '@/app/class/Auth'
import { UserRole } from '@prisma/client'

// GET - Listar usuários (apenas admin)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se é admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST - Criar novo usuário (apenas admin)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar se é admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    const { name, email, password, role } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validar role se fornecido
    const userRole = role && (role === UserRole.ADMIN || role === UserRole.USER) 
      ? role 
      : UserRole.USER

    const user = await Auth.registerUser({ 
      name, 
      email, 
      password,
      role: userRole
    })

    return NextResponse.json({ 
      id: user.id, 
      email: user.email, 
      name: user.name,
      role: user.role 
    }, { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    const status = message === 'Email already registered' ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

