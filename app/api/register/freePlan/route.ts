import { NextResponse } from "next/server"
import { prisma } from "@/app/utils/prisma"
import { hashPassword } from "@/app/utils/crypto"
import { UserRole } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()
    
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    // Verificar se o email já está em uso
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email já está em uso" }, { status: 409 })
    }

    const hashed = await hashPassword(password)

    // Criar usuário no banco (todos têm acesso ilimitado)
    const user = await prisma.user.create({
      data: { 
        name, 
        email, 
        password: hashed,
        role: UserRole.USER
      },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true
      }
    })

    return NextResponse.json({ 
      id: user.id, 
      email: user.email, 
      name: user.name,
      role: user.role 
    })
    
  } catch (error) {
    console.error('Free plan register error:', error)
    const message = error instanceof Error ? error.message : 'Erro interno do servidor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
