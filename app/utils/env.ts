import { z } from 'zod'

// Schema de validação das variáveis de ambiente
const envSchema = z.object({
  // Variáveis obrigatórias
  DATABASE_URL: z.url().min(1, 'DATABASE_URL é obrigatória'),
  
  // Variáveis opcionais com valores padrão
  PORT: z.string().default('5001'),
  DOMAIN: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
    
  // NextAuth (recomendado em produção)
  NEXTAUTH_SECRET: z.string()
})

// Tipo inferido do schema
type Env = z.infer<typeof envSchema>

// Função para validar e retornar as variáveis de ambiente
function getEnv(): Env {
  // Converte process.env para um objeto limpo (process.env pode ter propriedades extras)
  const parsed = envSchema.safeParse(process.env)
  
  if (!parsed.success) {
    const missingVars = parsed.error.issues
      .filter((err) => err.code === 'too_small' || err.code === 'invalid_type')
      .map((err) => err.path.join('.'))
    
    if (missingVars.length > 0) {
      throw new Error(
        `Variáveis de ambiente obrigatórias faltando: ${missingVars.join(', ')}\n` +
        `Erros detalhados:\n${parsed.error.issues.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n')}`
      )
    }
    
    throw new Error(
      `Erro na validação das variáveis de ambiente:\n${parsed.error.issues.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n')}`
    )
  }
  
  return parsed.data
}

// Exporta as variáveis validadas
export const env = getEnv()

// Exporta tipos para uso em outros arquivos
export type { Env }
