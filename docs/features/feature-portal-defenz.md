# Feature: Portal Defenz

**Status:** 🟡 **DRAFT — brainstorming não iniciado** (registrado em 2026-07-20 para sobreviver ao reset de contexto)
**Priority:** P1 (próxima feature de produto)
**Date:** 2026-07-20

> ⚠️ **Para o próximo contexto:** este documento é o **ponto de partida**, não uma spec aprovada. O Marcos descreveu a visão; o estudo de formato está esboçado abaixo (§Estudo), mas as **Decisões pendentes (§D)** precisam ser fechadas com ele ANTES de escrever a spec final e implementar. Seguir o Spec-First do CLAUDE.md.

---

## 1. Visão (palavras do Marcos, 20/07)

> "Essa página vai ser o **Portal Defenz**. Nela eu vou colocar tanto a **IA Defenz** que vai realizar pesquisas e etc. Vai ser também a **Central para que as pessoas consigam encontrar as POP** de todos os procedimentos, **com imagens** e etc. Os **Manuais**, os **modelos de apresentação e proposta**. Podem ser **links diretos ou não**. Estude a melhor forma."

Nova página/menu no Defenz To-Do (`/dashboard/portal`, nome a confirmar) que centraliza **3 pilares**:

| # | Pilar | O que é |
|---|-------|---------|
| 1 | **IA Defenz** | Assistente que "realiza pesquisas e etc" — escopo a definir (§D1) |
| 2 | **POPs / Procedimentos** | Central de procedimentos operacionais padrão, **com imagens** |
| 3 | **Biblioteca** | Manuais, modelos de apresentação (PPTX) e proposta (DOCX) |

---

## 2. 🔑 Descoberta crítica: já existe spec aprovada que cobre o Pilar 2

**`docs/features/feature-playbooks-manuais.md` (Approved design, 2026-06-24)** já resolve a "Central de POPs":
- Markdown editável no app + **busca full-text Postgres** (`to_tsvector` + GIN)
- Models `Playbook` + `PlaybookCategory`; tags `String[]`; `companyId` **nullable** (null = global Defenz)
- **O diferencial é o FRESCOR** (owner → verificar → TTL → des-verifica → notifica), não o editor
- Sanitização obrigatória (XSS stored = vetor cross-tenant)
- Permissão: só admin cria/edita globais; gerência na própria empresa; user só lê

👉 **Recomendação: o Portal Defenz NÃO é uma feature do zero — é o guarda-chuva (a "casa") que apresenta os playbooks + adiciona os pilares 1 e 3.** Evita duplicar model, busca e frescor. A spec de playbooks vira a **fundação** do Pilar 2; o que falta nela pro Portal é **imagens** (§D2).

---

## 3. Estudo: "links diretos ou não?" (a pergunta do Marcos)

### Opções avaliadas

| Opção | Como | Prós | Contras |
|---|---|---|---|
| **A · Tudo link** (só um "linktree" pro Drive) | Página lista links pro Drive | Zero esforço; Drive segue fonte única | ❌ Não buscável por conteúdo; link quebra silenciosamente; sem frescor; a equipe volta pro Drive |
| **B · Tudo hospedado** (upload de tudo no app) | PDFs/PPTX no app | Tudo num lugar | ❌ Ninguém edita PPTX no navegador; duplica storage; versão do app fica velha vs. Drive; migração cara |
| **C · Híbrido por tipo de conteúdo** ⭐ | POP = conteúdo no app; binário = link + metadados | Buscável onde importa; Drive segue vivo pros binários | Exige disciplina de cadastro |

### Recomendação (a validar com o Marcos)
**Opção C — híbrido, dividido pela natureza do conteúdo:**

- **POPs / procedimentos → conteúdo NO APP** (markdown + imagens). É o que precisa ser *buscável, legível no celular e confiável*. É texto+print, não binário editável. → usa a spec de playbooks.
- **Modelos e manuais (PPTX/DOCX/PDF) → LINK pro Drive + ficha no app** (título, dono, "verificado em", tags, descrição, botão "Abrir no Drive"). Ninguém quer editar apresentação no navegador, e o Drive já é a fonte viva desses arquivos. O app vira o **índice buscável e confiável** por cima do Drive.

> **Princípio:** o app hospeda *conhecimento* (texto que se lê e se busca); o Drive hospeda *artefatos* (arquivo que se baixa e se edita). O app indexa os dois e garante o frescor de ambos.

Já existe integração **rclone com o Drive** (apontada nas horas de 15/07) — pode ajudar a automatizar o cadastro/verificação dos links.

---

## 4. §D — Decisões pendentes (fechar com o Marcos antes da spec)

**D1 · Escopo da "IA Defenz"** — a mais importante e a menos definida. "Realizar pesquisas" pode ser:
   - (a) **RAG sobre a base interna** — pergunta em linguagem natural, responde com base nos POPs/manuais, citando a fonte. *Casa perfeitamente com os pilares 2 e 3 e é o maior valor: a IA responde "como faço X" lendo o POP.*
   - (b) **Pesquisa externa/web** (mercado, concorrente, cliente) — mais perto do que já existe em `src/lib/ai/` (Gemini) e das skills de pesquisa.
   - (c) **Ambos**, com seletor de fonte.
   - ➡️ Perguntar ao Marcos: *"quando você pergunta algo pra IA Defenz, ela deve responder olhando os nossos procedimentos, ou buscando no mundo?"*

**D2 · Imagens nos POPs** (o Marcos pediu explicitamente "com imagens"; a spec de playbooks é só markdown hoje):
   - Vercel Blob (stack nativo; suporta público e privado) ⭐ recomendado
   - vs. link de imagem do Drive (zero infra, mas permissão do Drive quebra a imagem)
   - vs. base64 no markdown (❌ incha o banco, mata a busca)

**D3 · Público-alvo/permissão:** o Portal é só interno (equipe Defenz) ou clientes também acessam (ligação com o Service Desk / portal público)? Muda o modelo de permissão.

**D4 · Nome e lugar na nav:** `/dashboard/portal`? Menu próprio de topo? Substitui ou convive com o item "Playbooks" previsto na spec antiga?

**D5 · Migração:** os POPs/manuais de hoje estão em PDF/Drive/skills. Migra tudo pra markdown? Só os mais usados? Começa vazio e preenche no uso?

---

## 5. Contexto técnico útil (para o próximo contexto não redescobrir)

- **Nav do dashboard:** `src/app/dashboard/layout.tsx` (dropdowns: Demandas ~linha 199, Service Desk ~223, Configurações ~272). O padrão de gating por role/empresa está lá (Service Desk é Defenz-only, SD-ADR-001).
- **Rotas existentes:** `src/app/dashboard/{demandas,service-desk,logs,configuracoes}`.
- **IA já no projeto:** `src/lib/ai/` (Gemini + prompts + validação Zod do JSON estruturado) — usada no relatório executivo.
- **Sanitização:** `isomorphic-dompurify` já está no `package.json`.
- **Invariantes obrigatórias:** tenant isolation (`assertCompanyAccess`), `take`/cap em todo `findMany`, AuditLog em toda mutação, fuso SP, sem erro silencioso na UI. Ver `service-desk-GUIA.md` §9 (a checklist vale para qualquer feature).
- **Banco:** Neon, **dev = prod** (ADR-008) — `db push` local atinge produção.

## 6. Próximos passos (ordem sugerida)

1. Brainstorming com o Marcos → fechar **D1–D5**.
2. Reconciliar com `feature-playbooks-manuais.md` (o Portal absorve? renomeia? mantém como sub-feature?).
3. Escrever a spec final (`feature-portal-defenz.md` v1) + plano faseado.
4. Implementar com TDD proporcional; gate `build`+`tsc`+`test` antes de "done".
