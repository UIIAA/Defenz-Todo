# Guia Rápido de Deploy - Migração PostgreSQL

## TL;DR

O schema.prisma foi corrigido de SQLite para PostgreSQL. O build na Vercel deve funcionar agora.

---

## Próximos Passos (5 minutos)

### 1. Fazer Commit (1 min)

```bash
cd /Users/marcoscruz/Documents/Projetos/Defenz/Defenz\ -\ To-Do

git add prisma/schema.prisma .env.example MIGRATION_REPORT.md POST_MIGRATION_CHECKLIST.md QUICK_DEPLOY_GUIDE.md

git commit -m "fix: Corrigir schema.prisma para PostgreSQL/Neon

- Atualizar provider de sqlite para postgresql
- Adicionar directUrl para migrations
- Otimizar tipos com @db.Text para tokens OAuth
- Atualizar .env.example com configuração Neon

Fixes build error: 'URL must start with file:' protocol

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 2. Push para GitHub (30s)

```bash
git push origin main
```

### 3. Monitorar Deploy na Vercel (2-3 min)

1. Acessar: https://vercel.com/dashboard
2. Ver deploy em andamento
3. Clicar para ver logs em tempo real

**Logs esperados:**
```
✓ prisma generate
✓ prisma migrate deploy (no pending migrations)
✓ next build
✓ Deploy complete
```

### 4. Testar Aplicação (1 min)

```bash
# Health check
curl https://seu-app.vercel.app/api/health

# Ou abrir no navegador
https://seu-app.vercel.app
```

---

## O Que Foi Mudado?

### Arquivo: `prisma/schema.prisma`

**Antes:**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**Depois:**
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**Impacto:**
- ✅ Build vai passar
- ✅ Nenhum dado perdido
- ✅ Nenhuma migration necessária
- ✅ Aplicação continua funcionando

---

## Se Algo Der Errado

### Build falhou na Vercel?

**1. Verificar variáveis de ambiente:**
```
Vercel → Settings → Environment Variables
```
Confirmar:
- DATABASE_URL (pooled connection)
- DIRECT_URL (direct connection)

**2. Verificar logs:**
```
Vercel → Deployments → [seu-deploy] → Building
```
Procurar por:
- Erro de conexão
- Erro do Prisma
- Erro de build

**3. Rollback rápido:**
```
Vercel → Deployments → [deploy anterior] → Promote to Production
```

### Aplicação não funciona?

**1. Health check:**
```bash
curl https://seu-app.vercel.app/api/health
```

**2. Logs runtime:**
```
Vercel → Deployments → [seu-deploy] → Functions
```

**3. Neon Dashboard:**
```
https://console.neon.tech
```
Verificar se compute está active.

---

## Suporte Adicional

**Documentação completa:** Ver `MIGRATION_REPORT.md`

**Checklist detalhado:** Ver `POST_MIGRATION_CHECKLIST.md`

**Troubleshooting:** Ver seção específica em `MIGRATION_REPORT.md`

---

## Status Esperado

✅ **Antes de 5 minutos:**
- Deploy completo
- Aplicação online
- Tudo funcionando

⏱️ **Se demorar mais:**
- Verificar logs da Vercel
- Verificar status do Neon
- Consultar documentação completa

❌ **Se falhar:**
- Executar rollback
- Revisar variáveis de ambiente
- Contatar suporte

---

**Última atualização:** 2025-10-16
**Tempo estimado:** 5 minutos
**Complexidade:** Baixa
