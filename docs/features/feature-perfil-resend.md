# Feature: Pagina Perfil + Notificacoes por Email (Resend)
**Status:** Approved
**Priority:** P1
**Date:** 2026-03-15

## Objective
Criar pagina de perfil do usuario em /dashboard/configuracoes/perfil com dados pessoais e configuracao de email para notificacoes. Integrar Resend para envio de emails quando demandas forem criadas, atualizadas ou com prazo proximo.

## Behavior
1. Usuario acessa Configuracoes > Perfil no sidebar
2. Ve seus dados: nome, email, role
3. Pode configurar email para notificacoes (pode ser diferente do login)
4. Toggle on/off para receber notificacoes
5. Sistema envia email via Resend quando:
   - Demanda atribuida ao usuario
   - Status de demanda alterado
   - Prazo de demanda em 24h

## Data Contract

### NotificationPreferences (ja existe no schema)
- Verificar modelo existente e adaptar

### API Endpoints
- GET /api/user/profile — retorna dados do usuario + preferencias
- PUT /api/user/profile — atualiza nome, email de notificacao, toggle
- POST /api/notifications/send — interno, envia email via Resend

## Arquivos a Criar/Modificar
- `src/app/dashboard/configuracoes/perfil/page.tsx` — **CRIAR** pagina de perfil
- `src/app/api/user/profile/route.ts` — **CRIAR** API perfil
- `src/lib/email.ts` — **CRIAR** util Resend
- `src/app/api/demandas/route.ts` — adicionar trigger de notificacao no PUT

## Acceptance Criteria
- [ ] Pagina /dashboard/configuracoes/perfil renderiza
- [ ] Exibe nome, email, role do usuario
- [ ] Campo email para notificacoes (editavel)
- [ ] Toggle notificacoes on/off
- [ ] Botao salvar funciona (PUT /api/user/profile)
- [ ] Resend envia email de teste
- [ ] Build passa
- [ ] Testes passam
