# Correção: Queries Case-Insensitive no Prisma

## Problema Identificado

### Erro TypeScript
```
error TS2353: Object literal may only specify known properties,
and 'mode' does not exist in type 'StringFilter<"Activity">'.
```

### Contexto
- **Arquivo**: `src/app/api/activities/route.ts` (linhas 50 e 54)
- **Causa**: Uso incorreto de `mode: 'insensitive'` com operador `equals`
- **Database**: SQLite (desenvolvimento) vs PostgreSQL/Neon (produção planejada)

### Código Problemático
```typescript
const existingActivity = await db.activity.findFirst({
  where: {
    userId: user.id,
    deletedAt: null,
    title: {
      equals: validatedData.title,
      mode: 'insensitive' // ❌ ERRO: mode não existe para equals
    },
    area: {
      equals: validatedData.area,
      mode: 'insensitive'  // ❌ ERRO
    }
  }
})
```

## Análise do Problema

### Limitações do Prisma com SQLite

1. **Operador `equals` não suporta `mode`**
   - Apenas operadores de texto (`contains`, `startsWith`, `endsWith`) suportam `mode`
   - Documentação: https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting#case-insensitive-filtering

2. **SQLite vs PostgreSQL**
   - SQLite: `mode: 'insensitive'` não funciona nativamente
   - PostgreSQL: Suporte completo para case-insensitive queries

3. **Schema atual configurado para SQLite**
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

## Solução Implementada

### 1. Criado Utilitário Cross-Database

**Arquivo**: `src/lib/db-utils.ts`

```typescript
/**
 * Verifica duplicatas case-insensitive de forma compatível
 * com SQLite e PostgreSQL
 */
export async function findDuplicateActivity(
  userId: string,
  title: string,
  area: string,
  excludeId?: string
) {
  // Buscar atividades do usuário
  const userActivities = await db.activity.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {})
    },
    select: {
      id: true,
      title: true,
      area: true
    }
  })

  // Comparação case-insensitive manual
  return userActivities.find(
    activity =>
      activity.title.toLowerCase() === title.toLowerCase() &&
      activity.area.toLowerCase() === area.toLowerCase()
  ) || null
}
```

**Funcionalidades**:
- ✅ Funciona em SQLite e PostgreSQL
- ✅ Case-insensitive (via `.toLowerCase()`)
- ✅ Suporta exclusão de ID (para updates)
- ✅ Performance otimizada (select apenas campos necessários)

### 2. Atualizado POST `/api/activities`

**Antes**:
```typescript
const existingActivity = await db.activity.findFirst({
  where: {
    title: { equals: validatedData.title, mode: 'insensitive' }, // ❌
    area: { equals: validatedData.area, mode: 'insensitive' }    // ❌
  }
})
```

**Depois**:
```typescript
import { findDuplicateActivity } from '@/lib/db-utils'

const existingActivity = await findDuplicateActivity(
  user.id,
  validatedData.title,
  validatedData.area
) // ✅
```

### 3. Atualizado PUT `/api/activities/[id]`

Adicionada validação de duplicatas também no update:

```typescript
// Check for duplicates if title or area changed
if (data.title !== oldActivity.title || data.area !== oldActivity.area) {
  const duplicate = await findDuplicateActivity(
    user.id,
    data.title,
    data.area,
    params.id // Exclude current activity
  )

  if (duplicate) {
    return NextResponse.json(
      { error: 'Atividade duplicada!' },
      { status: 409 }
    )
  }
}
```

## Testes Realizados

### 1. Compilação TypeScript
```bash
npx tsc --noEmit
```
✅ **Resultado**: Nenhum erro relacionado a `mode`

### 2. Build de Produção
```bash
npm run build
```
✅ **Resultado**: Build completo com sucesso

### 3. Funcionalidade
- ✅ Duplicatas detectadas (case-insensitive)
- ✅ "Tarefa A" detectada como duplicata de "tarefa a"
- ✅ Update valida duplicatas excluindo atividade atual

## Performance

### Comparação

| Abordagem | Queries | Performance |
|-----------|---------|-------------|
| **Anterior (PostgreSQL only)** | 1 query com filtro DB | Excelente |
| **Atual (Cross-database)** | 1 query + filter JS | Boa |

### Overhead Aceitável
- Busca apenas 3 campos por atividade
- Filtro JS é extremamente rápido para datasets típicos (<10k atividades por usuário)
- Indexed query no `userId` mantém performance

### Quando Otimizar

Quando migrar schema para **PostgreSQL/Neon** em produção, considere:

```typescript
// Otimização para PostgreSQL (native case-insensitive)
const duplicate = await db.activity.findFirst({
  where: {
    userId,
    deletedAt: null,
    title: { equals: title, mode: 'insensitive' },
    area: { equals: area, mode: 'insensitive' }
  }
})
```

## Migração Futura para PostgreSQL

### Checklist

1. ✅ **Atualizar `schema.prisma`**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```

2. ✅ **Atualizar `.env`**
   ```env
   DATABASE_URL="postgresql://user:pass@neon.tech/db?pgbouncer=true"
   DIRECT_URL="postgresql://user:pass@neon.tech/db"
   ```

3. ✅ **Criar migrations**
   ```bash
   npx prisma migrate dev --name migrate_to_postgresql
   ```

4. ⚠️ **OPCIONAL: Otimizar queries**
   - Avaliar se vale otimizar `findDuplicateActivity` para usar `mode: 'insensitive'`
   - Medir performance antes/depois
   - Manter compatibilidade se SQLite ainda for usado em dev

## Arquivos Modificados

### Criados
- ✅ `src/lib/db-utils.ts` - Utilitários cross-database

### Modificados
- ✅ `src/app/api/activities/route.ts` - POST endpoint
- ✅ `src/app/api/activities/[id]/route.ts` - PUT endpoint

### Documentação
- ✅ `docs/DATABASE_QUERIES_FIX.md` (este arquivo)

## Lições Aprendidas

1. **Prisma Filters são database-specific**
   - Sempre verificar compatibilidade com o provider
   - Consultar docs: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference

2. **mode: 'insensitive' só funciona com operadores de texto**
   - `contains`, `startsWith`, `endsWith`: ✅ Suportam mode
   - `equals`: ❌ Não suporta mode

3. **SQLite é limitado para case-insensitive**
   - Requer workarounds ou collations customizadas
   - JavaScript `.toLowerCase()` é solução viável

4. **Design for cross-compatibility**
   - Abstrair queries complexas em utilitários
   - Facilita migração futura
   - Melhora testabilidade

## Recursos

- [Prisma Case-insensitive Filtering](https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting#case-insensitive-filtering)
- [Prisma SQLite Limitations](https://www.prisma.io/docs/concepts/database-connectors/sqlite)
- [Neon DB with Prisma](https://neon.tech/docs/guides/prisma)

---

**Status**: ✅ Correção completa e testada
**Data**: 2025-10-16
**Responsável**: Claude Code (Database Architect Agent)
