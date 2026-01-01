// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/utils/auth'
import { prisma } from '@/app/utils/prisma'


// GET - Listar projetos do usuário
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projects = await prisma.storedProject.findMany({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        folderIcon:true,
        environment:true,
        variables: { select: { name: true, encrypted: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST - Criar novo projeto
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, variables, description, folderIcon, environment } = body as {
      name?: string
      description?: string
      folderIcon?: string
      environment?: string
      variables?: Array<{ name: string; encrypted: string }>
    }

    if (!name || !Array.isArray(variables) || variables.length === 0) {
      return NextResponse.json(
        { error: 'name and variables are required' },
        { status: 400 }
      )
    }

    // Todos os usuários têm acesso ilimitado - sem verificação de limites

    const created = await prisma.storedProject.create({
      data: {
        ownerId: session.user.id,
        name: name,
        description: description || null,
        folderIcon: folderIcon || null,
        environment: environment || 'default',
        variables: {
          create: variables.map(v => ({ name: v.name, encrypted: v.encrypted }))
        }
      },
      select: {
        id: true,
        name: true,
        folderIcon: true,
        environment:true,
        createdAt: true,
        variables: {
          select: { name: true, encrypted: true }
        }
      }
    })

    return NextResponse.json(created)
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar variáveis do projeto do usuário
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, variables } = body as {
      id?: string | number
      variables?: Array<{ name: string; encrypted: string }>
    }

    if (id === undefined || !Array.isArray(variables)) {
      return NextResponse.json({ error: 'id and variables are required' }, { status: 400 })
    }

    const projectIdNum = typeof id === 'string' ? Number(id) : id
    if (!Number.isFinite(projectIdNum)) {
      return NextResponse.json({ error: 'Invalid project id' }, { status: 400 })
    }

    const existing = await prisma.storedProject.findFirst({
      where: { id: projectIdNum as number, ownerId: session.user.id },
      select: { id: true }
    })

    if (!existing) {
      return NextResponse.json({ error: 'User not permission to update this project' }, { status: 403 })
    }

    const updated = await prisma.storedProject.update({
      where: { id: projectIdNum as number },
      data: {
        variables: {
          deleteMany: {},
          create: variables.map(v => ({ name: v.name, encrypted: v.encrypted })),
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        variables: { select: { name: true, encrypted: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}