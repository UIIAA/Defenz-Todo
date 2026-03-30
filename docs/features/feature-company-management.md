# Feature: Gestao de Empresas + Correcoes de Equipes/Branding
**Status:** Draft
**Priority:** P0
**Date:** 2026-03-29

## Objetivo
Permitir ao admin criar/editar/excluir empresas pelo UI, e corrigir o fluxo de branding (cor + logo) que pertence a Empresa e e herdado por todas as equipes.

## Problemas Atuais
1. **Nao existe UI para criar empresa** — so a API POST existe
2. **Branding salvo so aparece apos re-login** — esta cacheado no JWT
3. **Criar equipe pode falhar** se nenhuma empresa estiver selecionada no state

## Comportamento Esperado

### Gestao de Empresas (admin only)
1. Na tela de Equipes, acima da tabela de equipes, exibir secao "Empresas" com cards
2. Cada card mostra: nome, logo preview, cor accent, count de equipes e usuarios
3. Botao "Nova Empresa" abre dialog com: nome, URL logo (opcional), cor accent (opcional)
4. Botao editar em cada card permite alterar nome, logo e cor
5. Botao excluir (so se empresa nao tem equipes/usuarios)

### Branding = Empresa
1. Cor accent e logo sao da **Empresa**, nao da Equipe
2. Todas as equipes herdam o branding da empresa mae
3. Remover a secao "Identidade Visual" separada — integrar direto nos cards de empresa
4. Ao salvar branding, atualizar a session sem precisar re-login (revalidar session)

### Correcao de Criar Equipe
1. Se admin e nao selecionou empresa → mostrar erro claro
2. Se gerencia → usar companyId da session (ja funciona, mas validar)

## Regras de Negocio
- Somente admin pode criar/editar/excluir empresas
- Empresa nao pode ser excluida se tem equipes ou usuarios
- Nome da empresa obrigatorio, min 1 char
- Logo URL opcional, deve ser URL valida se fornecida
- Accent color opcional, deve ser hex valido (#RRGGBB)
- Gerencia pode editar branding da propria empresa

## Criterios de Aceitacao
- [ ] Cards de empresa na tela de equipes (admin)
- [ ] Dialog para criar nova empresa
- [ ] Editar nome/logo/cor de empresa existente
- [ ] Excluir empresa vazia
- [ ] Branding reflete imediatamente sem re-login
- [ ] Criar equipe valida empresa selecionada
- [ ] Testes para validacoes e API

## Dependencias
- Depende de: Company model (existente), Companies API (existente)
- Bloqueia: nada
