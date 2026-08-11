# Kairos Esquadrilhas 3D

Plataforma SaaS para empresas de esquadrias (alumínio/vidro). Vendedor tira foto do ambiente, configura o produto, ve em 3D, calcula preco e gera proposta em PDF — tudo no celular, sem treinamento.

**Subdominio oficial:** `esquadrilhas.fbautomacao.space`

Este repositorio contem a **Sprint 0** (fundacao): login, multi-tenant, dashboard vazio, modo demo e estrutura base para as proximas sprints.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **PostgreSQL 16** + **Drizzle ORM**
- **Auth.js v5 (NextAuth)** — email/senha + modo demo
- **React Three Fiber** + **Three.js** (motor 3D ja preparado)
- **Docker** + **Dokploy**

## Pre-requisitos

- Node 20+ (recomendado 22)
- pnpm 10 (`npm i -g pnpm` ou `corepack enable`)
- Docker + Docker Compose (para o Postgres local)

## Subir em 5 minutos (modo dev local)

### 1. Instalar deps

```bash
pnpm install
```

### 2. Subir Postgres

```bash
docker compose up -d postgres
```

O `docker/postgres/init/01-schema.sql` cria todas as tabelas na primeira inicializacao.

### 3. Copiar env

```bash
cp .env.example .env.local
```

Ja vem pronto para dev local. Para gerar `AUTH_SECRET` de verdade:

```bash
openssl rand -base64 32
```

### 4. Subir o app

```bash
pnpm dev
```

Abra <http://localhost:3000>. Vai redirecionar para `/login`.

### 5. Entrar como demo

Com `ENABLE_DEMO_MODE=true` (padrao em dev), aparece o botao **"Entrar como demo"**. Clica e entra direto. Acesse o dashboard.

Credenciais alternativas (caso queira testar login tradicional):

- Email: `demo@kairos.app`
- Senha: `demo123456`

> **Producao real:** desligue o modo demo com `ENABLE_DEMO_MODE=false`. A tela de login deixa de mostrar o botao.

## O que ja funciona (Sprint 0)

- [x] Login com email/senha
- [x] Botao "Entrar como demo" (acesso 1-clique)
- [x] Multi-tenant: cada usuario pertence a um tenant, RLS no banco
- [x] Dashboard com cards de orcamentos, projetos recentes, total vendido
- [x] Logout
- [x] Onboarding inicial (preencher dados da empresa)
- [x] Catalogo seed (cores, vidros, acessorios, 4 produtos, modelos, regras de preco)
- [x] Visualizador 3D basico (janela parametrica) com R3F — placeholder da Sprint 5
- [x] Mobile-first (testado em celular)

## Estrutura

```
app/                  Next.js App Router
  (auth)/login        Tela de login (com botao demo)
  (app)/dashboard     Dashboard autenticado
  (app)/onboarding    Form de dados da empresa
  api/auth            NextAuth handler
  api/tenant          Atualiza dados do tenant
components/
  ui/                 shadcn/ui (button, input, label, card)
  shared/             Logo
  viewer3d/           ProductViewer, Window3D, Materials
lib/
  auth/               NextAuth config, password, handlers
  db/                 Drizzle schema, db client, migrate, seed
  tenant/             getTenantContext (tenant do usuario logado)
  utils.ts            cn(), formatBRL(), formatNumber(), slugify()
docker/postgres/init/ Schema SQL carregado na primeira subida do banco
middleware.ts         Protecao de rotas
Dockerfile            Build multi-stage
docker-compose.yml    Postgres + app
```

## Proximas sprints

1. CRUD de clientes
2. CRUD de catalogo (admin)
3-4. Wizard NOVO PROJETO (cliente → foto → produto → modelo → medidas → personalizacao)
5-6. Motor 3D (janela, porta, box, guarda-corpo, fechamento)
7. Motor de preco + orcamento
8. Proposta em PDF
9. Modo ANTES/DEPOIS (overlay na foto)
10. Assistente IA + PWA + testes

## Deploy no Dokploy

1. Crie um app no Dokploy e conecte o repositorio.
2. Build command: `pnpm install && pnpm build` (o Dockerfile ja cuida disso).
3. Env vars: copie de `.env.example` e ajuste:
   - `DATABASE_URL` apontando para o servico Postgres da stack
   - `AUTH_SECRET` forte
   - `NEXT_PUBLIC_APP_URL` com a URL publica
   - `ENABLE_DEMO_MODE=false` em prod final
4. Adicione um servico Postgres (Dokploy marketplace) na mesma network.
5. Apontar o dominio (ex: `esquadrias.fbautomacao.space`) para o servico.
6. Rodar migrations e seed:
   ```bash
   docker exec -it <container_app> pnpm db:migrate
   docker exec -it <container_app> pnpm db:seed
   ```

## Scripts

| Script | O que faz |
|---|---|
| `pnpm dev` | Next em dev (hot reload) |
| `pnpm build` | Build de producao |
| `pnpm start` | Roda build de producao |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Gera migration Drizzle |
| `pnpm db:migrate` | Aplica migrations |
| `pnpm db:seed` | Cria dados demo |
| `pnpm db:studio` | GUI do banco |

## Licenca

Proprietario. Todos os direitos reservados.
