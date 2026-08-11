# AGENTS.md — Kairos Esquadrias 3D

Guia para agentes de IA (ou humanos) que vao trabalhar neste repositorio.

## Visao geral

Plataforma SaaS para empresas de esquadrias (alumínio/vidro) onde o vendedor tira foto do ambiente, configura o produto, ve 3D, calcula preco e gera proposta em PDF. Stack: Next.js 14, TypeScript, Tailwind, shadcn/ui, Postgres, Drizzle, NextAuth v5, R3F/Three.js, Dokploy.

## Regras de desenvolvimento

1. **Nao inventar funcionalidade que nao existe.** Se um servico externo nao esta configurado (IA, storage S3, Stripe), use mock/interface claramente separada em `lib/`.
2. **Sempre multi-tenant.** Toda tabela de negocio tem `tenant_id`. Toda query filtra por ele. Use `getTenantContext()` em vez de pegar tenant do frontend.
3. **Mobile-first.** Teste sempre no celular. Botoes com min-h-11 (44px). Tipografia base 16px. Cards grandes, poucos campos.
4. **shadcn/ui como base.** Componentes em `components/ui/`. Componentes de produto em `components/`. Logica de negocio em `lib/`.
5. **Validacao dupla:** Zod no servidor (server actions / API routes) e opcional no cliente.
6. **Numeros monetarios como `numeric` no Postgres, string no Drizzle, `number` no JS.** Formatar com `formatBRL()` antes de mostrar.
7. **3D parametrico, nunca um modelo por dimensao.** Use primitivas do R3F ou extrusoes. Carregue `.glb` apenas quando necessario.
8. **IA nunca e fonte da verdade.** Medidas vem do input humano. IA so consulta banco.

## Estrutura de pastas

```
kairos-esquadrias/
├── app/                     # Next.js App Router
│   ├── (auth)/              # Rotas publicas (login)
│   ├── (app)/               # Rotas autenticadas (dashboard, projetos, etc)
│   └── api/                 # API routes e handlers NextAuth
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   ├── shared/              # Componentes de produto (Logo, etc)
│   └── viewer3d/            # Motor 3D (ProductViewer, Window3D, Materials)
├── lib/
│   ├── auth/                # NextAuth config + handlers + password
│   ├── db/                  # Drizzle schema, migrate, seed
│   ├── tenant/              # Contexto de tenant (getTenantContext)
│   ├── pricing/             # Motor de preco (Sprint 7)
│   ├── pdf/                 # Geracao de proposta (Sprint 8)
│   ├── ai/                  # Camada abstrata de IA (Sprint 10)
│   └── utils.ts
├── types/                   # .d.ts globais
├── hooks/                   # React hooks
├── docker/postgres/init/    # SQL inicial carregado pelo container postgres
├── drizzle/                 # Migrations geradas
├── middleware.ts            # Protecao de rotas
├── docker-compose.yml
├── Dockerfile
├── drizzle.config.ts
└── .env.example
```

## Comandos uteis

| Comando | Descricao |
|---|---|
| `pnpm install` | Instalar dependencias |
| `pnpm dev` | Subir Next em dev (porta 3000) |
| `pnpm build` | Build de producao (standalone) |
| `pnpm start` | Rodar build de producao |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Gerar migration Drizzle a partir do schema |
| `pnpm db:migrate` | Aplicar migrations no banco |
| `pnpm db:seed` | Criar tenant demo + usuario demo + catalogo inicial |
| `pnpm db:studio` | Drizzle Studio (GUI do banco) |

## Variaveis de ambiente

Veja `.env.example`. Principais:

- `DATABASE_URL` — conexao Postgres
- `AUTH_SECRET` — segredo do NextAuth (gere com `openssl rand -base64 32`)
- `ENABLE_DEMO_MODE` — `true` em dev/homolog; `false` em prod final
- `AI_PROVIDER`, `OPENROUTER_API_KEY`, `AI_MODEL` — para o Assistente (Sprint 10)

## Modo demo

Com `ENABLE_DEMO_MODE=true`, a tela de login mostra o botao **"Entrar como demo"**. Clica e entra direto na empresa demo (tenant slug `demo`, usuario `demo@kairos.app`, senha `demo123456` em modo local; o login demo nao exige senha). O seed cria:

- 1 tenant "Esquadrias Demo"
- 1 usuario admin demo
- 5 cores, 5 vidros, 5 acessorios
- 4 produtos (Janela, Porta, Box, Guarda-corpo) com 2-3 modelos cada
- 1 regra de preco por modelo

## Roadmap de sprints

Veja o plano na conversa inicial. Resumo:

0. Fundacao (atual) 1. Clientes 2. Catalogo admin 3-4. Wizard 5-6. Motor 3D 7. Pricing 8. PDF 9. Antes/Depois 10. IA + PWA

## Deploy (Dokploy)

1. Suba o `docker-compose.yml` no Dokploy como stack.
2. Configure env vars no painel.
3. Caddy wildcard ja cobre `*.fbautomacao.space` → aponte `esquadrias.fbautomacao.space` para o servico `app:3000`.
4. Rodar migrations: `docker exec -it <app_container> pnpm db:migrate`.
5. Rodar seed: `docker exec -it <app_container> pnpm db:seed`.
6. (Opcional) desligar modo demo: `ENABLE_DEMO_MODE=false`.
