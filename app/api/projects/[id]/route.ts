import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/app/utils/prisma'
import { authOptions } from '@/app/utils/auth'

// PUT - Atualizar projeto do usuário
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const projectId = Number(id)
    if (!Number.isFinite(projectId)) {
      return NextResponse.json({ error: 'Invalid project id' }, { status: 400 })
    }

    const body = await req.json()
    const { name, description } = body as {
      name?: string
      description?: string
     
    }

    // Verificar se o projeto existe e pertence ao usuário
    const existingProject = await prisma.storedProject.findFirst({
      where: { id: projectId, ownerId: session.user.id },
      select: { id: true}
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'User not permission to update this project' }, { status: 403 })
    }




    // Preparar dados para atualização
    const updateData: {
      name?: string;
      description?: string | null;
  
    } = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    

    // Se não há dados para atualizar, retornar o projeto atual
    if (Object.keys(updateData).length === 0) {
      const currentProject = await prisma.storedProject.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          variables: { select: { name: true, encrypted: true } }
        }
      })
      return NextResponse.json(currentProject)
    }

    // Atualizar o projeto
    const updatedProject = await prisma.storedProject.update({
      where: { id: projectId },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        variables: { select: { name: true, encrypted: true } }
      }
    })

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar projeto do usuário
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const projectId = Number(id)
    if (!Number.isFinite(projectId)) {
      return NextResponse.json({ error: 'Invalid project id' }, { status: 400 })
    }

    // Verificar se o projeto existe e pertence ao usuário
    const existingProject = await prisma.storedProject.findFirst({
      where: { id: projectId, ownerId: session.user.id },
      select: { id: true }
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Deletar o projeto (as variáveis serão deletadas automaticamente devido ao cascade)
    await prisma.storedProject.delete({
      where: { id: projectId, ownerId: session.user.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
