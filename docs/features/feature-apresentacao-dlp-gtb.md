# Feature — DLP GTB na Apresentação Defenz

**Status:** APROVADA (23/10) · **F1–F4 IMPLEMENTADAS LOCAL**, conteúdo aprovado pelo Marcos, coluna `tipo` já no Neon · **não deployado**
**Data:** 23/10/2026
**Insumo:** [`docs/pedidos/2026-10-23-dlp-gtb-pesquisa.md`](../pedidos/2026-10-23-dlp-gtb-pesquisa.md) — briefing da pasta do Gustavo + 4 frentes de pesquisa com fonte primária.
**Herda:** `feature-portal-apresentacao.md` (I1–I10, A9–A16, §7.4, §7.5) e `feature-complementos.md` (I-C1: apresentação sem preço).

---

## 1. O problema

A Defenz passou a vender DLP da GTB Technologies (via SecuriSoft). O catálogo de proposta já tem o
item `DLP_GTB` (GTB Endpoint Protector, US$ 48/lic/12m), e a apresentação já o **cita** — mas só
como um parágrafo na página "O que mais pode entrar", igual a um add-on Bitdefender.

Isso não vende DLP. Falta o que o cliente precisa entender antes de pedir proposta: **por que
antivírus não resolve vazamento**, o que a plataforma faz, o que o Endpoint Protector controla,
e por que confiar numa marca que ele não conhece. E falta o caso do cliente que **já tem
antivírus** e só quer DLP: hoje não existe apresentação sem Bitdefender.

## 2. O que a feature faz

Duas formas de gerar, no mesmo Portal, no mesmo template A4 e com o mesmo log:

| Modo | Quando | O que muda |
|---|---|---|
| **A · Bitdefender + DLP** | `DLP_GTB` marcado entre os complementos | O DLP sai do bloco genérico "O que mais pode entrar" e ganha **2 páginas próprias** dentro da apresentação Bitdefender |
| **B · Só DLP** | novo seletor "Tipo: Só DLP (GTB)" | Documento próprio, ~12 páginas, sem nada de Bitdefender |

Mais um ajuste pequeno na **proposta**: DLP só cota a partir de 25 licenças (§9).

## 3. Decisões do Marcos (23/10)

| # | Decisão |
|---|---|
| D1 | **Abrir com a plataforma inteira, focar no Endpoint Protector.** A plataforma (Inspector, Discovery, Cloud Inspector, Console) aparece como contexto; o produto oferecido é o Endpoint Protector. |
| D2 | **As duas possibilidades** — seção dentro da apresentação Bitdefender (modo A) e apresentação só de DLP (modo B). |
| D3 | **Acordo de Canais GTB assinado; certificação Tier 1/Tier 2 ainda não.** |
| D4 | **A GTB já demonstrou todos os controles** à Defenz, na apresentação de validação da parceria. Os recursos existem e podem ser descritos. |

⚠️ **D4 resolve "o recurso existe?", não "o recurso vem no bundle de US$ 48?".** São perguntas
diferentes, e a segunda é a que importa num documento que antecede uma proposta: se a
apresentação diz que o Endpoint Protector bloqueia envio de dado para o ChatGPT e o bundle
cotado não inclui isso, a proposta entrega menos do que a apresentação prometeu. Por isso a
spec separa **o que é da plataforma** de **o que é do bundle cotado** (I-G4) — e a separação
some sozinha no dia em que a SecuriSoft confirmar o escopo (§11, P1).

## 4. Invariantes

Valem para os dois modos. Cada uma tem teste (§10).

- **I-G1 · O nome.** Sempre **"GTB Endpoint Protector"**, nunca "Endpoint Protector" sozinho.
  "Endpoint Protector" é produto da Netwrix (ex-CoSoSys); cliente que pesquisar o nome solto cai
  no concorrente. O teste varre o HTML.
- **I-G2 · Sem preço.** Herda I-C1: nenhum valor em R$ ou US$ na apresentação. Quem tem preço é a proposta.
- **I-G3 · Só prova conferida.** As provas da GTB moram em `gtb-fatos.ts` com fonte, data e
  `origem`, como `institucional-fatos.ts`. Entram só as do §6. Lista `PROIBIDO` com teste,
  igual à da Bitdefender: *"Global 100"*, *"Enterprise Security Magazine"*, *"zero falso
  positivo"*, *"patenteado"/"patenteada"*, *"Lab Approved"* sem o ano, *"Magic Quadrant"*,
  *"mais confiável"*, *"+20 anos"*.
- **I-G4 · Plataforma ≠ bundle.** Duas listas em código:
  - `ENDPOINT_BUNDLE`: as 6 funcionalidades da descrição SecuriSoft do `DLP_GTB` (Local PC
    Discovery, Outlook Discovery, USB e dispositivos, Classificação e marca d'água, Controle de
    aplicações, Auditoria de compartilhamentos) + o que a página do agente da GTB confirma
    (impressora, clipboard, apps de nuvem, offline, Windows/macOS/Linux).
  - `PLATAFORMA`: o resto (Inspector, Discovery Server, Cloud Inspector, OCR, fingerprint, EDM,
    IA generativa).
  A página do Endpoint Protector só lista `ENDPOINT_BUNDLE`. O que está em `PLATAFORMA` aparece
  em página da plataforma, com a frase fixa *"o escopo de cada componente é definido na proposta"*.
  Quando a SecuriSoft confirmar um item no bundle, ele **muda de lista** — sem reescrever texto.
- **I-G5 · Sem certificação, sem promessa de certificação.** Flag `DEFENZ_GTB.certificada = false`.
  Enquanto for `false`, no modo B (e na seção DLP do modo A):
  - não aparece "especialistas certificados" associado à GTB;
  - não aparece "você testa no seu próprio ambiente" / POC conduzida pela Defenz;
  - o próximo passo é **levantamento + demonstração**, não avaliação.
  ⚠️ A página "Quem é a Defenz" e o FAQ "Quem me atende?" atuais afirmam as duas coisas — **sobre
  o Bitdefender**, onde são verdade. No modo B elas **não podem ser reaproveitadas**; existe versão DLP.
- **I-G6 · Não vender medo de multa.** A ANPD aplicou uma multa em dinheiro até hoje (R$ 14.400,
  microempresa, 2023). O art. 52 entra como **teto legal**, com o texto da lei, sem "pode custar
  R$ 50 milhões à sua empresa". Os argumentos de peso são: comunicação obrigatória em 3 dias
  úteis, custo médio de vazamento, IA generativa e a exigência setorial.
- **I-G7 · Sem material da SecuriSoft como imagem.** Nenhum print da reunião (tem rosto e nome de
  participante), nenhum slide da GTB colado. Os diagramas (camadas, canais) são **redesenhados**
  em HTML/SVG na identidade Defenz. Logo da GTB só com autorização (§11, P6).
- **I-G8 · Herdadas sem desconto:** fonte embutida (I10), sem `box-shadow`, sem caractere fora
  da `unicode-range` (ícones em SVG), numeração derivada do array de seções, fuso SP,
  `renderSnapshot` completo, tenant isolation.
  ⚠️ (2ª crítica) A rota de apresentação **nunca gravou AuditLog** — a I-G8 dizia "herdado" por engano.
  Não foi acrescentado aqui; se for exigido, é mudança da apresentação inteira, não desta feature.

## 5. O documento

### 5.1 Modo A — duas páginas dentro da apresentação Bitdefender

Entram **depois** de "O que mais pode entrar" (que continua listando os demais complementos; o
`DLP_GTB` sai dela quando o modo A está ativo, para não aparecer duas vezes).

| Página | Conteúdo |
|---|---|
| **Antivírus protege a máquina. DLP protege o dado.** | A diferença em uma frase (*"o Bitdefender controla por onde o dado sai; o DLP identifica o que está saindo"*); o que o GravityZone já faz (Device Control, bloqueio de texto em web/e-mail) e onde ele para (sem fingerprint, classificação, discovery, OCR); as 6 categorias de dado do deck (pessoais, financeiros, propriedade intelectual, credenciais, regulados, estratégicos) + a pergunta-chave. |
| **GTB Endpoint Protector** | O que controla (`ENDPOINT_BUNDLE`), as ações (registrar, alertar, bloquear, marca d'água, criptografar), offline, Windows/macOS/Linux; uma linha sobre a GTB (fundada em 2004, segundo a fabricante) e a menção de que a plataforma vai além (camadas), sem detalhar. |

⚠️ **Fonte da sobreposição:** `bitdefender.com/business/compare` + doc Content Control (pesquisa §4).
Vai ao `gtb-fatos.ts` com fonte e data, porque é afirmação sobre o produto Bitdefender.

### 5.2 Modo B — apresentação só de DLP

| # | Página | Natureza |
|---|---|---|
| 01 | Capa · *"Proteção de dados com a Defenz"* · cliente · data · vendedor | variável |
| 02 | Confidencialidade + o que você vai ler | fixa |
| 03 | **O dado saiu do perímetro** · as 6 categorias + a pergunta-chave (impacto financeiro, operacional, legal, reputacional) | fixa |
| 04 | **O que está em jogo** · os números de `dlp-fatos.ts` (§7), com fonte e ano | fixa + setor |
| 05 | **Quem é a GTB** · fundação, foco exclusivo em segurança de dados, provas do §6 | fixa ⚠️ validade |
| 06 | **Uma plataforma, camadas de proteção** · Console + Endpoint (em uso) + Inspector (em movimento) + Discovery (em repouso), redesenhado; o Endpoint em destaque | fixa |
| 07 | **GTB Endpoint Protector** · canais, ações, offline, SOs (`ENDPOINT_BUNDLE`) | fixa |
| 08 | **Como ele reconhece o dado** · classificação, fingerprint, OCR, EDM, análise de contexto (`PLATAFORMA`, com a frase de escopo da I-G4) | fixa |
| 09 | **Dados e IA generativa** · prompt, colagem e upload para apps de IA; registrar/alertar/bloquear. IBM 2025: 1 em 5 com vazamento ligado a shadow AI | fixa |
| 10 | **"Já tenho antivírus"** · a mesma página "antivírus × DLP" do modo A | fixa |
| 11 | **Quem é a Defenz** · versão DLP (I-G5): implantação, suporte no Brasil, distribuidor SecuriSoft com suporte em português; **sem** "certificados" e **sem** POC | fixa |
| 12 | **Perguntas frequentes** · §5.3 | fixa |
| 13 | **Próximos passos** · levantamento do ambiente e demonstração; proposta antes de qualquer avaliação | fixa |

Sem página de níveis Bitdefender, sem testes independentes Bitdefender, sem casos gerados por IA
(§8 — fora de escopo).

### 5.3 FAQ do modo B (rascunho — texto final na implementação)

1. **Já tenho antivírus. Por que DLP?** → antivírus × DLP (fecha a porta × olha o conteúdo).
2. **Funciona com o funcionário fora da empresa?** → sim, políticas valem offline.
3. **Atrapalha o trabalho do usuário?** → respostas proporcionais: registrar, alertar, pedir justificativa*, bloquear.
4. **Funciona em Mac e Linux?** → Windows, macOS e Linux.
5. **E a LGPD?** → apoia governança e evidência para auditoria; não "garante conformidade" (nenhuma ferramenta garante).
6. **Já tenho Microsoft 365.** → ⚠️ decisão D-A1 (§11).
7. **Quem me atende?** → Defenz, com suporte técnico da SecuriSoft (distribuidor) em português.

\* "Pedir justificativa" só se P3 confirmar no endpoint; senão sai da frase.

## 6. Provas da GTB que podem ir ao papel (`gtb-fatos.ts`)

| Prova | Frase no papel | Fonte · data |
|---|---|---|
| Fundação | "Fundada em 2004, com foco exclusivo em segurança de dados." | gttb.com · dado do fabricante |
| Corporate Vision | "Reconhecida no Corporate Vision Security Awards 2024 (Data Security)." | corporatevision-news.com · 2024 |
| SelectHub | "1ª colocada no ranking de DLP da SelectHub (nota de analista 88/100)." | selecthub.com · acesso out/2026 |
| Gartner Peer Insights | "Nota 4,7 de 5 no Gartner Peer Insights (mercado DLP), 97 avaliações." | gartner.com · **⚠️ conferir ao vivo antes do deploy** |

Todas com `origem: 'fabricante'` ou `'avaliador'` impressa na linha de fonte, e `vigenteDesde`
carimbado (§7.5 da spec-mãe: carimbo envelhece).

**Fora:** Global 100, Enterprise Security Magazine, SC Lab Approved (2007), patente (expirada em
2024), "zero falso positivo", Magic Quadrant — motivos no insumo.

## 7. Números de contexto (`dlp-fatos.ts`)

Só fonte primária, valor literal:

| Fato | Fonte |
|---|---|
| Multa até 2% do faturamento, limitada a R$ 50 milhões por infração (teto legal) | LGPD art. 52, II |
| Incidente com dado pessoal comunicado à ANPD em até 3 dias úteis | Res. CD/ANPD nº 15/2024, art. 6º |
| 1 em cada 5 organizações teve vazamento ligado a shadow AI; uso alto custou US$ 670 mil a mais | IBM/Ponemon, Cost of a Data Breach 2025 |
| Custo médio global de um vazamento: US$ 4,99 milhões, recorde | IBM, Cost of a Data Breach 2026 |
| Regulação bancária exige "prevenção de vazamento de informações" | Res. CMN 4.893/2021, art. 3º §2º — **só quando o setor for financeiro** |

⚠️ Pendentes de fonte primária, **não entram**: Brasil R$ 7,44 mi (IBM 2026), shadow AI 43%,
Verizon 62%, LayerX 77%. Se a primária aparecer, entram por PR com o link.

## 8. Fora de escopo

- **Pesquisa por IA de casos de vazamento** no modo B. A pesquisa atual mapeia caso → recurso
  Bitdefender (Anexo A); para DLP seria outro catálogo e outra guarda. Fica para depois, se o
  modo B pegar.
- Preço de Inspector, Discovery e Cloud Inspector (não estão no catálogo; continuam sob consulta fora do gerador).
- Template novo de proposta DLP — a proposta "só de add-ons" (`d3bb8d6`) já emite DLP sozinho.
- Nomear concorrente (A15 continua valendo — Netwrix, Purview etc. **não** aparecem por nome, salvo D-A1).

## 9. Proposta — mínimo de 25 licenças no DLP

A regra de canal da SecuriSoft é **cotação a partir de 25 licenças**. Hoje o gerador emite
`DLP_GTB` com qualquer quantidade (o add-on tem quantidade própria desde `d3bb8d6`).

- Zod da proposta recusa `DLP_GTB` com quantidade < 25, mensagem: *"A GTB só cota DLP a partir de 25 licenças."*
- Constante `QUANTIDADE_MINIMA` no item do catálogo (não regra solta na rota).
- Teste: 24 recusa, 25 passa.
- ⚠️ Antes de subir: listar propostas já emitidas com DLP < 25 (consulta, sem alterar nada) e mostrar ao Marcos.

## 10. Dados, rotas e testes

**Dados.** `Apresentacao.tipo String @default("bitdefender")` — valores `bitdefender | dlp`.
Aditivo, com default: registros antigos ficam `bitdefender`. ⚠️ Dev e prod usam o **mesmo Neon**
(ADR-008): o `db push` atinge produção — fazer só com o código que lê o campo pronto.

**Rotas.** As mesmas (`POST /api/portal/apresentacoes`, `GET .../[id]/arquivo`). O schema Zod
ganha `tipo`; com `tipo: 'dlp'`, `nivelDestaque`, `complementos` e `casos` são ignorados (e o
servidor recusa `casos` não vazio no modo B, em vez de descartar em silêncio).

**Re-download.** `TEMPLATE_VERSAO` sobe. Apresentações antigas **com `DLP_GTB` marcado** mudam no
re-download (o parágrafo vira 2 páginas) — o aviso de template divergente que já existe cobre;
antes do deploy, contar quantas são.

**Testes (proporcionais).**
- I-G1: HTML dos dois modos não contém "Endpoint Protector" sem "GTB " antes.
- I-G2: nenhum `R$`/`US$` seguido de número fora da página de fatos.
- I-G3: `PROIBIDO` varre os dois modos.
- I-G4: página do Endpoint só contém itens de `ENDPOINT_BUNDLE`; mover um item de lista muda a página.
- I-G5: com `certificada=false`, modo B não contém "certificad" nem "prova de conceito"/"seu próprio ambiente".
- Modo A: com `DLP_GTB`, as 2 páginas aparecem e o `DLP_GTB` some de "O que mais pode entrar"; sem `DLP_GTB`, HTML **idêntico** ao atual (regressão).
- Modo B: numeração contínua 01..N, sem página Bitdefender.
- Rota: `tipo:'dlp'` com `casos` → 400. Proposta: 24 recusa, 25 passa.
- Render real (PDF) dos dois modos conferido com `pdffonts` (fonte única embutida).

## 11. Pendências

**Decisões do Marcos (antes de implementar):**
- **D-A1 · FAQ "Já tenho Microsoft 365".** (a) Responder citando o Purview e seus limites
  (Linux não coberto, endpoint DLP só no E5 ou add-on) — é exceção declarada à A15, como a de
  22/08; ou (b) resposta genérica sem nomear. Recomendo **(a)**: é a objeção mais provável e a
  resposta tem fonte da própria Microsoft.
- **D-A2 · Seção financeira.** Incluir a Res. CMN 4.893 automaticamente quando o setor for financeiro? Recomendo sim.

**Perguntas à SecuriSoft/GTB (não bloqueiam a implementação; mudam listas, não estrutura):**
- P1 · O bundle de US$ 48 inclui Security Manager (fingerprint), OCR no agente, EDM e controle de IA generativa?
- P2 · Nome oficial: "GTB Endpoint Protector" (SecuriSoft) ou "GTB Endpoint Protect" (site da GTB)?
- P3 · Justificativa do usuário e print screen estão no agente?
- P4 · Matriz oficial de SOs e versões.
- P5 · Console multi-tenant para MSSP existe? Requisitos do console on-prem.
- P6 · A Defenz pode usar o logo da GTB no material?
- P7 · Previsão da certificação Tier 1/Tier 2 (vira `certificada = true` e libera POC).

## 12. Fases

Cada uma deixa o sistema rodável e deployável.

| Fase | Entrega |
|---|---|
| **F1** | `gtb-fatos.ts` + `dlp-fatos.ts` + listas `ENDPOINT_BUNDLE`/`PLATAFORMA` + `PROIBIDO` + testes. Sem mudança visível. |
| **F2** | Modo A (2 páginas na apresentação Bitdefender) + regressão "sem DLP = HTML idêntico". |
| **F3** | Modo B: campo `tipo`, seletor no formulário, template das 13 páginas, versão DLP de "Quem é a Defenz" e do FAQ. |
| **F4** | Mínimo de 25 licenças na proposta (+ consulta das já emitidas). |

Antes de "done" em cada fase: `npm run build && npx tsc --noEmit && npm test`. Crítica
adversarial da spec antes da F1 (padrão da casa) e do PDF real antes do deploy da F3.

## 13. Decisões e crítica de 23/10

- **D-A1 = sim** (FAQ nomeia o Purview; exceção à A15 restrita a `FAQ_MICROSOFT`, com fonte impressa).
- **D-A2 = sim** (Res. CMN 4.893 quando o setor for financeiro — lista própria, sem "seguro").

Crítica adversarial (12 achados) — o que mudou na implementação:
- 🔴 `ENDPOINT_BUNDLE` ficou **só com os 6 itens da SecuriSoft**; impressão, clipboard e nuvem foram para
  `AGENTE_PLATAFORMA`, numa caixa "na plataforma, o agente também controla" com a frase de escopo.
- 🔴 Página antivírus × DLP do modo B **sem marca** (o cliente tem outro antivírus); a do modo A cita o GravityZone com fonte.
- 🔴 Página de identificação = "Como **a plataforma** reconhece o dado"; página de IA com a frase de escopo.
- 🔴 Abertura e encerramento do modo B são próprios (`MOLDURA_DLP`): sem "instituições independentes", sem avaliação no ambiente.
- 🔴 **Pendente (F3):** re-download do modo B precisa ler `tipo` e congelar o conteúdo GTB (provas, listas, flag) —
  `templateVersao` do modo B carrega `GTB_VIGENCIA`, com teste de hash que obriga a subir a vigência quando o conteúdo muda.
- 🟠 Modo A: linha na página do Endpoint Protector — "na proteção de dados, o próximo passo é levantamento + demonstração".
- 🟠 Varredura de `PROIBIDO_GTB` só no conteúdo GTB no modo A (o MQ 2025 do Bitdefender é legítimo).
- 🟠 Modo B usa `dlpFatosParaSetor`, nunca `fatosParaSetor` (o R$ 7,19 mi não entra). LGPD com destaque "até 2%", não "R$ 50 milhões".
- 🟠 **Pendente (F4):** o mínimo de 25 vale para a quantidade EFETIVA do DLP (`quantidadesComplemento.DLP_GTB ?? quantidade`).
- 🟡 IBM: "entre as organizações com vazamento estudadas, uma em cada cinco…".

## 14. Como ficou (23/10, fim do dia)

- **Código:** `gtb-fatos.ts` (provas, `ENDPOINT_BUNDLE` só com os 6 da SecuriSoft, `AGENTE_PLATAFORMA`,
  `PLATAFORMA`, `PROIBIDO_GTB`, `DEFENZ_GTB.certificada=false`), `dlp-fatos.ts`, `templates/a4-base.ts`
  (helpers extraídos — HTML Bitdefender conferido **byte a byte idêntico**), `templates/dlp-secoes.ts`
  (modo A e B + `MOLDURA_DLP`), `templateVersaoDoDocumento()` (`+gtb-<vigência>` só com conteúdo GTB).
- **Rotas:** POST grava `tipo` e usa `dlpFatosParaSetor` no modo B; re-download lê `tipo`. Schema recusa casos no modo B.
- **Formulário:** seletor "Tipo de apresentação"; no Só DLP somem nível, casos e complementos.
- **Proposta (F4):** `quantidadeMinima: 25` no `DLP_GTB`, validado na quantidade EFETIVA. Nenhuma proposta
  do gerador tinha DLP (consulta 23/10).
- **Banco:** `ALTER TABLE apresentacoes ADD COLUMN tipo TEXT NOT NULL DEFAULT 'bitdefender'` aplicado no
  Neon (diff conferido antes: era a única instrução). ⚠️ Por isso o deploy já pode ir — o select de `tipo` não quebra.
- **Testes:** `dlp-gtb.test.ts` (18) — I-G1..I-G6, regressão do modo A, setor financeiro, hash que obriga
  subir `GTB_VIGENCIA` quando o texto GTB muda, mínimo de 25. Suíte: 1034 verdes; build ok.
- **Re-download:** 8 das 36 apresentações já emitidas citavam o DLP — passam a sair com as 2 páginas novas
  e o header de template divergente.
- **2ª crítica** (aplicado): USB sem "pelo conteúdo do arquivo"; cartão IBM shadow AI só na página de IA;
  template recusa fato fora de `DLP_FATOS` no modo B.

**Pendente (atualizado 23/10, deploy):** Marcos dispensou as perguntas P1–P7 — o texto segue no escopo
conservador (só os 6 itens SecuriSoft, `certificada=false`). Os dois 🟡 fechados: a listagem mostra
"Só DLP" e calcula a divergência com `templateVersaoDoDocumento` (antes todo documento novo com GTB
aparecia como modelo divergente), e o arquivo do modo B sai `Defenz_Apresentacao_DLP_...`. Em aberto:
rota de apresentação não grava AuditLog.
