// import NextAuth, { NextAuthOptions } from "next-auth"
// import Credentials from "next-auth/providers/credentials"
// import { prisma } from "@/app/utils/prisma"
// import { verifyPassword } from "@/app/utils/crypto"

// export const authOptions: NextAuthOptions = {
// 	providers: [
// 		Credentials({
// 			name: "Credentials",
// 			credentials: {
// 				email: { label: "Email", type: "email" },
// 				password: { label: "Password", type: "password" },
// 			},
// 			async authorize(credentials) {
// 				if (!credentials?.email || !credentials?.password) return null

// 				const user = await prisma.user.findUnique({
// 					where: { email: credentials.email },
// 					select: { id: true, email: true, password: true, currentPlan: true },
// 				})
// 				if (!user) return null

// 				const isValid = await verifyPassword(credentials.password, user.password)
// 				if (!isValid) return null

// 				// eslint-disable-next-line @typescript-eslint/no-explicit-any
// 				return { id: user.id, email: user.email, plan: user.currentPlan as any }
// 			},
// 		}),
// 	],
// 	pages: {
// 		signIn: "/login",
// 	},
// 	session: { strategy: "jwt" },
// 	callbacks: {
// 		async jwt({ token, user }) {
// 			if (user) {
// 				token.id = user.id
// 				token.email = user.email
// 				token.plan = user.plan
// 			}
// 			return token
// 		},
// 		async session({ session, token }) {
// 			if (token && session.user) {
// 				session.user.id = token.id as string
// 				session.user.email = token.email as string
// 				// eslint-disable-next-line @typescript-eslint/no-explicit-any
// 				session.user.plan = token.plan as any
// 			}
// 			return session
// 		},
// 	},
// }

// const handler = NextAuth(authOptions)
// export { handler as GET, handler as POST }


// app/api/auth/[...nextauth]/route.ts
import { authOptions } from "@/app/utils/auth"
import NextAuth from "next-auth"

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }