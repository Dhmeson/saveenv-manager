# SaveEnv

## O que é o SaveEnv?

O SaveEnv é uma plataforma web desenvolvida para gerenciar e compartilhar variáveis de ambiente e credenciais de forma segura entre equipes e organizações. Ele resolve o problema comum de manter configurações sensíveis organizadas, protegidas e acessíveis apenas para pessoas autorizadas.

## Para que serve?

O SaveEnv foi criado para equipes de desenvolvimento que precisam:

- **Armazenar credenciais com segurança**: Mantenha chaves de API, senhas de banco de dados, tokens de autenticação e outras informações sensíveis em um local centralizado e criptografado.

- **Compartilhar configurações entre equipes**: Elimine o envio de variáveis de ambiente por e-mail, mensagens ou documentos não seguros. Compartilhe acessos de forma controlada com membros da sua organização.

- **Organizar projetos por ambiente**: Separe suas configurações por ambiente (desenvolvimento, staging, produção) e mantenha tudo organizado em projetos distintos.


- **Importar e exportar facilmente**: Importe variáveis de arquivos `.env` existentes ou exporte suas configurações quando necessário.


## Casos de uso

- **Equipes de desenvolvimento**: Mantenha todas as variáveis de ambiente do projeto em um único lugar, acessível para todos os desenvolvedores autorizados.

- **Organizações com múltiplos projetos**: Gerencie configurações de dezenas ou centenas de projetos de forma centralizada, com controle de acesso por projeto.

- **Ambientes de produção**: Armazene credenciais de produção de forma segura, com acesso restrito apenas para membros autorizados.

## Desenvolvimento Local com Bun

Este projeto utiliza **Bun** como runtime e gerenciador de pacotes para melhor performance e velocidade.

### Pré-requisitos

- [Bun](https://bun.sh) instalado (versão 1.1 ou superior)
- PostgreSQL instalado e rodando
- Variáveis de ambiente configuradas

### Instalação

1. **Clone o repositório** (se ainda não tiver):
   ```bash
   git clone <url-do-repositorio>
   cd saveenv-image
   ```

2. **Instale as dependências com Bun**:
   ```bash
   bun install
   ```

   O Bun é extremamente rápido e já gera o Prisma Client automaticamente via `postinstall`.

3. **Configure as variáveis de ambiente**:
   
   Crie um arquivo `.env.local` na raiz do projeto:
   ```env
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/saveenv"
   NEXTAUTH_SECRET="sua-chave-secreta-forte-aqui"
   NEXTAUTH_URL="http://localhost:3000"
   DOMAIN="localhost"
   ```

4. **Configure o banco de dados**:
   ```bash
   # Gerar o Prisma Client (já feito no postinstall, mas pode rodar manualmente)
   bun run db:generate
   
   # Aplicar as migrações ou sincronizar o schema
   bun run db:push
   # ou
   bun run db:migrate
   ```

5. **Inicie o servidor de desenvolvimento**:
   ```bash
   bun run dev
   ```

   A aplicação estará disponível em `http://localhost:3000`

### Scripts Disponíveis

- `bun run dev` - Inicia o servidor de desenvolvimento com Turbopack
- `bun run build` - Cria o build de produção
- `bun run start` - Inicia o servidor de produção
- `bun run lint` - Executa o linter
- `bun run check-env` - Verifica se as variáveis de ambiente estão configuradas corretamente
- `bun run db:generate` - Gera o Prisma Client
- `bun run db:migrate` - Executa migrações do Prisma
- `bun run db:push` - Sincroniza o schema com o banco
- `bun run db:studio` - Abre o Prisma Studio
- `bun run db:seed` - Executa o seed do banco de dados

### Troubleshooting

#### Erro: "Authentication failed against database server"

Este erro indica que o Prisma não consegue se conectar ao banco de dados. Siga estes passos:

1. **Verifique se as variáveis de ambiente estão configuradas**:
   ```bash
   bun run check-env
   ```

2. **Certifique-se de que o arquivo `.env.local` existe** na raiz do projeto com:
   ```env
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/saveenv"
   NEXTAUTH_SECRET="sua-chave-secreta-forte-aqui"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Verifique se o PostgreSQL está rodando**:
   ```bash
   # Windows (PowerShell)
   Get-Service -Name postgresql*
   
   # Linux/Mac
   sudo systemctl status postgresql
   ```

4. **Regenere o Prisma Client**:
   ```bash
   bun run db:generate
   ```

5. **Teste a conexão com o banco**:
   ```bash
   bun run db:push
   ```

#### Erro: "NEXTAUTH_URL warning"

Adicione `NEXTAUTH_URL` ao seu `.env.local`:
```env
NEXTAUTH_URL="http://localhost:3000"
```

#### Erro: "Conflicting public file and page file for path /favicon.ico"

Este é um aviso do Next.js. Você pode ignorá-lo ou remover o arquivo `app/favicon.ico` se tiver um em `public/favicon.ico` (ou vice-versa).

### Vantagens do Bun

- ⚡ **Instalação ultra-rápida**: Instala dependências muito mais rápido que npm/yarn
- 🚀 **Runtime performático**: Executa JavaScript/TypeScript nativamente com melhor performance
- 📦 **Compatível com npm**: Funciona com pacotes npm existentes sem modificações
- 🔧 **Built-in tools**: Inclui bundler, test runner e outras ferramentas

## Como usar com Docker Compose

### Pré-requisitos

- Docker instalado
- Docker Compose instalado

### Opção 1: Usando PostgreSQL em Docker

Crie um arquivo `docker-compose.yml` com o seguinte conteúdo:

```yaml
services:
  saveenv:
    image: dhmes007/saveenv:latest
    ports:
      - "${PORT:-4001}:4001"
    environment:
      - DATABASE_URL=postgresql://saveenv:saveenv@postgres:5432/saveenv
      - PORT=4001
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-change-this-in-production}
      - DOMAIN=${DOMAIN:-localhost}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - saveenv-network

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=saveenv
      - POSTGRES_PASSWORD=saveenv
      - POSTGRES_DB=saveenv
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - saveenv-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U saveenv"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:

networks:
  saveenv-network:
    driver: bridge
```

**Passo a passo:**

1. **Crie o arquivo `docker-compose.yml`** com o conteúdo acima.

2. **Configure as variáveis de ambiente** (opcional):
   
   Crie um arquivo `.env` na mesma pasta do `docker-compose.yml` com:
   ```
   PORT=4001
   NEXTAUTH_SECRET=sua-chave-secreta-forte-aqui
   DOMAIN=localhost
   ```
   
   Ou configure diretamente no `docker-compose.yml`. As principais variáveis são:
   - `PORT`: Porta onde a aplicação será executada (padrão: 4001)
   - `NEXTAUTH_SECRET`: Chave secreta para autenticação (obrigatória em produção)
   - `DOMAIN`: Domínio da aplicação (ex: `https://saveenv.com` ou `localhost` para desenvolvimento)

3. **Inicie os serviços**:
   ```bash
   docker-compose up -d
   ```

   Este comando irá:
   - Baixar a imagem do SaveEnv do Docker Hub
   - Iniciar o banco de dados PostgreSQL
   - Iniciar a aplicação SaveEnv
   - Criar uma rede Docker para comunicação entre os serviços

4. **Aguarde a inicialização**:
   
   A primeira execução pode levar alguns minutos enquanto:
   - O banco de dados é inicializado
   - As tabelas são criadas automaticamente
   - A aplicação é iniciada

5. **Acesse a aplicação**:
   
   Abra seu navegador e acesse:
   ```
   http://localhost:4001
   ```
   
   (ou a porta que você configurou)

6. **Crie sua conta**:
   
   Na primeira execução, você precisará criar uma conta de administrador. Siga as instruções na tela inicial.

### Opção 2: Usando banco de dados PostgreSQL existente

Se você já possui um banco de dados PostgreSQL, pode usar apenas a aplicação SaveEnv:

```yaml
services:
  saveenv:
    image: dhmes007/saveenv:latest
    ports:
      - "${PORT:-4001}:4001"
    environment:
      - DATABASE_URL=postgresql://usuario:senha@host:5432/nome_do_banco
      - PORT=4001
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-change-this-in-production}
      - DOMAIN=${DOMAIN:-localhost}
    restart: unless-stopped
```

**Importante:** Substitua `postgresql://usuario:senha@host:5432/nome_do_banco` pela URL de conexão do seu banco de dados PostgreSQL existente.

**Passo a passo:**

1. **Crie o arquivo `docker-compose.yml`** com o conteúdo acima, ajustando a `DATABASE_URL`.

2. **Configure as variáveis de ambiente** conforme descrito na Opção 1.

3. **Inicie o serviço**:
   ```bash
   docker-compose up -d
   ```

4. **Aguarde a inicialização** e acesse a aplicação em `http://localhost:4001`.

### Comandos úteis

- **Ver logs da aplicação**:
  ```bash
  docker-compose logs -f saveenv
  ```

- **Ver logs do banco de dados** (apenas na Opção 1):
  ```bash
  docker-compose logs -f postgres
  ```

- **Parar os serviços**:
  ```bash
  docker-compose down
  ```

- **Parar e remover volumes** (apaga os dados, apenas na Opção 1):
  ```bash
  docker-compose down -v
  ```

- **Reiniciar os serviços**:
  ```bash
  docker-compose restart
  ```

- **Atualizar para uma nova versão**:
  ```bash
  docker-compose pull
  docker-compose up -d
  ```

### Persistência de dados

Na **Opção 1**, os dados do banco de dados são armazenados em um volume Docker chamado `postgres-data`, garantindo que suas informações sejam mantidas mesmo após parar e reiniciar os containers.

Na **Opção 2**, os dados são armazenados no seu banco de dados PostgreSQL existente.

### Segurança em produção

Ao usar em produção, certifique-se de:

- Alterar as credenciais padrão do PostgreSQL no `docker-compose.yml` (Opção 1)
- Usar uma `DATABASE_URL` segura com credenciais fortes (Opção 2)
- Configurar um `NEXTAUTH_SECRET` forte e único
- Configurar o `DOMAIN` com seu domínio real
- Usar HTTPS através de um proxy reverso (como Nginx ou Traefik)
- Configurar backups regulares do banco de dados

