# 🔐 Documentação do Sistema de Autenticação

Este documento explica em detalhes como funciona o sistema de login e autenticação da aplicação SaveEnv.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Fluxo de Login](#fluxo-de-login)
- [Fluxo de Recuperação de Senha](#fluxo-de-recuperação-de-senha)
- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [Segurança](#segurança)
- [Middleware e Proteção de Rotas](#middleware-e-proteção-de-rotas)
- [Tipos e Interfaces](#tipos-e-interfaces)

---

## 🎯 Visão Geral

O sistema utiliza **NextAuth.js** para gerenciar autenticação, com as seguintes características:

- **Provedor**: Credentials (email e senha)
- **Estratégia de Sessão**: JWT (JSON Web Token)
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Segurança**: Bcrypt para hash de senhas (12 rounds)
- **Roles**: Sistema de permissões com `USER` e `ADMIN`

---

## 🛠 Tecnologias Utilizadas

- **NextAuth.js**: Framework de autenticação para Next.js
- **Prisma**: ORM para PostgreSQL
- **bcryptjs**: Hashing de senhas
- **Next.js 14+**: App Router
- **TypeScript**: Tipagem estática
- **JWT**: Tokens para sessões

---

## 🔄 Fluxo de Login

### 1. Página de Login (`/login`)

**Arquivo**: `app/(auth)/login/page.tsx`

#### Processo:

1. **Renderização da Interface**:
   - Componente Client (`'use client'`)
   - Formulário com campos: email e senha
   - Botão para mostrar/ocultar senha
   - Links para recuperação de senha e registro

2. **Verificação de Sessão**:
   ```typescript
   const { status } = useSession()
   useEffect(() => {
     if (status === 'authenticated') {
       router.replace('/dashboard')
     }
   }, [status, router])
   ```
   - Se o usuário já estiver autenticado, redireciona para `/dashboard`

3. **Submissão do Formulário**:
   ```typescript
   const handleLogin = async () => {
     const res = await signIn('credentials', { 
       email, 
       password, 
       redirect: false 
     })
     if (res?.ok) {
       router.push('/dashboard')
     } else {
       toast.error('Invalid email or password')
     }
   }
   ```
   - Chama `signIn('credentials', ...)` do NextAuth
   - `redirect: false` permite tratamento manual do resultado
   - Em caso de sucesso, redireciona para o dashboard
   - Em caso de erro, exibe mensagem via toast

### 2. Processamento no Backend (NextAuth)

**Arquivo**: `app/utils/auth.ts`

#### Configuração NextAuth:

```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      async authorize(credentials) {
        // 1. Validação de credenciais
        if (!credentials?.email || !credentials?.password) return null
        
        // 2. Busca usuário no banco
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: { id, email, name, password, role }
        })
        if (!user) return null
        
        // 3. Verifica senha
        const isValid = await verifyPassword(
          credentials.password, 
          user.password
        )
        if (!isValid) return null
        
        // 4. Retorna dados do usuário (sem a senha)
        return { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role 
        }
      }
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      // Adiciona dados do usuário ao token JWT
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      // Adiciona dados do token à sessão
      if (token && session.user) {
        session.user.id = token.id
        session.user.email = token.email
        session.user.name = token.name
        session.user.role = token.role
      }
      return session
    }
  }
}
```

#### Fluxo de Autorização:

1. **Recebe credenciais** (email e senha)
2. **Busca usuário** no banco de dados via Prisma
3. **Verifica senha** usando `bcrypt.compare()`
4. **Retorna objeto do usuário** (sem senha) ou `null` se inválido
5. **Cria token JWT** com dados do usuário
6. **Cria sessão** baseada no token

### 3. Rotas da API NextAuth

**Arquivo**: `app/api/auth/[...nextauth]/route.ts`

```typescript
import { authOptions } from "@/app/utils/auth"
import NextAuth from "next-auth"

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

- Rota catch-all `[...nextauth]` que gerencia todas as rotas do NextAuth
- `/api/auth/signin`, `/api/auth/signout`, `/api/auth/session`, etc.

### 4. Verificação de Senha

**Arquivo**: `app/utils/crypto.ts`

```typescript
import bcrypt from 'bcryptjs'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12) // 12 rounds de salt
}

export async function verifyPassword(
  password: string, 
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}
```

- **Hash**: Usa 12 rounds de bcrypt (alto custo computacional)
- **Verificação**: Compara senha em texto plano com hash armazenado

---

## 🔑 Fluxo de Recuperação de Senha

### 1. Solicitação de Reset (`/login/forgot`)

**Arquivo**: `app/(auth)/login/forgot/page.tsx`

#### Processo:

1. Usuário informa email
2. Chama API: `POST /api/auth/password/reset/request`
3. **Sempre retorna sucesso** (para evitar user enumeration)

### 2. API de Solicitação

**Arquivo**: `app/api/auth/password/reset/request/route.ts`

#### Processo:

```typescript
export async function POST(request: Request) {
  const { email } = await request.json()
  const normalizedEmail = email.trim().toLowerCase()
  
  // Sempre retorna 200 (segurança)
  const okResponse = NextResponse.json({ ok: true })
  
  const user = await prisma.user.findUnique({ 
    where: { email: normalizedEmail } 
  })
  if (!user) return okResponse
  
  // 1. Invalida tokens anteriores não utilizados
  await prisma.passwordResetToken.deleteMany({ 
    where: { userId: user.id, usedAt: null } 
  })
  
  // 2. Gera novo token seguro
  const rawToken = randomBytes(32).toString('base64url')
  const salt = randomBytes(16).toString('base64url')
  const tokenHash = createHash('sha256')
    .update(`${salt}.${rawToken}`)
    .digest('base64url')
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutos
  
  // 3. Salva no banco
  const created = await prisma.passwordResetToken.create({
    data: { userId, tokenHash, tokenSalt: salt, expiresAt }
  })
  
  // 4. Token composto: ID + token bruto
  const compoundToken = `${created.id}.${rawToken}`
  
  // 5. Envia email com link
  await sendEmail({
    to: user.email,
    subject: 'Reset your password',
    html: generateResetPasswordEmailHTML(user.email, compoundToken)
  })
  
  return okResponse
}
```

#### Características de Segurança:

- **Token único**: 32 bytes aleatórios (base64url)
- **Hash seguro**: SHA-256 do token com salt
- **Expiração**: 5 minutos
- **Uso único**: Token marcado como usado após reset
- **User Enumeration**: Sempre retorna 200, mesmo se email não existe

### 3. Reset de Senha (`/login/reset?t=TOKEN`)

**Arquivo**: `app/(auth)/login/reset/page.tsx`

#### Processo:

1. Usuário acessa link do email com token na query `?t=TOKEN`
2. Preenche nova senha (mínimo 8 caracteres)
3. Chama API: `POST /api/auth/password/reset/confirm`

### 4. API de Confirmação

**Arquivo**: `app/api/auth/password/reset/confirm/route.ts`

#### Processo:

```typescript
export async function POST(request: Request) {
  const { token, password } = await request.json()
  
  // 1. Separa ID e token bruto
  const [id, rawToken] = token.split('.')
  
  // 2. Busca registro no banco
  const record = await prisma.passwordResetToken.findUnique({ 
    where: { id } 
  })
  
  // 3. Validações
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }
  
  // 4. Verifica hash do token (timing-safe comparison)
  const candidateHash = createHash('sha256')
    .update(`${record.tokenSalt}.${rawToken}`)
    .digest()
  const storedHash = Buffer.from(record.tokenHash, 'base64url')
  
  if (!timingSafeEqual(storedHash, candidateHash)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }
  
  // 5. Atualiza senha e marca token como usado (transação)
  const newHashedPassword = await hashPassword(password)
  await prisma.$transaction([
    prisma.user.update({ 
      where: { id: record.userId }, 
      data: { password: newHashedPassword } 
    }),
    prisma.passwordResetToken.update({ 
      where: { id: record.id }, 
      data: { usedAt: new Date() } 
    }),
    prisma.passwordResetToken.deleteMany({ 
      where: { userId: record.userId, id: { not: record.id } } 
    })
  ])
  
  return NextResponse.json({ ok: true })
}
```

#### Características de Segurança:

- **Timing-safe comparison**: Previne timing attacks
- **Uso único**: Token marcado como usado
- **Transação atômica**: Garante consistência
- **Limpeza**: Remove outros tokens do usuário

---

## 📁 Estrutura de Arquivos

```
app/
├── (auth)/                    # Grupo de rotas de autenticação
│   ├── login/
│   │   ├── page.tsx          # Login padrão
│   │   ├── admin/
│   │   │   └── page.tsx      # Login admin (mesmo fluxo, UI diferente)
│   │   ├── forgot/
│   │   │   └── page.tsx      # Solicitação de reset
│   │   └── reset/
│   │       └── page.tsx      # Reset de senha
│   └── register/
│       └── page.tsx          # Registro de usuários
│
├── api/
│   └── auth/
│       ├── [...nextauth]/
│       │   └── route.ts      # Rotas NextAuth (catch-all)
│       └── password/
│           └── reset/
│               ├── request/
│               │   └── route.ts   # Solicitação de reset
│               └── confirm/
│                   └── route.ts   # Confirmação de reset
│
├── class/
│   └── Auth.ts               # Classe com métodos de autenticação
│
├── utils/
│   ├── auth.ts               # Configuração NextAuth
│   ├── crypto.ts             # Hash e verificação de senhas
│   ├── requestGuard.ts       # Detecção de requisições suspeitas
│   └── redirectToLoginClearingSession.ts  # Redirecionamento seguro
│
├── middleware.ts             # Middleware de proteção de rotas
│
types/
└── next-auth.d.ts            # Tipos TypeScript para NextAuth

prisma/
└── schema.prisma             # Schema do banco (User, PasswordResetToken, etc.)
```

---

## 🔒 Segurança

### 1. Senhas

- **Hash**: bcrypt com 12 rounds
- **Nunca armazenadas em texto plano**
- **Validação**: Comparação segura via `bcrypt.compare()`

### 2. Tokens de Reset

- **Geração**: `randomBytes(32)` (256 bits de entropia)
- **Hash**: SHA-256 com salt único por token
- **Expiração**: 5 minutos
- **Uso único**: Marcado como usado após reset
- **Timing-safe comparison**: Previne timing attacks

### 3. Sessões JWT

- **Estratégia**: JWT (não cookies de sessão no servidor)
- **Dados no token**: id, email, name, role
- **Sem informações sensíveis** no token

### 4. Proteção contra Ataques

- **User Enumeration**: Respostas idênticas para emails existentes/não existentes
- **Timing Attacks**: `timingSafeEqual()` para comparação de hashes
- **CSRF**: Proteção nativa do NextAuth
- **Request Guard**: Detecção de requisições suspeitas (via `requestGuard.ts`)

### 5. Validação de Entrada

- **Email**: Normalização (trim, lowercase)
- **Senha**: Mínimo 8 caracteres no reset
- **Tipos**: TypeScript para validação em tempo de compilação

---

## 🛡 Middleware e Proteção de Rotas

### Middleware Principal

**Arquivo**: `middleware.ts`

```typescript
import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Aplica guard de requisições suspeitas
    const guardResponse = enforceRequestGuardOrRedirect(req)
    if (guardResponse) return guardResponse
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token  // Requer token válido
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
```

#### Funcionalidades:

1. **Protege rotas**: Todas as rotas no `matcher` requerem autenticação
2. **Request Guard**: Detecta requisições suspeitas (scrapers, bots, etc.)
3. **Redirecionamento**: Usuários não autenticados são redirecionados para `/login`
4. **Limpeza de cookies**: Cookies de sessão são limpos em caso de suspeita

### Request Guard

**Arquivo**: `app/utils/requestGuard.ts`

Detecta requisições suspeitas baseado em:

- **User-Agent**: Bloqueia ferramentas conhecidas (curl, Postman, etc.)
- **Origin/Referer**: Valida contra origens permitidas
- **Sec-Fetch-Site**: Valida cabeçalhos de contexto do navegador

Configuração via variáveis de ambiente:

```env
BLOCK_SUSPICIOUS_REQUESTS=true
ALLOWED_ORIGINS=https://example.com,https://app.example.com
DISALLOWED_UA_REGEX=curl|wget|postman
```

---

## 📊 Tipos e Interfaces

### Tipos NextAuth

**Arquivo**: `types/next-auth.d.ts`

```typescript
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole  // ADMIN | USER
    }
  }
  
  interface User {
    id: string
    email: string
    role: UserRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    email?: string
    name?: string
    role?: UserRole
  }
}
```

### Schema do Banco

**Arquivo**: `prisma/schema.prisma`

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String   // Hash bcrypt
  role      UserRole @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum UserRole {
  ADMIN
  USER
}

model PasswordResetToken {
  id        String    @id @default(cuid())
  userId    String
  tokenHash String    // SHA-256 hash
  tokenSalt String    // Salt único
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
}
```

---

## 🔄 Fluxograma do Login

```
┌─────────────┐
│   Usuário   │
│  acessa     │
│  /login     │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Verifica       │
│  sessão atual   │
└──────┬──────────┘
       │
       ├─── Autenticado? ──► Redireciona /dashboard
       │
       └─── Não autenticado
              │
              ▼
┌──────────────────────┐
│  Usuário preenche    │
│  email e senha       │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  signIn('credentials')│
│  NextAuth React      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  POST /api/auth/     │
│  callback/credentials│
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  authorize()         │
│  (authOptions)       │
└──────┬───────────────┘
       │
       ├─── 1. Busca usuário no banco
       │
       ├─── 2. verifyPassword()
       │       bcrypt.compare()
       │
       ├─── 3. Retorna user ou null
       │
       ▼
┌──────────────────────┐
│  Callback jwt()      │
│  Adiciona dados      │
│  ao token            │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Callback session()  │
│  Adiciona dados      │
│  à sessão            │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Retorna resultado   │
│  res.ok = true/false │
└──────┬───────────────┘
       │
       ├─── Sucesso? ──► Redireciona /dashboard
       │
       └─── Erro? ──► Exibe mensagem de erro
```

---

## 🔑 Fluxograma do Reset de Senha

```
┌─────────────┐
│   Usuário   │
│  acessa     │
│  /forgot    │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│  Preenche email      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  POST /api/auth/     │
│  password/reset/     │
│  request             │
└──────┬───────────────┘
       │
       ├─── 1. Busca usuário
       │
       ├─── 2. Gera token seguro
       │       (randomBytes + SHA-256)
       │
       ├─── 3. Salva no banco
       │       (expira em 5 min)
       │
       ├─── 4. Envia email
       │
       └─── 5. Sempre retorna 200
              │
              ▼
┌──────────────────────┐
│  Usuário recebe      │
│  email com link      │
│  /reset?t=TOKEN      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Preenche nova senha │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  POST /api/auth/     │
│  password/reset/     │
│  confirm             │
└──────┬───────────────┘
       │
       ├─── 1. Valida token
       │       (hash + expiração)
       │
       ├─── 2. timingSafeEqual()
       │
       ├─── 3. Atualiza senha
       │       (hash novo)
       │
       ├─── 4. Marca token usado
       │
       └─── 5. Remove outros tokens
              │
              ▼
┌──────────────────────┐
│  Redireciona /login  │
└──────────────────────┘
```

---

## 📝 Resumo

### Login
- ✅ NextAuth.js com Credentials Provider
- ✅ JWT para sessões
- ✅ Bcrypt para hash de senhas (12 rounds)
- ✅ Validação no backend
- ✅ Redirecionamento automático

### Recuperação de Senha
- ✅ Tokens seguros (SHA-256 + salt)
- ✅ Expiração de 5 minutos
- ✅ Uso único
- ✅ Proteção contra user enumeration
- ✅ Timing-safe comparison

### Segurança
- ✅ Middleware de proteção
- ✅ Request guard
- ✅ Validação de entrada
- ✅ CSRF protection (NextAuth)
- ✅ Tipagem TypeScript

---

## 🚀 Como Usar

### Login
```typescript
import { signIn } from 'next-auth/react'

await signIn('credentials', {
  email: 'user@example.com',
  password: 'password123',
  redirect: false
})
```

### Verificar Sessão (Cliente)
```typescript
import { useSession } from 'next-auth/react'

const { data: session, status } = useSession()
// status: 'loading' | 'authenticated' | 'unauthenticated'
```

### Verificar Sessão (Servidor)
```typescript
import { getServerAuthSession } from '@/app/utils/auth'

const session = await getServerAuthSession()
if (!session) {
  // Não autenticado
}
```

### Proteger Rota (Server Component)
```typescript
import { getServerAuthSession } from '@/app/utils/auth'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const session = await getServerAuthSession()
  if (!session) {
    redirect('/login')
  }
  return <div>Conteúdo protegido</div>
}
```

---

**Última atualização**: Dezembro 2024

