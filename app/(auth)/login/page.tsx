'use client'
import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { User, Lock, Eye, EyeOff } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import Image from 'next/image'
// Metadata is defined in the parent layout for auth routes

export default function LoginPage() {
  const { status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (status === 'authenticated') {
      startTransition(() => {
        router.replace('/dashboard')
      })
    }
  }, [status, router])

  const handleLogin = async () => {
    if (!email || !password || loading) return
    setError(null)
    setLoading(true)
    try {
      const res = await signIn('credentials', { email, password, redirect: false })
      if (res?.ok) {
        startTransition(() => {
          router.push('/dashboard')
        })
      } else {
        toast.error('Invalid email or password')
        setError('Invalid email or password')
      }
    } catch {
      toast.error('Failed to sign in. Please try again.')

      setError('Failed to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-900">
      <div className="pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-72 w-72 rounded-full bg-fuchsia-600/30 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-white/90 shadow-2xl backdrop-blur">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-transparent">
              <Image src="/Logo.png" alt="SaveEnv" width={40} height={40} />
            </div>
            <h1 data-testid="login-title" className="bg-gradient-to-br from-white to-white/70 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">Saveenv</h1>
            <p className="text-sm text-white/70">Sign in to your account</p>
          </div>

          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleLogin() }}>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Email</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-white/60" />
                <input
                  data-testid="email-input"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-white/10 pl-10 pr-4 py-2 text-white placeholder-white/50 outline-none ring-0 transition focus:border-indigo-400 focus:bg-white/15"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-white/60" />
                <input
                  data-testid="password-input"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-white/10 pl-10 pr-12 py-2 text-white placeholder-white/50 outline-none ring-0 transition focus:border-indigo-400 focus:bg-white/15"
                  placeholder="••••••••"
                  required
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-white/70 hover:text-white"
                  aria-label="Show/Hide password"
                  type="button"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <p data-testid="error-message" className="text-sm text-rose-400">{error}</p>
            )}

            <button
              data-testid="submit-button"
              type="submit"
              onClick={handleLogin}
              disabled={loading || !email || !password || pending}
              className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || pending ? 'Signing in…' : 'Sign in'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70"> </span>
              <Link href="/login/forgot" className="text-white underline-offset-4 hover:underline">Forgot password?</Link>
            </div>

            <p className="text-center text-sm text-white/70">
              Don&apos;t have an account?{' '}
              <Link href="/plans" className="font-semibold text-white underline-offset-4 hover:underline">
                Create account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
