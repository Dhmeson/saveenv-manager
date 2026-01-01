import { NextResponse } from 'next/server'
import { prisma } from '@/app/utils/prisma'
import { createHash, timingSafeEqual } from 'crypto'
import { hashPassword } from '@/app/utils/crypto'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json().catch(() => ({ token: '', password: '' }))

    if (!token || typeof token !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const [id, rawToken] = token.split('.')
    if (!id || !rawToken) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    const record = await prisma.passwordResetToken.findUnique({ where: { id }, select: { id: true, userId: true, tokenSalt: true, tokenHash: true, expiresAt: true, usedAt: true } })
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    const candidateHash = createHash('sha256').update(`${record.tokenSalt}.${rawToken}`).digest()
    const storedHash = Buffer.from(record.tokenHash, 'base64url')
    if (storedHash.length !== candidateHash.length || !timingSafeEqual(storedHash, candidateHash)) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    // Update user password
    const newHashedPassword = await hashPassword(password)
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { password: newHashedPassword } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: record.userId, id: { not: record.id } } }),
    ])

    return NextResponse.json({ ok: true })
  } catch  {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }
}


