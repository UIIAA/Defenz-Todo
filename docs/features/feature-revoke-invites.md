# Feature: Revogar Convites
**Status:** Done
**Priority:** P1
**Date:** 2026-03-19

## Objective
Permitir que admins/gerencia revoguem convites pendentes na pagina de Usuarios.

## Behavior
1. Admin acessa pagina de Usuarios
2. Na tabela de convites, convites com status "Pendente" mostram botao "Revogar" (icone X)
3. Ao clicar, o convite e deletado do banco (hard delete)
4. Toast de sucesso aparece e a lista e atualizada

## Business Rules
- Apenas convites pendentes (usedAt === null E nao expirado) podem ser revogados
- Apenas usuarios com role admin ou gerencia podem revogar
- Convites usados ou expirados nao mostram botao de revogar
- Hard delete (nao faz sentido manter token revogado)

## Edge Cases
- Tentar revogar convite ja usado -> 400
- Tentar revogar convite expirado -> 400
- Tentar revogar sem autenticacao -> 401
- Tentar revogar com role "user" -> 403
- Tentar revogar convite inexistente -> 404

## Data Contract
- Input: DELETE /api/invites?id=xxx
- Output: { success: true }
- Persistence: remove InviteToken do banco + cria AuditLog

## Acceptance Criteria
- [x] DELETE /api/invites?id=xxx revoga convite pendente
- [x] Retorna 400 para convites usados/expirados
- [x] Retorna 403 para usuarios sem permissao
- [x] Retorna 404 para convite inexistente
- [x] Botao "Revogar" aparece apenas para convites pendentes na UI
- [x] AuditLog e criado na revogacao
- [x] Testes cobrem todos os cenarios

## Technical Decisions
- Hard delete em vez de soft delete (tokens revogados nao tem utilidade)
- Audit log registra a revogacao para rastreabilidade

## Dependencies
- Depends on: auth system, InviteToken model
- Blocks: nada
