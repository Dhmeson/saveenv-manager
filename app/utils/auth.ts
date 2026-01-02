import { getServerSession } from "next-auth"

// app/lib/auth.ts
import { NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/app/utils/prisma"
import { verifyPassword } from "@/app/utils/crypto"
import { UserRole } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  // NEXTAUTH_SECRET é usado automaticamente pelo NextAuth se definido em process.env
  // Não precisa ser passado explicitamente aqui, mas pode ser definido para maior controle
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: { id: true, email: true, name: true, password: true, role: true },
        })
        if (!user) return null

        const isValid = await verifyPassword(credentials.password, user.password)
        if (!isValid) return null

        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as UserRole
      }
      return session
    },
  },
}

export function getServerAuthSession() {
	return getServerSession(authOptions)
}
