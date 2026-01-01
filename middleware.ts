import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { enforceRequestGuardOrRedirect } from './app/utils/requestGuard'

export default withAuth(
  function middleware(req) {
    // Todos os usuários têm acesso a organizações
    const guardResponse = enforceRequestGuardOrRedirect(req)
    if (guardResponse) return guardResponse
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/master-keys/:path*',
    '/projects/:path*',
    '/new-project'
  ]
}


