# Feature: Registro por Convite + Seguranca
**Status:** Approved
**Priority:** P0
**Date:** 2026-03-15

## Objective
Fechar registro publico. Admin gera link de convite unico. Pessoa acessa link, preenche dados e se cadastra. Assignee vira dropdown de usuarios do sistema.

## Fluxo de Convite

1. Admin acessa Configuracoes > Usuarios (nova pagina)
2. Clica "Convidar Usuario" — gera link unico com token
3. Link: `https://defenz-todo.vercel.app/register?token=abc123`
4. Pessoa acessa link, ve form de cadastro:
   - Nome completo (obrigatorio)
   - Email (obrigatorio, pre-preenchido se definido no convite)
   - Senha (obrigatorio, min 6 chars)
   - Confirmar senha
   - Cargo/funcao (texto livre: "Desenvolvedor", "Gerente", etc)
5. Ao submeter, backend valida token, cria usuario com role "user"
6. Token expira apos uso ou apos 7 dias

## Modelo de Dados

### InviteToken (novo)
- id: cuid
- token: string unique (nanoid 32 chars)
- email: string? (opcional — admin pode definir)
- role: string default "user"
- usedAt: DateTime? (null = nao usado)
- expiresAt: DateTime (createdAt + 7 dias)
- createdBy: string (userId do admin)
- createdAt: DateTime

## Seguranca
- /register sem token valido → redireciona para login com mensagem
- Token usado → erro "Convite ja utilizado"
- Token expirado → erro "Convite expirado"
- Rate limiting: max 5 tentativas de registro por IP por hora
- Registro sem convite: BLOQUEADO

## Assignee Dropdown
- GET /api/users retorna lista de usuarios (id, name, email) para dropdown
- No form de demanda, assignee vira Select com usuarios cadastrados
- Apenas usuarios autenticados podem listar usuarios

## Pagina Admin: Usuarios (/dashboard/configuracoes/usuarios)
- Lista de usuarios cadastrados (nome, email, role, data cadastro)
- Botao "Convidar Usuario" — gera link e exibe para copiar
- Campo opcional de email no convite

## Acceptance Criteria
- [ ] /register sem token redireciona para login
- [ ] Admin gera link de convite com token
- [ ] Form de registro funciona com token valido
- [ ] Token expira apos uso ou 7 dias
- [ ] Assignee e dropdown de usuarios do sistema
- [ ] Pagina de usuarios (admin)
- [ ] Build passa, testes passam
