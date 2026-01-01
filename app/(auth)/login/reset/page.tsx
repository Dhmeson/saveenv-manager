'use client'
import { Suspense, useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

function ResetPasswordForm() {
  const params = useSearchParams()
  const token = params.get('t') || ''
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or expired link')
    }
  }, [token])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !password || password !== confirm) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/password/reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (!res.ok) throw new Error('invalid')
      toast.success('Password updated. Please sign in.')
      startTransition(() => router.replace('/login'))
    } catch {
      toast.error('Invalid or expired link')
    } finally {
      setLoading(false)
    }
  }

  const disabled = !token || !password || password.length < 8 || password !== confirm || loading || pending

  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-white/90 shadow-2xl backdrop-blur">
      <h1 className="mb-4 text-xl font-bold">Create a new password</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password (min 8 chars)"
          className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white placeholder-white/50 outline-none focus:border-indigo-400"
          required
          minLength={8}
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white placeholder-white/50 outline-none focus:border-indigo-400"
          required
          minLength={8}
        />
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-400 disabled:opacity-50"
        >
          {loading || pending ? 'Updating…' : 'Update password'}
        </button>
        <div className="text-center text-sm">
          <Link href="/login" className="text-white underline-offset-4 hover:underline">Back to login</Link>
        </div>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-900">
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <Suspense fallback={<div className="text-white">Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}


