# Contextos da Aplicação

Este diretório contém os contextos React que gerenciam o estado global da aplicação e centralizam as requisições à API.

## 📁 Estrutura

- `KeysContext.tsx` - Gerencia chaves mestres (keys)
- `ProjectsContext.tsx` - Gerencia projetos
- `OrganizationsContext.tsx` - Gerencia organizações
- `index.ts` - Exportações centralizadas

## 🚀 Como Usar

### 1. Providers no Layout

Os contextos já estão configurados no layout do dashboard (`app/(dashboard)/layout.tsx`):

```tsx
import { KeysProvider, ProjectsProvider, OrganizationsProvider } from '../contexts'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <KeysProvider>
      <ProjectsProvider>
        <OrganizationsProvider>
          {/* Conteúdo do dashboard */}
        </OrganizationsProvider>
      </ProjectsProvider>
    </KeysProvider>
  )
}
```

### 2. Usando os Hooks

#### Keys Context
```tsx
import { useKeys } from '@/app/contexts'

export default function MyComponent() {
  const { 
    keys, 
    loading, 
    error, 
    createKey, 
    updateKey, 
    deleteKey 
  } = useKeys()

  const handleCreateKey = async () => {
    const newKey = await createKey({
      name: 'Minha Chave',
      hint: 'Dica opcional',
      encryptedValue: 'valor_criptografado',
      valueHash: 'hash_da_chave',
      valueHashSalt: 'salt_do_hash'
    })
    
    if (newKey) {
      console.log('Chave criada:', newKey)
    }
  }

  if (loading) return <div>Carregando...</div>
  if (error) return <div>Erro: {error}</div>

  return (
    <div>
      {keys.map(key => (
        <div key={key.id}>{key.name}</div>
      ))}
    </div>
  )
}
```

#### Projects Context
```tsx
import { useProjects } from '@/app/contexts'

export default function MyComponent() {
  const { 
    projects, 
    loading, 
    createProject, 
    addVariable 
  } = useProjects()

  const handleCreateProject = async () => {
    const newProject = await createProject({
      name: 'Meu Projeto',
      description: 'Descrição do projeto',
      masterKeyId: 1
    })
    
    if (newProject) {
      console.log('Projeto criado:', newProject)
    }
  }

  const handleAddVariable = async (projectId: number) => {
    const success = await addVariable(projectId, {
      name: 'API_KEY',
      encrypted: 'valor_criptografado'
    })
    
    if (success) {
      console.log('Variável adicionada com sucesso')
    }
  }
}
```

#### Organizations Context
```tsx
import { useOrganizations } from '@/app/contexts'

export default function MyComponent() {
  const { 
    organization, 
    projects, 
    loading, 
    createOrganization, 
    inviteMember 
  } = useOrganizations()

  const handleCreateOrg = async () => {
    const newOrg = await createOrganization({
      name: 'Minha Organização',
      description: 'Descrição da organização'
    })
    
    if (newOrg) {
      console.log('Organização criada:', newOrg)
    }
  }

  const handleInvite = async () => {
    const success = await inviteMember({
      email: 'usuario@exemplo.com',
      role: 'VIEW',
      projectId: 1
    })
    
    if (success) {
      console.log('Convite enviado com sucesso')
    }
  }
}
```

## 🔄 Estado Automático

Os contextos automaticamente:
- Buscam dados ao montar o componente
- Atualizam o estado local após operações CRUD
- Gerenciam estados de loading e erro
- Exibem notificações toast para feedback do usuário

## 📡 Requisições à API

Todas as requisições HTTP estão centralizadas nos contextos:
- `GET /api/keys` - Listar chaves
- `POST /api/keys` - Criar chave
- `PUT /api/keys/:id` - Atualizar chave
- `DELETE /api/keys/:id` - Deletar chave

- `GET /api/projects` - Listar projetos
- `POST /api/projects` - Criar projeto
- `PUT /api/projects/:id` - Atualizar projeto
- `DELETE /api/projects/:id` - Deletar projeto

- `GET /api/organizations` - Buscar organização do usuário
- `POST /api/organizations` - Criar organização
- `PUT /api/organizations/:id` - Atualizar organização
- `DELETE /api/organizations/:id` - Deletar organização

## 🎯 Benefícios

1. **Estado Centralizado** - Dados compartilhados entre componentes
2. **Reutilização** - Hooks podem ser usados em qualquer lugar do dashboard
3. **Manutenibilidade** - Lógica de API centralizada
4. **Performance** - Evita múltiplas requisições desnecessárias
5. **Consistência** - Estado sempre sincronizado entre componentes
