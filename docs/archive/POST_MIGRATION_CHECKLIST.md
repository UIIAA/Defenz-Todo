# Checklist de Verificação Pós-Migração

## Status: ⏳ PENDENTE

Use este checklist para validar que a migração PostgreSQL foi aplicada com sucesso.

---

## 1. Validação Local

### Schema Validation
```bash
cd /Users/marcoscruz/Documents/Projetos/Defenz/Defenz\ -\ To-Do
npx prisma validate
```
- [ ] Schema validado sem erros

### Client Generation
```bash
npx prisma generate
```
- [ ] Prisma Client gerado com sucesso
- [ ] Versão do client: v6.17.1 ou superior

### Build Local
```bash
npm run build
```
- [ ] Build local passou sem erros
- [ ] Nenhum erro de tipo TypeScript

---

## 2. Deploy na Vercel

### Preparação
```bash
git add prisma/schema.prisma .env.example MIGRATION_REPORT.md POST_MIGRATION_CHECKLIST.md
git commit -m "fix: Corrigir schema.prisma para PostgreSQL/Neon

- Atualizar provider de sqlite para postgresql
- Adicionar directUrl para migrations
- Otimizar tipos com @db.Text para tokens OAuth
- Atualizar .env.example com configuração Neon

Fixes build error: 'URL must start with file:' protocol

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin main
```
- [ ] Commit criado
- [ ] Push realizado
- [ ] Deploy acionado automaticamente

### Verificar Build na Vercel

1. Acessar: https://vercel.com/dashboard
2. Verificar status do deploy
3. Clicar em "Building" para ver logs

**Logs esperados:**
```
✓ Prisma generate completed
✓ Prisma migrate deploy completed (or "No pending migrations")
✓ Next.js build completed
```

- [ ] `prisma generate` executado com sucesso
- [ ] `prisma migrate deploy` executado (ou "no pending migrations")
- [ ] Build do Next.js passou
- [ ] Deploy finalizado com sucesso

---

## 3. Verificações Pós-Deploy

### Health Check API
```bash
curl https://defenz-to-do.vercel.app/api/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-16T...",
  "database": "connected"
}
```

- [ ] API respondeu com status 200
- [ ] Database status: "connected"

### Logs da Aplicação

Acessar: https://vercel.com/seu-projeto/deployments/[id]/logs

- [ ] Sem erros de conexão com database
- [ ] Sem erros do Prisma Client
- [ ] Aplicação iniciou corretamente

### Neon Dashboard

Acessar: https://console.neon.tech

- [ ] Compute status: Active (ou auto-resuming)
- [ ] Conexões ativas visíveis
- [ ] Sem erros de conexão
- [ ] Uso de memória/CPU normal

---

## 4. Testes Funcionais

### Login
1. Acessar: https://defenz-to-do.vercel.app
2. Fazer login com credenciais válidas

- [ ] Login funcionando
- [ ] Redirecionamento para dashboard
- [ ] Sessão criada

### Dashboard
1. Acessar: https://defenz-to-do.vercel.app/dashboard
2. Verificar KPIs e dados

- [ ] KPIs carregando corretamente
- [ ] Atividades sendo listadas
- [ ] Gráficos renderizando

### CRUD de Atividades

**Listar:**
```bash
curl -X GET https://defenz-to-do.vercel.app/api/activities \
  -H "Content-Type: application/json"
```
- [ ] API retorna lista de atividades

**Criar:**
```bash
curl -X POST https://defenz-to-do.vercel.app/api/activities \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Teste Migration",
    "area": "Gestão Estratégica",
    "priority": 0,
    "status": "pending",
    "userId": "seu-user-id"
  }'
```
- [ ] Atividade criada com sucesso
- [ ] ID retornado

**Atualizar:**
```bash
curl -X PUT https://defenz-to-do.vercel.app/api/activities/[id] \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```
- [ ] Atividade atualizada
- [ ] Timestamp updatedAt modificado

**Deletar (Soft Delete):**
```bash
curl -X DELETE https://defenz-to-do.vercel.app/api/activities/[id]
```
- [ ] Atividade marcada como deletada
- [ ] deletedAt preenchido
- [ ] Não aparece mais na listagem

---

## 5. Verificações de Performance

### Response Times
- [ ] Dashboard carrega em < 2s
- [ ] API responses em < 500ms
- [ ] Queries otimizadas (verificar no Neon)

### Connection Pooling
No Neon Dashboard → Operations → Connections:
- [ ] Conexões sendo reusadas (pooling ativo)
- [ ] Máximo de conexões não ultrapassado
- [ ] Tempo de conexão < 100ms

### Prisma Queries
Verificar logs do Vercel:
- [ ] Sem N+1 queries
- [ ] Índices sendo usados
- [ ] Query times razoáveis

---

## 6. Validação de Segurança

### Environment Variables
Na Vercel → Settings → Environment Variables:
- [ ] DATABASE_URL definida (pooled)
- [ ] DIRECT_URL definida (direct)
- [ ] NEXTAUTH_SECRET definida
- [ ] Valores não expostos em logs

### SSL/TLS
- [ ] Conexões usando sslmode=require
- [ ] Certificados válidos
- [ ] HTTPS ativo

### Dados Sensíveis
- [ ] Senhas hasheadas no banco
- [ ] Tokens OAuth criptografados
- [ ] Sem dados sensíveis em logs

---

## 7. Validação de Dados

### Integridade
```sql
-- Execute no Neon SQL Editor
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Activity";
SELECT COUNT(*) FROM "ActivityComment";
```
- [ ] Contagens batem com esperado
- [ ] Dados não duplicados
- [ ] Relacionamentos intactos

### Soft Deletes
```sql
-- Verificar soft deletes
SELECT COUNT(*) FROM "Activity" WHERE "deletedAt" IS NOT NULL;
```
- [ ] Soft deletes funcionando
- [ ] Não aparecem em queries padrão

### Timestamps
```sql
-- Verificar timestamps
SELECT id, "createdAt", "updatedAt"
FROM "Activity"
ORDER BY "createdAt" DESC
LIMIT 5;
```
- [ ] Timestamps em formato correto
- [ ] Timezone consistente (UTC)

---

## 8. Monitoramento Contínuo

### Configurar Alertas (Opcional)

**Vercel:**
- [ ] Alertas de build failure
- [ ] Alertas de errors em runtime
- [ ] Alertas de performance

**Neon:**
- [ ] Alertas de storage 80%+
- [ ] Alertas de conexões esgotadas
- [ ] Alertas de queries lentas

### Métricas para Monitorar

**Diariamente:**
- Taxa de erro da API
- Tempo de resposta médio
- Uso de storage no Neon

**Semanalmente:**
- Crescimento de dados
- Performance de queries
- Custos do Neon

---

## 9. Documentação

- [ ] README.md atualizado (se necessário)
- [ ] Variáveis de ambiente documentadas
- [ ] Runbook de troubleshooting criado
- [ ] Equipe informada das mudanças

---

## 10. Rollback Plan (Se Necessário)

### Se algo der errado:

**Opção 1: Reverter schema.prisma**
```bash
git revert HEAD
git push origin main
```

**Opção 2: Rollback do deploy na Vercel**
1. Acessar Deployments
2. Selecionar deploy anterior (working)
3. Clicar "Promote to Production"

**Opção 3: Database rollback (ÚLTIMO RECURSO)**
- Neon permite point-in-time recovery
- Contatar suporte do Neon se necessário

---

## Resultados Esperados

### ✅ Sucesso Completo
- Todos os itens marcados
- Build passando
- Aplicação funcionando
- Performance OK
- Dados preservados

### ⚠️ Sucesso Parcial
- Build passou
- Algumas funcionalidades com issue
- Investigar logs
- Aplicar fixes incrementais

### ❌ Falha
- Build não passou
- Aplicação não funciona
- Executar rollback
- Analisar causa raiz

---

## Observações Finais

**Data de Execução:** _______________

**Executado por:** _______________

**Tempo total:** _______________

**Issues encontrados:**
- [ ] Nenhum
- [ ] Listados abaixo:

```
1.
2.
3.
```

**Ações de follow-up:**
```
1.
2.
3.
```

**Status Final:**
- [ ] ✅ Migração 100% sucesso
- [ ] ⚠️ Migração OK com ressalvas
- [ ] ❌ Rollback necessário

---

**Assinatura Digital:**
```
git log -1 --format='%H %an %ae %aI'
```

---

## Suporte

**Em caso de problemas:**

1. Consultar: `MIGRATION_REPORT.md`
2. Verificar logs: Vercel + Neon
3. Verificar variáveis de ambiente
4. Contatar time de desenvolvimento

**Links Úteis:**
- Vercel Dashboard: https://vercel.com/dashboard
- Neon Console: https://console.neon.tech
- Prisma Docs: https://www.prisma.io/docs
- Troubleshooting: Ver MIGRATION_REPORT.md seção Troubleshooting
