import { NextRequest, NextResponse } from "next/server"

export function redirectToLoginClearingSession(req: NextRequest) {
    const response = NextResponse.redirect(new URL('/login', req.url))
    const cookiesToClear = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      'next-auth.callback-url',
      'next-auth.state'
    ]
    cookiesToClear.forEach((name) => {
      response.cookies.set(name, '', { expires: new Date(0), path: '/' })
    })
    return response
  }
  