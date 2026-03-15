# Feature: Real-Time Polling
**Status:** Done
**Priority:** P1
**Date:** 2026-03-14

## Objective
Manter o Kanban de demandas sincronizado entre 2-5 usuarios via polling curto, sem dependencia de WebSocket/servidor persistente.

## Behavior
1. Quando usuario abre `/dashboard/demandas` ou `/dashboard/demandas/analises`, frontend inicia polling automatico
2. Frontend faz `GET /api/demandas` a cada 5s enquanto a aba estiver visivel
3. Se aba fica em background (Page Visibility API), polling para
4. Quando aba volta a ficar visivel, polling retoma imediatamente
5. Quando usuario faz CRUD (POST/PUT/DELETE), fetch imediato + reset do timer de polling
6. No PUT, frontend envia `updatedAt` do registro atual
7. API compara `updatedAt` recebido com o valor no banco
8. Se divergiu (outro usuario alterou), API rejeita com 409 + dados atuais no body
9. Frontend exibe toast "Demanda alterada por outro usuario" no 409 e atualiza dados locais

## Business Rules
- Intervalo de polling: 5 segundos (configuravel via constante)
- Polling DEVE parar quando aba esta em background (economia de recursos)
- Optimistic locking via campo `updatedAt` — nao bloqueia, apenas detecta conflitos
- PUT sem `updatedAt` funciona normalmente (backwards compatible)
- Maximo de 5 usuarios simultaneos — polling e suficiente

## Edge Cases
- Aba fica em background por muito tempo -> ao retomar, faz fetch imediato antes de reiniciar timer
- Rede cai durante polling -> erro silencioso, tenta novamente no proximo ciclo
- Dois usuarios editam a mesma demanda -> primeiro salva, segundo recebe 409
- Componente desmonta durante fetch pendente -> cleanup evita state update em componente desmontado

## Data Contract
- Input (polling): `GET /api/demandas` — sem body
- Input (update): `PUT /api/demandas` — body inclui `updatedAt` (ISO string, opcional)
- Output 200: `{ success: true, data: Demanda[] | Demanda }`
- Output 409: `{ success: false, error: "Conflito de versao", data: Demanda }` (dados atuais)
- Persistence: campo `updatedAt` ja existe no modelo Prisma (auto-gerenciado)

## Acceptance Criteria
- [ ] Hook `usePolling` chama fetchFn imediatamente no mount
- [ ] Hook repete fetchFn a cada 5s
- [ ] Hook para polling quando componente desmonta
- [ ] Hook para polling quando aba fica em background
- [ ] Hook retoma polling quando aba volta a ficar visivel
- [ ] `refresh()` faz fetch imediato e reseta timer
- [ ] PUT com `updatedAt` correto retorna 200
- [ ] PUT com `updatedAt` divergente retorna 409 + dados atuais
- [ ] PUT sem `updatedAt` funciona normalmente (backwards compatible)
- [ ] Schema Zod aceita `updatedAt` como campo opcional
- [ ] Schema Zod valida formato ISO de `updatedAt`

## Technical Decisions
- Polling simples (setInterval) ao inves de WebSocket/SSE — escala de 2-5 usuarios nao justifica complexidade
- Page Visibility API para pausar polling — nativo do browser, sem dependencias
- Optimistic locking via `updatedAt` — campo ja existe no Prisma, zero migration

## Dependencies
- Depende de: API `/api/demandas` (existente)
- Depende de: modelo `Demanda` com campo `updatedAt` (existente)
- Bloqueia: nenhum

## Fora do Escopo
- Presenca de usuarios (quem esta online)
- Indicador "quem esta editando"
- Real-time push (WebSocket/SSE)
- Retry com backoff exponencial (pode ser adicionado depois)
