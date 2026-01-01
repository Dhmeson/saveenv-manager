"use client";
import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Image from "next/image";
import { Lock, Eye, EyeOff, User as UserIcon, Shield } from "lucide-react";
import { toast } from 'sonner'

export default function Home() {
  const router = useRouter()
  const [loginType, setLoginType] = useState<'admin' | 'user' | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  
  // Estados para o modal de cadastro de admin
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('')
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [showAdminConfirmPassword, setShowAdminConfirmPassword] = useState(false)
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState<string | null>(null)

  // Verificar se existe admin ao carregar a página
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/admin/check')
        const data = await res.json()
        
        if (!data.exists) {
          setShowAdminModal(true)
        }
      } catch (error) {
        console.error('Error checking admin:', error)
      } finally {
        setCheckingAdmin(false)
      }
    }

    checkAdmin()
  }, [])

  const handleLogin = async () => {
    if (!email || !password || loading || !loginType) return
    setError(null)
    setLoading(true)
    try {
      const res = await signIn('credentials', { email, password, redirect: false })
      if (res?.ok) {
        // Buscar informações do usuário para verificar a role
        const userRes = await fetch('/api/me')
        if (userRes.ok) {
          const userData = await userRes.json()
          
          // Verificar se o tipo de login corresponde à role
          if (loginType === 'admin' && userData.role !== 'ADMIN') {
            toast.error('Access denied. This account is not an admin.')
            setError('Access denied. This account is not an admin.')
            setLoading(false)
            return
          }
          
          startTransition(() => {
            if (userData.role === 'ADMIN') {
              router.push('/users')
            } else {
              router.push('/dashboard')
            }
          })
        } else {
          startTransition(() => {
            router.push('/dashboard')
          })
        }
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

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setError(null)
    setShowPassword(false)
  }

  const handleCreateAdmin = async () => {
    if (!adminName || !adminEmail || !adminPassword || !adminConfirmPassword) {
      setAdminError('All fields are required')
      return
    }

    if (adminPassword !== adminConfirmPassword) {
      setAdminError('Passwords do not match')
      return
    }

    if (adminPassword.length < 6) {
      setAdminError('Password must be at least 6 characters')
      return
    }

    setAdminError(null)
    setAdminLoading(true)

    try {
      const res = await fetch('/api/admin/first-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: adminName,
          email: adminEmail,
          password: adminPassword
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setAdminError(data.error || 'Failed to create admin')
        return
      }

      toast.success('Admin created successfully!')
      setShowAdminModal(false)
      resetAdminForm()
    } catch (error) {
      console.error('Create admin error:', error)
      setAdminError('Failed to create admin. Please try again.')
    } finally {
      setAdminLoading(false)
    }
  }

  const resetAdminForm = () => {
    setAdminName('')
    setAdminEmail('')
    setAdminPassword('')
    setAdminConfirmPassword('')
    setAdminError(null)
    setShowAdminPassword(false)
    setShowAdminConfirmPassword(false)
  }

  // Mostrar loading enquanto verifica admin
  if (checkingAdmin) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-900">
        <div className="pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 -bottom-32 h-72 w-72 rounded-full bg-fuchsia-600/30 blur-3xl" />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="text-white/70">Loading...</div>
        </div>
      </div>
    )
  }

  if (!loginType) {
    return (
      <>
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-900">
          <div className="pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl" />
          <div className="pointer-events-none absolute -right-32 -bottom-32 h-72 w-72 rounded-full bg-fuchsia-600/30 blur-3xl" />

          <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
            <div className="w-full max-w-2xl">
              <div className="text-center mb-12">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/10">
                  <Image src="/Logo.png" alt="SaveEnv" width={48} height={48} />
                </div>
                <h1 className="bg-gradient-to-br from-white to-white/70 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent mb-3">
                  Saveenv
                </h1>
                <p className="text-lg text-white/70">Choose your login type</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Admin Login Card */}
                <button
                  onClick={() => setLoginType('admin')}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 text-left text-white/90 shadow-2xl backdrop-blur transition-all hover:bg-white/10 hover:border-indigo-500/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 transition group-hover:from-indigo-500/10 group-hover:to-purple-500/10" />
                  <div className="relative z-10">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/20">
                      <Shield className="h-7 w-7 text-indigo-300" />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold text-white">Admin Login</h2>
                    <p className="text-white/70">
                      Access user management and system administration
                    </p>
                  </div>
                </button>

                {/* User Login Card */}
                <button
                  onClick={() => setLoginType('user')}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 text-left text-white/90 shadow-2xl backdrop-blur transition-all hover:bg-white/10 hover:border-indigo-500/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 transition group-hover:from-indigo-500/10 group-hover:to-purple-500/10" />
                  <div className="relative z-10">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-white/20 bg-white/10">
                      <UserIcon className="h-7 w-7 text-white/70" />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold text-white">User Login</h2>
                    <p className="text-white/70">
                      Access your projects and manage environment variables
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Cadastro de Admin */}
        {showAdminModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <div className="relative z-50 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 p-6 text-white/90 shadow-2xl backdrop-blur">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/20">
                    <Shield className="h-6 w-6 text-indigo-300" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Create First Admin</h2>
                  <p className="text-sm text-white/70 mt-1">
                    No admin found. Please create the first administrator account.
                  </p>
                </div>
                {/* Botão de fechar removido - modal não pode ser fechado até criar admin */}
              </div>

              <form 
                className="space-y-4" 
                onSubmit={(e) => { e.preventDefault(); handleCreateAdmin() }}
              >
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-white/60" />
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-white/10 pl-10 pr-4 py-2 text-white placeholder-white/50 outline-none ring-0 transition focus:border-indigo-400 focus:bg-white/15"
                      placeholder="Administrator"
                      required
                      disabled={adminLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">Email</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-white/60" />
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-white/10 pl-10 pr-4 py-2 text-white placeholder-white/50 outline-none ring-0 transition focus:border-indigo-400 focus:bg-white/15"
                      placeholder="admin@example.com"
                      required
                      disabled={adminLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-white/60" />
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-white/10 pl-10 pr-12 py-2 text-white placeholder-white/50 outline-none ring-0 transition focus:border-indigo-400 focus:bg-white/15"
                      placeholder="••••••••"
                      required
                      disabled={adminLoading}
                    />
                    <button
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-2.5 text-white/70 hover:text-white"
                      aria-label="Show/Hide password"
                      type="button"
                      disabled={adminLoading}
                    >
                      {showAdminPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-white/60" />
                    <input
                      type={showAdminConfirmPassword ? 'text' : 'password'}
                      value={adminConfirmPassword}
                      onChange={(e) => setAdminConfirmPassword(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-white/10 pl-10 pr-12 py-2 text-white placeholder-white/50 outline-none ring-0 transition focus:border-indigo-400 focus:bg-white/15"
                      placeholder="••••••••"
                      required
                      disabled={adminLoading}
                    />
                    <button
                      onClick={() => setShowAdminConfirmPassword(!showAdminConfirmPassword)}
                      className="absolute right-3 top-2.5 text-white/70 hover:text-white"
                      aria-label="Show/Hide password"
                      type="button"
                      disabled={adminLoading}
                    >
                      {showAdminConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {adminError && (
                  <p className="text-sm text-rose-400">{adminError}</p>
                )}

                <button
                  type="submit"
                  disabled={adminLoading || !adminName || !adminEmail || !adminPassword || !adminConfirmPassword}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adminLoading ? 'Creating admin…' : 'Create Admin'}
                </button>
              </form>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-900">
      <div className="pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-32 h-72 w-72 rounded-full bg-fuchsia-600/30 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-white/90 shadow-2xl backdrop-blur">
          <div className="mb-6">
            <button
              onClick={() => {
                setLoginType(null)
                resetForm()
              }}
              className="mb-4 text-white/70 hover:text-white transition flex items-center gap-2 text-sm"
            >
              ← Back to login options
            </button>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/10">
                {loginType === 'admin' ? (
                  <Shield className="h-8 w-8 text-indigo-300" />
                ) : (
                  <UserIcon className="h-8 w-8 text-white/70" />
                )}
              </div>
              <h1 className="bg-gradient-to-br from-white to-white/70 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
                {loginType === 'admin' ? 'Admin Login' : 'User Login'}
              </h1>
              <p className="text-sm text-white/70 mt-2">Sign in to your {loginType === 'admin' ? 'admin' : 'user'} account</p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleLogin() }}>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">Email</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-white/60" />
                <input
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
              <p className="text-sm text-rose-400">{error}</p>
            )}

            <button
              type="submit"
              onClick={handleLogin}
              disabled={loading || !email || !password || pending}
              className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || pending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
