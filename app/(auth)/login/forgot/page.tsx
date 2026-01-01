'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || loading) return
    setLoading(true)
    try {
      await fetch('/api/auth/password/reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      toast.success('If this email exists, a reset link has been sent.')
      router.push('/login')
    } catch {
      toast.success('If this email exists, a reset link has been sent.')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-900">
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-white/90 shadow-2xl backdrop-blur">
          <h1 className="mb-4 text-xl font-bold">Forgot password</h1>
          <p className="mb-6 text-sm text-white/70">Enter your email to receive a reset link.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white placeholder-white/50 outline-none focus:border-indigo-400"
              placeholder="you@example.com"
              required
            />
            <button
              type="submit"
              disabled={!email || loading}
              className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-400 disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <div className="text-center text-sm">
              <Link href="/login" className="text-white underline-offset-4 hover:underline">Back to login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


