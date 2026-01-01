'use client'

import { startTransition } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { User, Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleRegister = async () => {
    if (!name || !email || !password || password !== confirmPassword) return
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    })
    if(!res.ok)return  toast.error('Erro ao finalizar o cadastro!')
    await signIn('credentials', { email, password, redirect: false })
    startTransition(() => {router.push('/dashboard')})
    
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">Nome</label>
        <div className="relative">
          <User className="absolute left-3 top-2.5 h-5 w-5 text-white/60" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/10 pl-10 pr-4 py-2 text-white placeholder-white/50 outline-none ring-0 transition focus:border-indigo-400 focus:bg-white/15"
            placeholder="Seu nome"
            required
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-white/60" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/10 pl-10 pr-4 py-2 text-white placeholder-white/50 outline-none ring-0 transition focus:border-indigo-400 focus:bg-white/15"
            placeholder="seu@email.com"
            required
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">Senha</label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-white/60" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/10 pl-10 pr-12 py-2 text-white placeholder-white/50 outline-none ring-0 transition focus:border-indigo-400 focus:bg-white/15"
            placeholder="••••••••"
            required
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-white/70 hover:text-white"
            aria-label="Mostrar/ocultar senha"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">Confirmar senha</label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-white/60" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/10 pl-10 pr-12 py-2 text-white placeholder-white/50 outline-none ring-0 transition focus:border-indigo-400 focus:bg-white/15"
            placeholder="••••••••"
            required
          />
          <button
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-2.5 text-white/70 hover:text-white"
            aria-label="Mostrar/ocultar senha"
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <button
        onClick={handleRegister}
        className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-400"
      >
        Criar conta
      </button>

      <p className="text-center text-sm text-white/70">
        Já tem uma conta?{' '}
        <Link href="/login" className="font-semibold text-white underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}