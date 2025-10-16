# Defenz - Gestão Estratégica de Atividades

## ⚠️ IMPORTANTE: Claude Code SDK como Base

**ESTE PROJETO SEGUE ESTRITAMENTE O CLAUDE CODE SDK**

Todo desenvolvimento, estrutura e workflow deste projeto são baseados no Claude Code SDK. Este é um requisito fundamental e não negociável.

### Princípios Fundamentais:
- ✅ **Sempre consultar a documentação oficial do SDK** quando houver dúvidas
- ✅ **Utilizar os agentes especializados** definidos em `.claude/agents/`
- ✅ **Seguir as convenções e padrões** estabelecidos pelo SDK
- ✅ **Respeitar a estrutura de arquivos e organização** do SDK

### Documentação Oficial:
- **SDK Overview**: https://docs.claude.com/en/docs/claude-code/sdk/sdk-overview
- **Mapa de Documentação**: https://docs.claude.com/en/docs/claude-code/claude_code_docs_map.md
- **Documentação Completa**: https://docs.claude.com/en/docs/claude-code

### Quando Consultar a Documentação:
- Ao criar novos agentes especializados
- Ao modificar configurações do SDK
- Ao implementar workflows complexos
- Em caso de dúvidas sobre melhores práticas
- Antes de desviar de qualquer padrão estabelecido

**⚡ LEMBRE-SE: O SDK é a fundação. Não improvise sem consultar a documentação.**

---

## Visão Geral do Projeto

Aplicação completa para gerenciamento de atividades estratégicas do projeto Defenz, desenvolvida com Next.js 15, TypeScript, Prisma ORM e Neon Database.

## Stack Tecnológica

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Neon DB) em todos ambientes
  - Connection pooling via PgBouncer (integrado no Neon)
  - Suporte a conexões serverless (Vercel)
- **Real-time**: Socket.IO
- **Deploy**: Vercel
- **Autenticação**: NextAuth.js v5
- **Validação**: Zod v3.x (estável)

## Estrutura do Projeto

```
.
├── .claude/                    # Configurações do Claude Code SDK
│   ├── agents/                # Agentes especializados
│   │   ├── react-developer.md
│   │   ├── database-architect.md
│   │   ├── api-developer.md
│   │   └── deployment-specialist.md
│   └── settings.local.json    # Configurações locais
├── prisma/                    # Schema e migrations do Prisma
│   └── schema.prisma
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API Routes
│   │   │   ├── activities/   # CRUD de atividades
│   │   │   ├── auth/         # NextAuth routes
│   │   │   └── health/       # Health check
│   │   ├── dashboard/        # Páginas do dashboard
│   │   │   ├── page.tsx      # Dashboard principal
│   │   │   ├── activities/   # Gestão de atividades
│   │   │   ├── analytics/    # Análises e gráficos
│   │   │   └── calendar/     # Calendário
│   │   └── page.tsx          # Login page
│   ├── components/           # Componentes React
│   │   └── ui/              # Componentes shadcn/ui
│   ├── lib/                 # Utilitários e configurações
│   │   ├── auth-config.ts   # Configuração centralizada NextAuth
│   │   ├── db-utils.ts      # Utilidades cross-database
│   │   ├── api-helpers.ts   # Helpers para API routes
│   │   └── validations/     # Schemas Zod
│   └── types/               # Type definitions
│       └── next-auth.d.ts   # Extensões NextAuth
├── public/                   # Assets estáticos
├── server.ts                # Custom server com Socket.IO
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## Modelos de Dados

### User
- Usuários do sistema com autenticação
- Relacionamento 1:N com Activities

### Activity
- Atividades estratégicas do projeto
- Campos: título, descrição, área, prioridade, status, responsável, prazo, local, método, custo
- Soft delete implementado (deletedAt)

## Funcionalidades Implementadas

✅ Autenticação simples (em desenvolvimento para NextAuth)
✅ Dashboard interativo com KPIs
✅ CRUD completo de atividades
✅ Filtros e busca avançada
✅ Análises e gráficos
✅ Importação de dados da planilha
✅ Design responsivo
✅ Integração Socket.IO para real-time

## Configuração de Infraestrutura

### 🔴 CRÍTICO: Database Configuration

**Este projeto usa PostgreSQL (Neon) em TODOS os ambientes - desenvolvimento, staging e produção.**

#### Requisitos Fundamentais:

1. **Provider do Prisma**: SEMPRE PostgreSQL
   ```prisma
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"  // NUNCA "sqlite"
     url      = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```

2. **Connection Pooling**: Obrigatório para Vercel (serverless)
   - `DATABASE_URL`: Pooled connection (pgbouncer) - usado em produção
   - `DIRECT_URL`: Direct connection - usado para migrations
   - Neon fornece ambas automaticamente

3. **Variáveis de Ambiente Necessárias**:
   ```env
   # Neon Database (REQUIRED)
   DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname?sslmode=require&pgbouncer=true"
   DIRECT_URL="postgresql://user:pass@host.neon.tech/dbname?sslmode=require"

   # NextAuth (REQUIRED)
   NEXTAUTH_URL="http://localhost:3000"  # Produção: https://seu-dominio.vercel.app
   NEXTAUTH_SECRET="gere-um-secret-seguro-aqui"
   ```

4. **Configuração Vercel**:
   - Adicionar TODAS as variáveis de ambiente no Vercel Dashboard
   - DATABASE_URL deve usar pgbouncer=true
   - DIRECT_URL não deve ter pgbouncer

#### Por que Connection Pooling?

Vercel é serverless - cada request pode criar uma nova conexão com o banco. Sem pooling:
- Estouro de limite de conexões PostgreSQL
- Latência alta ao abrir conexões
- Build failures em produção
- Custos elevados no Neon

#### Validação de Configuração:

```bash
# Verificar schema
npx prisma validate

# Testar conexão (pooled)
npx prisma db push --skip-generate

# Verificar migrations (direct)
npx prisma migrate status
```

### Arquitetura Cross-Database

Para manter compatibilidade e evitar vendor lock-in, queries case-insensitive usam `db-utils.ts`:

```typescript
// src/lib/db-utils.ts
import prisma from '@/lib/prisma'

export const caseInsensitiveSearch = (field: string, value: string) => {
  // PostgreSQL: usa mode: 'insensitive'
  // SQLite: usa LOWER()
  return { [field]: { contains: value, mode: 'insensitive' as const } }
}
```

**Uso nas APIs**:
```typescript
import { caseInsensitiveSearch } from '@/lib/db-utils'

const activities = await prisma.activity.findMany({
  where: {
    ...caseInsensitiveSearch('title', searchTerm)
  }
})
```

## Agentes Disponíveis

### react-developer
Especialista em componentes React com TypeScript, Tailwind CSS e best practices.
- Componentes funcionais
- TypeScript strict mode
- Hooks customizados
- Performance otimizada

### database-architect
Especialista em Prisma ORM, PostgreSQL e Neon Database.
- Design de schema
- Migrations
- Otimização de queries
- Connection pooling

### api-developer
Especialista em APIs RESTful com Next.js App Router.
- Route handlers
- Validação com Zod
- Tratamento de erros
- Paginação e caching

### deployment-specialist
Especialista em deploy na Vercel com Neon DB.
- Configuração de ambiente
- CI/CD
- Performance optimization
- Monitoring

## Débitos Técnicos Resolvidos

### Histórico de Problemas Críticos e Soluções

Esta seção documenta problemas críticos enfrentados e suas soluções para evitar regressões.

#### 1. Migração SQLite → PostgreSQL (Janeiro 2025)

**Problema**: Build falhando em produção com erro "the URL must start with the protocol `file:`"
- Schema Prisma configurado para SQLite localmente
- Neon (PostgreSQL) em produção
- Incompatibilidade causando falhas de deploy

**Solução Implementada**:
- Migrado completamente para PostgreSQL em todos ambientes
- Configurado connection pooling (pgbouncer)
- Atualizado schema.prisma: `provider = "postgresql"`
- Documentação: Ver `MIGRATION_REPORT.md`

**Commit**: `89075e1`

**Lições Aprendidas**:
- Sempre usar o mesmo banco em todos ambientes
- Validar schema antes de cada deploy: `npx prisma validate`
- Connection pooling é obrigatório para serverless

---

#### 2. Incompatibilidade Zod v4 (Janeiro 2025)

**Problema**: Zod v4.0.0-beta causando quebras de tipos e validações
- Versão beta instável
- Breaking changes não documentados
- Erros de TypeScript em produção

**Solução Implementada**:
- Downgrade para Zod v3.24.1 (versão estável)
- Atualizado package.json: `"zod": "^3.24.1"`
- Re-testadas todas validações de API

**Commit**: Incluído nas correções TypeScript

**Lições Aprendidas**:
- Evitar versões beta em produção
- Sempre usar versões estáveis de dependências críticas
- Documentar versões específicas no package.json

---

#### 3. NextAuth Type Extensions (Janeiro 2025)

**Problema**: Erros TypeScript ao estender tipos User/Session do NextAuth
- Property 'id' não existe em User
- Tipos padrão insuficientes para o projeto

**Solução Implementada**:
- Criado `src/types/next-auth.d.ts` com extensões de tipos
- Estendido User interface com `id`, `name`, `email`
- Estendido Session interface com `user.id`
- Centralizada configuração em `src/lib/auth-config.ts`

**Arquivos Criados**:
```typescript
// src/types/next-auth.d.ts
declare module "next-auth" {
  interface User {
    id: string
    name?: string | null
    email?: string | null
  }

  interface Session {
    user: User
  }
}
```

**Lições Aprendidas**:
- Sempre criar type declarations para extensões de bibliotecas
- Centralizar configurações (auth-config.ts) para reuso
- TypeScript strict mode revela problemas antes de produção

---

#### 4. Queries Case-Insensitive Cross-Database (Janeiro 2025)

**Problema**: Queries case-sensitive quebrando quando migrando entre bancos
- SQLite: usa LOWER()
- PostgreSQL: usa mode: 'insensitive'
- Código duplicado e inconsistente

**Solução Implementada**:
- Criado `src/lib/db-utils.ts` com abstrações
- Função `caseInsensitiveSearch()` cross-database
- Atualizado todas APIs para usar a abstração

**Exemplo**:
```typescript
// Antes (específico PostgreSQL)
where: { title: { contains: search, mode: 'insensitive' } }

// Depois (cross-database)
where: { ...caseInsensitiveSearch('title', search) }
```

**Lições Aprendidas**:
- Abstrair diferenças de banco em utilities
- Facilita migrations futuras
- Código mais limpo e manutenível

---

#### 5. Estrutura de APIs (Janeiro 2025)

**Problema**: Code smell e duplicação em route handlers
- Validação inconsistente
- Tratamento de erros duplicado
- Falta de helpers reutilizáveis

**Solução Implementada**:
- Criado `src/lib/api-helpers.ts` com helpers reutilizáveis
- Criado `src/lib/validations/activity.ts` com schemas Zod
- Padrão consistente em todas APIs

**Arquivos Criados**:
- `src/lib/api-helpers.ts`: handleApiError(), validateRequest()
- `src/lib/validations/activity.ts`: createActivitySchema, updateActivitySchema

**Lições Aprendidas**:
- DRY: Don't Repeat Yourself
- Validação centralizada com Zod
- Error handling consistente melhora debugging

---

### Referências de Documentação

Documentos criados durante resolução dos débitos técnicos:

- **MIGRATION_REPORT.md**: Relatório completo da migração SQLite → PostgreSQL
- **POST_MIGRATION_CHECKLIST.md**: Checklist de validação pós-migração
- **TROUBLESHOOTING.md**: Guia de troubleshooting comum

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev                    # Iniciar servidor de desenvolvimento
npm run build                  # Build de produção
npm run start                  # Iniciar em produção
npm run lint                   # Verificar código

# Database
npm run db:push               # Sincronizar schema com DB (dev)
npm run db:generate           # Gerar Prisma Client
npm run db:migrate            # Criar migration (dev)
npm run db:studio             # Abrir Prisma Studio

# Deploy
vercel                        # Deploy preview
vercel --prod                 # Deploy production
```

## Variáveis de Ambiente

Ver `.env.example` para lista completa. Principais:

### Desenvolvimento Local (.env.local):
```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:pass@host.neon.tech/dbname?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua-secret-key-gerada-com-openssl"

# Opcional
NODE_ENV="development"
```

### Produção (Vercel Environment Variables):
```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:pass@host.neon.tech/dbname?sslmode=require"

# NextAuth
NEXTAUTH_URL="https://seu-app.vercel.app"
NEXTAUTH_SECRET="sua-secret-key-segura-diferente-do-dev"

# Opcional
NODE_ENV="production"
```

### Obter Connection Strings do Neon:

1. Acesse [Neon Console](https://console.neon.tech)
2. Selecione seu projeto
3. Vá em "Connection Details"
4. Copie:
   - **Pooled connection** (com `?pgbouncer=true`) → `DATABASE_URL`
   - **Direct connection** (sem pgbouncer) → `DIRECT_URL`

### Gerar NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Desenvolvimento

### Iniciar Projeto
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais

# Sincronizar database
npm run db:push

# Iniciar desenvolvimento
npm run dev
```

### Criar Nova Feature

1. **Frontend (Componente React)**:
   - Criar componente em `src/components/`
   - Usar agente `react-developer` para assistência
   - Seguir padrões: TypeScript strict, Tailwind CSS, componentes funcionais

2. **Backend (API)**:
   - Criar route handler em `src/app/api/`
   - Usar agente `api-developer` para assistência
   - Validar inputs com Zod
   - Tratamento de erros consistente

3. **Database**:
   - Modificar `prisma/schema.prisma`
   - Usar agente `database-architect` para assistência
   - Criar migration: `npm run db:migrate`
   - Gerar client: `npm run db:generate`

## Checklist Pré-Deploy

### ⚠️ VALIDAÇÕES OBRIGATÓRIAS ANTES DE PUSH/DEPLOY

Execute estas validações **SEMPRE** antes de fazer push para `main` ou deploy:

#### 1. Validação de Build
```bash
# Build deve passar sem erros
npm run build

# Verificar output:
# ✓ Compiled successfully
# ✓ Linting and checking validity of types
# ✓ Collecting page data
# ✓ Generating static pages
```

**Se falhar**: Corrigir erros antes de continuar. Não fazer push com build quebrado.

---

#### 2. Validação TypeScript
```bash
# Type checking completo
npx tsc --noEmit

# Deve retornar sem erros
# Se houver erros, corrija todos antes de deploy
```

**Erros comuns**:
- Tipos do NextAuth: verificar `src/types/next-auth.d.ts`
- Tipos do Prisma: rodar `npx prisma generate`
- Imports faltando: adicionar imports necessários

---

#### 3. Validação Database Schema
```bash
# Validar schema Prisma
npx prisma validate

# Output esperado:
# The schema is valid ✓
```

**Verificar**:
- `provider = "postgresql"` (NUNCA "sqlite")
- `url = env("DATABASE_URL")`
- `directUrl = env("DIRECT_URL")`

---

#### 4. Validação de Variáveis de Ambiente

**Local (.env.local)**:
```bash
# Verificar se todas variáveis existem
cat .env.local | grep -E "DATABASE_URL|DIRECT_URL|NEXTAUTH_URL|NEXTAUTH_SECRET"
```

**Vercel (antes do deploy)**:
1. Acessar [Vercel Dashboard](https://vercel.com/dashboard)
2. Settings → Environment Variables
3. Verificar:
   - `DATABASE_URL` (com pgbouncer=true)
   - `DIRECT_URL` (sem pgbouncer)
   - `NEXTAUTH_URL` (URL de produção)
   - `NEXTAUTH_SECRET` (diferente do dev)

---

#### 5. Teste de Conexão Database
```bash
# Testar conexão pooled
npx prisma db push --skip-generate

# Verificar migrations
npx prisma migrate status

# Deve mostrar: Database schema is up to date!
```

---

#### 6. Lint Check
```bash
# Verificar padrões de código
npm run lint

# Corrigir warnings críticos antes de deploy
```

---

#### 7. Teste de Health Check (após deploy)
```bash
# Após deploy, testar endpoint
curl https://seu-app.vercel.app/api/health

# Resposta esperada:
# {"status":"ok","timestamp":"...","database":"connected"}
```

---

### Checklist Visual

Antes de fazer `git push` ou deploy na Vercel:

- [ ] `npm run build` passou sem erros
- [ ] `npx tsc --noEmit` passou sem erros
- [ ] `npx prisma validate` passou
- [ ] Schema Prisma tem `provider = "postgresql"`
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] `DATABASE_URL` tem `pgbouncer=true`
- [ ] `DIRECT_URL` NÃO tem `pgbouncer`
- [ ] `NEXTAUTH_SECRET` é diferente entre dev e prod
- [ ] Commits têm mensagens descritivas
- [ ] Documentação atualizada (se necessário)

---

### Em Caso de Falha no Deploy

Se o deploy falhar mesmo após checklist:

1. **Verificar logs da Vercel**:
   - Vercel Dashboard → Deployments → Último deploy → Logs
   - Procurar por erro específico

2. **Erros comuns**:
   - "the URL must start with the protocol `file:`" → Schema Prisma com provider errado
   - "Cannot find module" → Dependências faltando no package.json
   - "Type error" → Rodar `npx tsc --noEmit` localmente
   - "Database connection failed" → Verificar variáveis de ambiente na Vercel

3. **Rollback rápido**:
   ```bash
   # Via Vercel Dashboard
   Deployments → Deployment anterior → Promote to Production
   ```

4. **Consultar documentação**:
   - Ver seção "Troubleshooting Comum" abaixo
   - Consultar `MIGRATION_REPORT.md`
   - Verificar `POST_MIGRATION_CHECKLIST.md`

## Deploy

### Preparação

1. **Criar projeto Neon**:
   - https://neon.tech
   - Copiar connection strings (pooled e direct)

2. **Configurar Vercel**:
   - Importar projeto do GitHub
   - Adicionar environment variables
   - Deploy automático configurado

3. **Verificar**:
   - Health check: `https://seu-app.vercel.app/api/health`
   - Verificar logs no Vercel Dashboard
   - Monitorar performance no Neon Dashboard

### CI/CD

Deploy automático via GitHub Actions:
- Push para `main` → deploy production
- Pull Request → deploy preview
- Lint e type-check automáticos

## Boas Práticas

### Código
- TypeScript strict mode sempre
- Componentes funcionais com hooks
- Validação com Zod em todas APIs
- Tratamento de erros consistente
- Comentários em português

### Database
- Connection pooling para Vercel/serverless
- Índices em campos frequentemente consultados
- Soft delete para dados críticos
- Migrations testadas em dev primeiro

### Performance
- React.memo para componentes pesados
- useMemo/useCallback apropriadamente
- Imagens via next/image
- Caching estratégico nas APIs
- Code splitting com dynamic imports

### Segurança
- Nunca commitar secrets (.env no .gitignore)
- Validar todos inputs
- Headers de segurança configurados
- CORS apropriado
- Rate limiting (quando necessário)

## Troubleshooting

### Build Errors
```bash
# Limpar cache e rebuildar
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues
```bash
# Testar conexão
npx prisma db push

# Regenerar client
npx prisma generate

# Verificar migrations
npx prisma migrate status
```

### TypeScript Errors
```bash
# Verificar tipos
npm run type-check

# Regenerar Prisma types
npx prisma generate
```

## Troubleshooting Comum

### Guia de Resolução de Problemas Frequentes

Esta seção documenta erros comuns e suas soluções baseadas em experiências reais do projeto.

---

#### 🔴 Erro: "the URL must start with the protocol `file:`"

**Sintomas**:
- Build falhando na Vercel
- Erro em produção mas funciona localmente
- Relacionado ao Prisma

**Causa**: Schema Prisma configurado com `provider = "sqlite"` mas usando PostgreSQL (Neon) em produção.

**Solução**:
```prisma
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"  // ✓ CORRETO
  // provider = "sqlite"    // ✗ ERRADO
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**Validação**:
```bash
npx prisma validate
npx prisma generate
npm run build
```

**Prevenção**: Sempre usar PostgreSQL em todos ambientes. Ver seção "Configuração de Infraestrutura".

---

#### 🔴 Erro: Property 'id' does not exist on type 'User'

**Sintomas**:
- TypeScript error ao usar `session.user.id`
- Erro ao acessar propriedades de User/Session
- NextAuth types incompletos

**Causa**: Tipos padrão do NextAuth não incluem `id` no User.

**Solução**: Criar `src/types/next-auth.d.ts`:
```typescript
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    name?: string | null
    email?: string | null
  }

  interface Session {
    user: User & DefaultSession["user"]
  }
}
```

**Validação**:
```bash
npx tsc --noEmit
```

**Prevenção**: Sempre estender tipos de bibliotecas em `src/types/`.

---

#### 🔴 Erro: Too many database connections

**Sintomas**:
- "sorry, too many clients already"
- Erro intermitente em produção
- Conexões esgotadas no Neon

**Causa**: Sem connection pooling em ambiente serverless (Vercel).

**Solução**:
```env
# DATABASE_URL DEVE ter pgbouncer=true
DATABASE_URL="postgresql://...?sslmode=require&pgbouncer=true"

# DIRECT_URL NÃO deve ter pgbouncer (apenas migrations)
DIRECT_URL="postgresql://...?sslmode=require"
```

**Validação**:
```bash
# Verificar variáveis de ambiente
cat .env.local | grep DATABASE_URL

# Deve conter: pgbouncer=true
```

**Prevenção**: Sempre usar pooled connection em produção.

---

#### 🔴 Erro: Module not found (após adicionar nova lib)

**Sintomas**:
- Build local funciona
- Deploy na Vercel falha com "Cannot find module"
- Dependência instalada localmente

**Causa**: Dependência em `devDependencies` mas necessária em produção.

**Solução**:
```bash
# Mover de devDependencies para dependencies
npm install <pacote> --save

# Verificar package.json
cat package.json | grep <pacote>

# Deve estar em "dependencies", não "devDependencies"
```

**Validação**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Prevenção**: Bibliotecas usadas em runtime vão em `dependencies`.

---

#### 🔴 Erro: Zod validation failing (após update)

**Sintomas**:
- Validações que funcionavam quebram
- Tipos incompatíveis
- Após update de dependências

**Causa**: Zod v4 (beta) tem breaking changes.

**Solução**:
```bash
# Downgrade para Zod v3 (estável)
npm install zod@^3.24.1

# Verificar versão
npm list zod
```

**Validação**:
```bash
npm run build
npx tsc --noEmit
```

**Prevenção**: Evitar versões beta em produção. Fixar versões: `"zod": "^3.24.1"`.

---

#### 🔴 Erro: Case-sensitive query não encontra resultados

**Sintomas**:
- Busca por "Admin" não encontra "admin"
- Queries case-sensitive
- Funciona em SQLite mas falha em PostgreSQL

**Causa**: Diferenças entre bancos de dados.

**Solução**: Usar `db-utils.ts`:
```typescript
import { caseInsensitiveSearch } from '@/lib/db-utils'

// Antes (case-sensitive)
const users = await prisma.user.findMany({
  where: { name: { contains: searchTerm } }
})

// Depois (case-insensitive cross-database)
const users = await prisma.user.findMany({
  where: caseInsensitiveSearch('name', searchTerm)
})
```

**Prevenção**: Sempre usar abstrações de `db-utils.ts` para queries.

---

#### 🔴 Erro: NextAuth callback URL mismatch

**Sintomas**:
- Redirect após login falha
- "Callback URL mismatch"
- Funciona em dev mas não em produção

**Causa**: `NEXTAUTH_URL` incorreto.

**Solução**:
```env
# Desenvolvimento
NEXTAUTH_URL="http://localhost:3000"

# Produção (Vercel)
NEXTAUTH_URL="https://seu-app.vercel.app"
```

**Validação**:
- Verificar Vercel Dashboard → Settings → Environment Variables
- `NEXTAUTH_URL` deve ser a URL exata de produção

**Prevenção**: Configurar `NEXTAUTH_URL` corretamente em cada ambiente.

---

#### 🔴 Erro: Prisma Client not generated

**Sintomas**:
- "Cannot find module '@prisma/client'"
- Após modificar schema.prisma
- Tipos do Prisma desatualizados

**Solução**:
```bash
# Regenerar Prisma Client
npx prisma generate

# Se persistir, limpar e regenerar
rm -rf node_modules/.prisma
npx prisma generate
```

**Validação**:
```bash
npx tsc --noEmit
npm run build
```

**Prevenção**: Sempre rodar `npx prisma generate` após modificar schema.

---

#### 🔴 Erro: Environment variables not found in Vercel

**Sintomas**:
- Build passa localmente
- Falha na Vercel com "Environment variable not found"
- Variáveis configuradas mas não funcionam

**Causa**: Variáveis não configuradas corretamente na Vercel.

**Solução**:
1. Acessar [Vercel Dashboard](https://vercel.com/dashboard)
2. Projeto → Settings → Environment Variables
3. Adicionar TODAS as variáveis necessárias:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
4. Redeploy após adicionar variáveis

**Validação**:
```bash
# Após redeploy, testar
curl https://seu-app.vercel.app/api/health
```

**Prevenção**: Sempre verificar variáveis na Vercel antes de deploy.

---

### Fluxo de Debug Sistemático

Quando encontrar um erro não listado:

1. **Replicar localmente**:
   ```bash
   npm run build
   npx tsc --noEmit
   ```

2. **Verificar logs**:
   - Vercel Dashboard → Deployments → Logs
   - Browser Console (F12)
   - Terminal local

3. **Isolar o problema**:
   - Funciona em dev mas não em prod? → Verificar variáveis de ambiente
   - Erro de TypeScript? → Verificar tipos e imports
   - Erro de database? → Testar conexão e schema

4. **Consultar documentação**:
   - Ver seção "Débitos Técnicos Resolvidos"
   - Consultar `MIGRATION_REPORT.md`
   - Verificar `POST_MIGRATION_CHECKLIST.md`

5. **Documentar solução**:
   - Adicionar à seção "Troubleshooting Comum"
   - Atualizar checklists se necessário
   - Commitar documentação atualizada

## Recursos

### Documentação Oficial:
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Neon Docs](https://neon.tech/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Claude Code SDK](https://docs.claude.com/en/docs/claude-code/sdk/sdk-overview)
- [NextAuth.js Docs](https://next-auth.js.org)
- [Zod Docs](https://zod.dev)

### Documentação do Projeto:
- **CLAUDE.md** (este arquivo): Documentação completa do projeto
- **MIGRATION_REPORT.md**: Relatório detalhado da migração SQLite → PostgreSQL
- **POST_MIGRATION_CHECKLIST.md**: Checklist de validação pós-migração
- **TROUBLESHOOTING.md**: Guia de troubleshooting e soluções
- **README.md**: Overview e quickstart do projeto
- **.env.example**: Template de variáveis de ambiente

### Arquivos de Configuração Importantes:
- **prisma/schema.prisma**: Schema do database (PostgreSQL)
- **src/lib/auth-config.ts**: Configuração centralizada NextAuth
- **src/lib/db-utils.ts**: Utilities cross-database
- **src/lib/api-helpers.ts**: Helpers reutilizáveis para APIs
- **src/types/next-auth.d.ts**: Extensões de tipos NextAuth

## Contato e Suporte

Para dúvidas ou suporte:
- Abrir issue no GitHub
- Consultar agentes do Claude Code SDK
- Verificar documentação no README.md
- Consultar seções "Débitos Técnicos Resolvidos" e "Troubleshooting Comum"

---

## Notas Finais

### ⚠️ LEMBRE-SE SEMPRE:

1. **Database**: SEMPRE PostgreSQL (Neon) em todos ambientes
2. **Connection Pooling**: Obrigatório para Vercel (pgbouncer=true)
3. **Validações Pré-Deploy**: Executar checklist ANTES de cada push
4. **TypeScript Strict**: Sem erros de tipo em produção
5. **Zod Estável**: Usar v3.x, evitar versões beta
6. **Documentação**: Atualizar ao resolver novos problemas

### Workflow Recomendado:

```bash
# 1. Desenvolvimento local
npm run dev

# 2. Antes de commit
npm run build          # Build deve passar
npx tsc --noEmit       # Sem erros TypeScript
npx prisma validate    # Schema válido
npm run lint           # Code quality

# 3. Commit e push
git add .
git commit -m "feat: sua mensagem descritiva"
git push origin main

# 4. Após deploy na Vercel
curl https://seu-app.vercel.app/api/health  # Verificar health check

# 5. Monitorar
# Vercel Dashboard → Logs
# Neon Dashboard → Metrics
```

---

**Desenvolvido com o Claude Code SDK para o projeto Defenz**

**Última atualização da documentação**: Janeiro 2025 (Migração PostgreSQL)
