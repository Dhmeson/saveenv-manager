import { NextResponse } from 'next/server'
import { prisma } from '@/app/utils/prisma'
import { UserRole } from '@prisma/client'

export async function GET() {
  try {
    const adminExists = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN }
    })

    return NextResponse.json({ exists: !!adminExists })
  } catch (error) {
    console.error('Check admin error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

