import { NextResponse } from 'next/server'
import { prisma } from '@/app/utils/prisma'
import { sendEmail, generateResetPasswordEmailHTML } from '@/app/utils/email'
import { randomBytes, createHash } from 'crypto'

export async function POST(request: Request) {
  try {
    const { email } = await request.json().catch(() => ({ email: '' }))

    // Normalize and basic validate
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

    // Always return 200 to avoid user enumeration
    const okResponse = NextResponse.json({ ok: true })

    if (!normalizedEmail) {
      return okResponse
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true, email: true } })
    if (!user) {
      return okResponse
    }

    // Invalidate any previous unused tokens
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } })

    const rawToken = randomBytes(32).toString('base64url')
    const salt = randomBytes(16).toString('base64url')
    const tokenHash = createHash('sha256').update(`${salt}.${rawToken}`).digest('base64url')
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    const created = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        tokenSalt: salt,
        expiresAt,
      },
      select: { id: true }
    })

    const compoundToken = `${created.id}.${rawToken}`

    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset your password',
        html: generateResetPasswordEmailHTML(user.email, compoundToken),
      })
    } catch (e) {
      // Do not leak email errors to client
      console.error('Failed to send reset email', e)
    }

    return okResponse
  } catch  {
    return NextResponse.json({ ok: true })
  }
}


