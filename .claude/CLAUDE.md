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
- **Database**: PostgreSQL (Neon DB)
- **Real-time**: Socket.IO
- **Deploy**: Vercel
- **Autenticação**: NextAuth.js (planejado)

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
│   │   │   └── health/       # Health check
│   │   ├── dashboard/        # Páginas do dashboard
│   │   │   ├── page.tsx      # Dashboard principal
│   │   │   ├── activities/   # Gestão de atividades
│   │   │   ├── analytics/    # Análises e gráficos
│   │   │   └── calendar/     # Calendário
│   │   └── page.tsx          # Login page
│   ├── components/           # Componentes React
│   │   └── ui/              # Componentes shadcn/ui
│   └── lib/                 # Utilitários e configurações
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

- `DATABASE_URL`: Connection string do Neon (pooled)
- `DIRECT_URL`: Connection string direta (migrations)
- `NEXTAUTH_URL`: URL da aplicação
- `NEXTAUTH_SECRET`: Secret para NextAuth

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

## Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Neon Docs](https://neon.tech/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Claude Code SDK](https://docs.claude.com/en/docs/claude-code/sdk/sdk-overview)

## Contato e Suporte

Para dúvidas ou suporte:
- Abrir issue no GitHub
- Consultar agentes do Claude Code SDK
- Verificar documentação no README.md

---

**Desenvolvido com o Claude Code SDK para o projeto Defenz**
