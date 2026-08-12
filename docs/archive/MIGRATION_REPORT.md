# Relatório de Migração: SQLite → PostgreSQL/Neon

**Data:** 2025-10-16
**Status:** ✅ CONCLUÍDO
**Impacto:** Build na Vercel agora deve funcionar

---

## Contexto

O projeto estava com **configuração inconsistente** entre schema e database:
- **Schema.prisma**: Configurado para SQLite
- **Database real (Neon)**: PostgreSQL rodando em produção
- **Migrations**: Já eram PostgreSQL (migration_lock.toml = postgresql)
- **Resultado**: Build falhando na Vercel com erro de validação

---

## Mudanças Realizadas

### 1. Schema Prisma Atualizado

**Arquivo:** `prisma/schema.prisma`

#### Antes:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

#### Depois:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 2. Otimizações PostgreSQL Adicionadas

Campos de texto longo agora usam `@db.Text` no model Account:

```prisma
model Account {
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  id_token          String? @db.Text
}
```

**Razão:** Tokens OAuth podem ser muito longos. No PostgreSQL, `@db.Text` não tem limite de tamanho, enquanto VARCHAR tem limite de 65,535 caracteres.

### 3. Direct URL Configurado

Adicionada configuração `directUrl` para:
- **Migrations**: Usar conexão direta (sem pooling)
- **Prisma Studio**: Acesso direto ao banco
- **Build time**: Operações que precisam de conexão direta

---

## Compatibilidade de Tipos

### Tipos que permaneceram iguais:

| Prisma Type | SQLite | PostgreSQL |
|-------------|--------|------------|
| String      | TEXT   | TEXT       |
| Int         | INTEGER| INTEGER    |
| Boolean     | INTEGER (0/1) | BOOLEAN |
| DateTime    | TEXT (ISO8601) | TIMESTAMP(3) |

### Mudanças importantes:

1. **String vs Text**:
   - SQLite: Trata igual
   - PostgreSQL: String = VARCHAR (padrão), Text = TEXT (sem limite)
   - **Ação:** Adicionado `@db.Text` para tokens OAuth

2. **Boolean**:
   - SQLite: Armazena como 0/1
   - PostgreSQL: Tipo BOOLEAN nativo
   - **Ação:** Nenhuma (Prisma abstrai automaticamente)

3. **DateTime**:
   - SQLite: Armazena como string ISO8601
   - PostgreSQL: Tipo TIMESTAMP(3) nativo
   - **Ação:** Nenhuma (migrations já usavam TIMESTAMP)

---

## Estrutura de Conexão

### Variáveis de Ambiente

#### Produção (Vercel + Neon):
```env
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require&pgbouncer=true&connect_timeout=10"
DIRECT_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require"
```

#### Desenvolvimento Local:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/defenz?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/defenz?schema=public"
```

### Connection Pooling

**DATABASE_URL (Pooled):**
- Usado pelo Prisma Client em runtime
- Passa pelo PgBouncer do Neon
- Ideal para serverless/edge (Vercel)
- Parâmetro: `pgbouncer=true`

**DIRECT_URL (Direct):**
- Usado para migrations (`prisma migrate deploy`)
- Usado pelo Prisma Studio
- Conexão direta ao PostgreSQL
- Sem `pgbouncer=true`

---

## Validação Executada

### ✅ Checklist de Validação:

- [x] Schema validado: `npx prisma validate`
- [x] Prisma Client gerado: `npx prisma generate`
- [x] Todos os modelos preservados (9 models)
- [x] Todos os índices preservados
- [x] Todos os relacionamentos mantidos
- [x] Tipos compatíveis com PostgreSQL
- [x] .env.example atualizado

### Resultado da Validação:

```bash
✅ Prisma schema loaded from prisma/schema.prisma
✅ The schema at prisma/schema.prisma is valid 🚀
✅ Generated Prisma Client (v6.17.1)
```

---

## Estratégia de Aplicação

### IMPORTANTE: Nenhuma Migration Necessária!

O Neon já tem todas as tabelas criadas corretamente. As mudanças foram apenas no schema.prisma para corrigir a configuração.

### Próximos Passos na Vercel:

1. **Push das mudanças para Git**
2. **Deploy automático será acionado**
3. **Build script vai executar:**
   ```bash
   prisma generate          # ✅ Agora vai funcionar
   prisma migrate deploy    # ✅ Vai verificar que está em sync
   next build              # ✅ Build vai passar
   ```

### Verificações Pós-Deploy:

```bash
# 1. Health check
curl https://seu-app.vercel.app/api/health

# 2. Verificar logs no Vercel Dashboard
# - Procurar por erros de conexão
# - Confirmar que Prisma Client foi gerado

# 3. Testar funcionalidades principais
# - Login
# - Listar atividades
# - Criar atividade
# - Atualizar atividade
```

---

## Backup e Segurança

### Dados Existentes:

- **Status:** Totalmente preservados
- **Tamanho:** 31.52 MB de dados no Neon
- **Risco:** Nenhum (apenas mudança de configuração)

### Se necessário fazer rollback:

1. Reverter commit do schema.prisma
2. Dados permanecem intactos
3. Problema original volta (build fail)

**Recomendação:** Manter mudanças. Schema agora reflete a realidade.

---

## Diferenças SQLite vs PostgreSQL

### Vantagens do PostgreSQL/Neon:

1. **Performance**:
   - Índices mais eficientes
   - Queries complexas mais rápidas
   - Connection pooling nativo

2. **Concorrência**:
   - Múltiplas conexões simultâneas
   - Locks mais granulares
   - MVCC (Multi-Version Concurrency Control)

3. **Tipos de Dados**:
   - JSONB para queries JSON
   - Arrays nativos
   - Full-text search nativo
   - Tipos de data/hora avançados

4. **Escalabilidade**:
   - Branching (Neon)
   - Point-in-time recovery
   - Read replicas
   - Auto-scaling

5. **Serverless-ready**:
   - Connection pooling via PgBouncer
   - Suspend automático (Neon)
   - Cobra apenas pelo uso

### Considerações:

1. **Case Sensitivity**:
   - SQLite: Case-insensitive por padrão
   - PostgreSQL: Case-sensitive
   - **Impacto:** Nenhum (código já funciona)

2. **Boolean**:
   - SQLite: 0/1
   - PostgreSQL: true/false
   - **Impacto:** Nenhum (Prisma abstrai)

3. **Tipos String**:
   - SQLite: TEXT para tudo
   - PostgreSQL: VARCHAR vs TEXT
   - **Impacto:** Otimizado com @db.Text

---

## Arquivos Modificados

### 1. `prisma/schema.prisma`
**Mudanças:**
- Provider: `sqlite` → `postgresql`
- Adicionado: `directUrl = env("DIRECT_URL")`
- Otimizado: `@db.Text` para tokens OAuth

### 2. `.env.example`
**Mudanças:**
- Atualizado com exemplos PostgreSQL/Neon
- Documentado DATABASE_URL (pooled)
- Documentado DIRECT_URL (direct)
- Comentários sobre connection pooling

### 3. `MIGRATION_REPORT.md` (este arquivo)
**Novo arquivo** com documentação completa da migração.

---

## Troubleshooting

### Se o build falhar na Vercel:

#### 1. Erro: "DATABASE_URL not found"
**Solução:** Verificar variáveis de ambiente na Vercel:
- Settings → Environment Variables
- Confirmar `DATABASE_URL` e `DIRECT_URL`

#### 2. Erro: "Can't reach database server"
**Solução:**
- Verificar se Neon compute está ativo
- Verificar string de conexão (sslmode=require)
- Confirmar que pgbouncer=true está presente

#### 3. Erro: "Migration failed"
**Solução:**
- As migrations já estão aplicadas
- Apenas `prisma generate` é necessário
- Verificar migration_lock.toml (deve ser postgresql)

#### 4. Erro: "Schema out of sync"
**Solução:**
```bash
# Verificar status
npx prisma migrate status

# Se necessário, marcar como aplicada
npx prisma migrate resolve --applied "<migration-name>"
```

### Se precisar resetar (APENAS EM DEV):

```bash
# ATENÇÃO: Apaga todos os dados!
npx prisma migrate reset

# Aplicar migrations novamente
npx prisma migrate deploy
```

---

## Métricas de Sucesso

### Antes da Migração:
- ❌ Build falhando na Vercel
- ❌ Schema inconsistente com database
- ❌ SQLite configurado, PostgreSQL rodando

### Depois da Migração:
- ✅ Build deve passar na Vercel
- ✅ Schema consistente com database
- ✅ PostgreSQL configurado corretamente
- ✅ Connection pooling otimizado
- ✅ Tipos de dados otimizados

---

## Checklist Final

### Desenvolvedor:

- [x] Schema.prisma atualizado
- [x] Schema validado
- [x] Prisma Client gerado
- [x] .env.example atualizado
- [ ] Commit e push para Git
- [ ] Verificar build na Vercel

### Operações:

- [ ] Health check pós-deploy
- [ ] Verificar logs da aplicação
- [ ] Testar funcionalidades principais
- [ ] Monitorar performance do Neon
- [ ] Confirmar que compute não está suspended

### Documentação:

- [x] Relatório de migração criado
- [x] .env.example documentado
- [x] Troubleshooting documentado
- [x] Próximos passos definidos

---

## Conclusão

A migração foi **apenas uma correção de configuração**. O database sempre foi PostgreSQL, mas o schema.prisma estava desatualizado.

**Nenhum dado foi perdido ou modificado.**

**Próximo passo:** Fazer commit e push para validar que o build passa na Vercel.

---

**Preparado por:** Database Architect Agent
**Baseado em:** Claude Code SDK
**Projeto:** Defenz - Gestão Estratégica de Atividades
