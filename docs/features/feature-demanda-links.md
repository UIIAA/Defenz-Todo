# Feature: Links Uteis em Demandas
**Status:** Draft
**Priority:** P1
**Date:** 2026-03-29

## Objetivo
Permitir que usuarios vinculem links uteis a demandas, associando cada link a um rotulo (palavra/texto), similar a hyperlinks no Word — ao clicar no rotulo, redireciona para a URL.

## Comportamento
1. Ao editar/criar uma demanda no DemandaModal, usuario ve uma secao "Links" abaixo das subtasks
2. Usuario clica em "+ Adicionar link"
3. Aparece dois campos inline: **Rotulo** (texto exibido) e **URL** (link completo)
4. Usuario preenche e confirma — link aparece na lista com icone de link externo
5. Ao clicar no rotulo, abre a URL em nova aba (`target="_blank"`)
6. Usuario pode editar ou remover links existentes
7. No KanbanCard, se a demanda tiver links, exibe um indicador (icone de link + quantidade)

## Regras de Negocio
- Maximo de 10 links por demanda
- URL deve ser valida (http:// ou https://)
- Rotulo obrigatorio, min 1 char, max 100 chars
- URL max 2000 chars
- Qualquer usuario que pode editar a demanda pode gerenciar seus links
- Links sao ordenados por posicao (mesma logica das subtasks)

## Edge Cases
- URL sem protocolo → auto-prefixar com "https://"
- Rotulo duplicado → permitido (URLs diferentes podem ter mesmo rotulo)
- Demanda deletada → links removidos em cascata (onDelete: Cascade)
- Import CSV → links nao incluidos (manter simples)

## Data Contract

### Modelo Prisma (novo)
```prisma
model DemandaLink {
  id        String   @id @default(cuid())
  label     String   // Texto exibido (rotulo)
  url       String   // URL completa
  position  Int      @default(0)
  demandaId String
  demanda   Demanda  @relation(fields: [demandaId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([demandaId])
}
```

### API
- **GET** `/api/demandas` — ja retorna links junto com demanda (include)
- **POST** `/api/demandas/[id]/links` — criar link `{ label, url, position? }`
- **PUT** `/api/demandas/[id]/links/[linkId]` — editar link `{ label?, url?, position? }`
- **DELETE** `/api/demandas/[id]/links/[linkId]` — remover link

### Zod Schemas
```typescript
// src/lib/validations/demanda-link.ts
createLinkSchema = z.object({
  label: z.string().min(1).max(100),
  url: z.string().url().max(2000),
  position: z.number().int().min(0).optional(),
})

updateLinkSchema = createLinkSchema.partial()
```

## Criterios de Aceitacao
- [ ] Modelo DemandaLink no schema.prisma com relacao Demanda
- [ ] API CRUD para links (POST, PUT, DELETE)
- [ ] Validacao Zod para label e URL
- [ ] Secao "Links" no DemandaModal com add/edit/remove
- [ ] Links clicaveis abrem em nova aba
- [ ] Auto-prefixo https:// quando usuario omite protocolo
- [ ] Indicador de links no KanbanCard (icone + count)
- [ ] Limite de 10 links por demanda (validacao API + UI)
- [ ] Audit log ao criar/editar/remover links
- [ ] Testes unitarios para validacao e API

## Decisoes Tecnicas
- Seguir mesmo padrao de subtasks: modelo separado, API dedicada, CRUD no modal
- Posicao (position) permite reordenacao futura via drag-and-drop
- Links gerenciados inline no modal (sem modal separado)
- UI: lista compacta com icone Link, rotulo clicavel, botoes edit/delete

## Dependencias
- Depende de: Demanda model (existente), DemandaModal (existente)
- Bloqueia: nada
