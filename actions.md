1. Configurar os Segredos no GitHub

Para que o GitHub tenha permissão de postar no seu Docker Hub, você precisa cadastrar suas credenciais:

    Vá no seu repositório no GitHub.

    Clique em Settings > Secrets and variables > Actions.

    Clique em New repository secret e adicione:

        DOCKERHUB_USERNAME: Seu nome de usuário do Docker Hub.

        DOCKERHUB_TOKEN: (Recomendado criar um "Access Token" no painel do Docker Hub em Account Settings > Security, em vez de usar sua senha real).

2. Criar o arquivo do Workflow

Crie a pasta .github/workflows/ na raiz do seu projeto e, dentro dela, um arquivo chamado docker-publish.yml:
YAML

name: Build and Push Docker Image

on:
  push:
    branches: [ "main" ] # Executa quando houver push na main
  pull_request:
    branches: [ "main" ]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout do código
        uses: actions/checkout@v4

      - name: Login no Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and Push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/nome-do-seu-projeto:latest

3. O Ciclo de Vida do seu Projeto Open Source

Agora que tudo está conectado, o fluxo de trabalho será assim:

    Desenvolvimento: Você faz uma melhoria no seu gerenciador de senhas localmente.

    Push: Você envia o código para o GitHub (git push origin main).

    Automação: O GitHub Actions percebe o push, lê o seu Dockerfile, gera a imagem e a envia para o Docker Hub.

    Disponibilidade: Em poucos minutos, qualquer pessoa no mundo pode baixar a versão mais nova rodando apenas docker pull seu-usuario/seu-projeto.


    Essa é a melhor forma de manter seu projeto atualizado sem esforço manual. Vamos configurar o GitHub Actions. Toda vez que você der um git push na branch principal (main), o GitHub vai construir a imagem e enviar para o Docker Hub automaticamente.
1. Configurar os Segredos no GitHub

Para que o GitHub tenha permissão de postar no seu Docker Hub, você precisa cadastrar suas credenciais:

    Vá no seu repositório no GitHub.

    Clique em Settings > Secrets and variables > Actions.

    Clique em New repository secret e adicione:

        DOCKERHUB_USERNAME: Seu nome de usuário do Docker Hub.

        DOCKERHUB_TOKEN: (Recomendado criar um "Access Token" no painel do Docker Hub em Account Settings > Security, em vez de usar sua senha real).

2. Criar o arquivo do Workflow

Crie a pasta .github/workflows/ na raiz do seu projeto e, dentro dela, um arquivo chamado docker-publish.yml:
YAML

name: Build and Push Docker Image

on:
  push:
    branches: [ "main" ] # Executa quando houver push na main
  pull_request:
    branches: [ "main" ]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout do código
        uses: actions/checkout@v4

      - name: Login no Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and Push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/nome-do-seu-projeto:latest

3. O Ciclo de Vida do seu Projeto Open Source

Agora que tudo está conectado, o fluxo de trabalho será assim:

    Desenvolvimento: Você faz uma melhoria no seu gerenciador de senhas localmente.

    Push: Você envia o código para o GitHub (git push origin main).

    Automação: O GitHub Actions percebe o push, lê o seu Dockerfile, gera a imagem e a envia para o Docker Hub.

    Disponibilidade: Em poucos minutos, qualquer pessoa no mundo pode baixar a versão mais nova rodando apenas docker pull seu-usuario/seu-projeto.

Dica de Ouro: O Arquivo .env.example

Para que os usuários saibam o que configurar no Docker, deixe um arquivo .env.example no seu GitHub assim:
Snippet de código

# Banco de Dados (Prisma)
DATABASE_URL="postgresql://user:password@localhost:5432/db"

# Segurança
NEXTAUTH_SECRET="gerar-uma-chave-aleatoria"
ENCRYPTION_KEY="chave-de-32-caracteres-para-criptografia"

# Configurações do App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

O que você acha de eu te ajudar agora a escrever a seção "Como rodar com Docker" para colocar no seu README.md? É a parte que os usuários mais leem.