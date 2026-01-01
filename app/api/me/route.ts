import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/app/utils/prisma'
import { authOptions } from '@/app/utils/auth'
import { redirectToLoginClearingSession } from '@/app/utils/redirectToLoginClearingSession'

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return redirectToLoginClearingSession(_req)
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const [projects, variables] = await Promise.all([
      prisma.storedProject.count({ where: { ownerId: user.id } }),
      prisma.projectEnvVar.count({ where: { project: { ownerId: user.id } } })
    ])

    return NextResponse.json({
      name: user.name,
      email: user.email,
      role: user.role,
      counts: { projects, variables },
      limits: {
        maxProjects: -1, // Unlimited
        maxVarsPerProject: -1, // Unlimited
        maxKeys: -1, // Unlimited
        storageGB: -1 // Unlimited
      }
    })
  } catch (error) {
    console.error('Me route error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


