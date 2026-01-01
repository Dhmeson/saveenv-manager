'use client'

import { startTransition } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { User, Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

// Componente interno que usa useSearchParams
export function RegisterFreePlanForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)


  const handleRegister = async () => {
    if (!name || !email || !password) {
      toast.error('Todos os campos são obrigatórios!')
      return
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem!')
      return
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres!')
      return
    }

    try {
      const res = await fetch('/api/register/freePlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Erro ao finalizar o cadastro!')
        return
      }

      toast.success('Conta criada com sucesso!')
      
      // Fazer login automaticamente
      const signInResult = await signIn('credentials', { 
        email, 
        password, 
        redirect: false 
      })

      if (signInResult?.ok) {
        startTransition(() => {
          router.push('/dashboard')
        })
      } else {
        toast.error('Erro ao fazer login. Tente novamente.')
      }

    } catch (error) {
      console.error('Register error:', error)
      toast.error('Erro inesperado. Tente novamente.')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-white/80">Nome</label>
        <div className="relative">
          <User className="absolute left-3 top-2.5 h-5 w-5 text-white/60" />
          <input
            data-testid="name-input"
            type="text"
            name="name"
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
            data-testid="email-input"
            type="email"
            name="email"
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
            data-testid="confirm-password-input"
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
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
        data-testid="submit-button"
        type="submit"
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