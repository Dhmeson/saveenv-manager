import { NextResponse } from "next/server"
import { Auth } from "@/app/class/Auth"

export async function POST(request: Request) {
	try {
		const { name, email, password } = await request.json()
		if (!name || !email || !password) {
			return NextResponse.json({ error: "Missing fields" }, { status: 400 })
		}

		const user = await Auth.registerUser({ name, email, password })

		return NextResponse.json({ id: user.id, email: user.email, role: user.role })
	} catch (error) {
		console.error('Register error:', error)
		const message = error instanceof Error ? error.message : 'Internal Server Error'
		const status = message === 'Email already registered' ? 409 : 500
		return NextResponse.json({ error: message }, { status })
	}
}


