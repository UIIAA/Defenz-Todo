# Feature: Custo Real do Endpoint — o ebook e a calculadora

**Status:** DRAFT v2 · aguarda aprovação
**Slug:** `feature-calculadora-tco`
**v1:** 23/08/2026 · **v2:** 23/08/2026, depois de o Marcos responder Q1–Q5 e eu ir olhar o
site. **A v2 corrige erros estruturais da v1** — registro do que mudou no §16.

---

## 1. Objetivo

Duas peças que só funcionam juntas:

1. **Um ebook** para download, dirigido a **empresas de TI** — simultaneamente clientes
   potenciais e potenciais indicadores.
2. **Uma calculadora** em `defenz.com.br/marketplace/`, que faz a conta do ebook com os
   números do próprio leitor e entrega o resultado mediante e-mail e nome da empresa.

O ebook estabelece o método. A calculadora captura. A conversão não está no PDF — está no
momento em que o cara vê o custo **dele**.

### 1.1 O mecanismo de indicação é o que decide o tema

O melhor material para quem pode **indicar** não é o que explica o produto da Defenz — é o
que **arma o cara para a conversa dele com o cliente dele**. Ele baixa, usa o argumento, o
cliente aceita, e agora precisa de quem entregue a solução por trás do argumento. Um ebook
sobre "por que a Defenz é boa" não tem esse efeito: fica na gaveta.

### 1.2 A quinta variável é o pitch, e nasce da conta

O método tem cinco variáveis (§4). As quatro primeiras são do laboratório. **A quinta —
custo de operar o console — não está no relatório porque o laboratório testa o produto, não
o serviço.** Uma empresa de TI não pode excluí-la: é o que ela vende. E é exatamente a linha
que **muda de dono quando ela terceiriza para um MSSP**. O material revela a linha; a Defenz
zera a linha. O argumento sai da própria conta.

---

## 2. O que foi medido antes de desenhar

### 2.1 O método existe, é público, e não é nosso

Lido em 22/08 direto do PDF primário (`avc_epr_2025.pdf`, AV-Comparatives EPR Comparative
Report 2025). ⚠️ **As tabelas são imagem** — `pdftotext` devolve 288 linhas inúteis; é
preciso rasterizar as páginas.

| Variável | Onde | O que o laboratório faz |
|---|---|---|
| Licença | p. 23 | preço de lista, 5 anos, 5.000 estações |
| Acurácia operacional | p. 24 | faixas por nº de cenários afetados; fator ×0 a ×20 |
| Atraso de workflow | p. 25 | faixas por minutos de espera; fator ×0 a ×10 |
| Custo de brecha | p. 9 | % do custo total conforme a **fase** em que parou |
| **Operação/console** | *não existe* | o laboratório testa produto, não serviço |

**A tabela de custo de brecha (p. 9) sustenta o ebook inteiro:**

| Onde parou o ataque | % do custo de brecha que entra |
|---|---|
| Resposta ativa na fase 1 | **0%** |
| Só detecção na fase 1 | 12,5% |
| Resposta ativa na fase 2 | 25% |
| Só detecção na fase 2 | 50% |
| Resposta ativa na fase 3 | 75% |
| Só detecção na fase 3 | 95% |
| Nenhuma resposta | 100% |

É isso — não a diferença de licença — que explica o intervalo de custo entre fornecedores.

### 2.2 O número que abre o ebook

Da p. 14 (`5-Year Product Cost` vs `5-Year TCO`, por estação):

| Produto | Licença | Custo total | Multiplicador |
|---|---|---|---|
| G Data | **US$ 80** — a mais barata do teste | US$ 1.620 | 20× |
| Bitdefender | US$ 100 | **US$ 210** | 2,1× |
| VIPRE | US$ 120 | US$ 230 | 1,9× |
| ESET | US$ 152 | US$ 2.132 | 14× |
| Kaspersky | US$ 206 | US$ 2.846 | 14× |
| Fornecedor B (anônimo) | US$ 195 | US$ 6.135 | 31× |

**A licença mais barata do teste termina custando 7,7× mais que a que custa US$ 20 a mais na
entrada.**

⚠️ **Armadilha registrada** (`feature-portal-apresentacao.md` §7.3.2-bis): a p. 23 mostra a
G Data mais barata que a Bitdefender. Aquilo é **preço de lista**. Quem citar a p. 23
achando que é TCO afirma o contrário do que quer.

### 2.3 ⚠️ O `defenz.com.br` NÃO é este projeto

`Server: Apache/2.4.62 (Unix)`, HTML estático, sem `X-Powered-By`. O `/marketplace/` é uma
**SPA React servida como arquivo estático**: React 18 UMD do unpkg + um `bundle.js` +
`assets/{sections,tokens}.css`, com cache-bust `?v=mp4albjb`. GTM `GTM-W6HMJ9DP` instalado,
com `dataLayer` já instrumentado fora do bundle.

**A ordem de render hoje** (`function App`):

```
Nav → HeroAct → CredentialsAct → RiskAct → GravityZoneAct → PracticeAct → MarketplaceAct → FooterAct
```

`MarketplaceAct` é a **Cotação** — o "Configurar proposta" do menu.

### 2.4 ⚠️ A Cotação já faz quase tudo que a v1 desta spec ia construir do zero

`window.DEFENZ_API_BASE = "https://code.escaladaonline.com.br"` (o n8n). Dois webhooks:

| Webhook | Workflow n8n |
|---|---|
| `/webhook/lp-defenz-lead` | `Defenz LP → Zoho Lead (Google Ads)` (`fsQbtBB1syMJ2xpJ`) |
| `/webhook/defenz-quote-email` | `Defenz LP → Proposta Executiva por E-mail` (`mtJiqtQB16xxF99H`) |

E o fluxo da cotação já é **exatamente o desenho certo**:

```
Webhook → Validate & Normalize → If Valid
   ├─ Respond Error
   └─ Respond OK          ← responde ANTES de renderizar
        → Render HTML (Code)
        → PDFShift         ← PDF por serviço HTTP, não Chromium
        → Build Email → Resend
             ├─ Zoho HTTP Lead Upsert → Prep Sheet Row → Sheets → Outlook Notify Sales
             └─ Outlook Alert (Resend Failed)
```

**Isto mata três coisas da v1 de uma vez:** não há Chromium (logo não há vetor de custo de
Lambda), não há modelo Prisma a criar (o lead vive em Zoho + Sheets), e não há superfície
pública nova neste repositório (logo **a I8 sobrevive intacta**).

### 2.5 ⚠️ O `bundle.js` é o fonte, e isso é uma restrição real

Três cópias do site no disco, **byte-idênticas** (`md5 e7f01aab…`) e todas na versão
publicada:

| Pasta | git |
|---|---|
| `Defenz/defenz-site` | ✅ `main` — 1 commit, *"baseline do site (espelho do publicado 05/07/2026)"* |
| `Defenz/Defenz -Marketing/defenz-site` | branch `conceito-armadura` |
| `Defenz/defenz-site-live/defenz.com.br` | sem git |

E o bundle é **70 KB em 3 linhas**, `React.createElement` puro, sem JSX, sem build, sem
`src/`. Ou seja: **não existe fonte mais legível do que o publicado.**

Consequência de desenho (D8): a calculadora **não entra dentro do `bundle.js`**. Ela vira
`calculadora.js`, arquivo próprio e legível, e o diff no bundle é de duas linhas. Enfiar um
componente interativo inteiro num arquivo de 3 linhas produz um diff que ninguém revisa.

### 2.6 Não existe tratamento de LGPD em nenhum dos dois lados

Varredura no repo To-Do e no bundle: nada. O `lp-defenz-lead` já coleta e manda pro Zoho
**sem registro de consentimento**. Isso é dívida que já existe; esta feature não a cria, mas
seria ruim ampliá-la calada. §7.

---

## 3. Decisões

| # | Decisão | Porquê |
|---|---|---|
| D1 | **Ebook e calculadora derivam de UMA fonte de constantes** | Se cada um tiver a sua cópia, eles **discordam em público**. O ebook é PDF baixado que não volta atrás. Como agora são dois repositórios, o D1 ganha mecânica própria — §4.5 |
| D2 | **O ebook é renderizado por código** no repo To-Do (HTML → Chromium → PDF), como proposta e apresentação | Caminho já provado, números do catálogo, versionado, medidor de corte |
| D3 | **A calculadora NÃO estima custo de brecha em reais** | §4.4. É o maior risco de correção da feature |
| D4 | **Gate = e-mail + nome da empresa.** MX obrigatório; **sem blocklist de provedor gratuito** | Q3 = *não*. §6 |
| D5 | **Consentimento LGPD explícito, nunca pré-marcado** | §7 |
| **D6′** | **O lead segue o caminho que já existe: Zoho + Sheets + Outlook**, clonando o fluxo da cotação | ⚠️ **Reverte o D6 da v1**, que dizia "Zoho fora de escopo porque o fluxo n8n não existe". Existe, está ativo e é bom (§2.4) |
| **D7′** | **Nada de tela nova no `/dashboard`** | ⚠️ Reverte o D7 da v1. O lead vive no Zoho, que é onde o Gustavo já trabalha. Criar uma segunda caixa de entrada de lead é pior que não ter |
| D8 | **A calculadora é um `calculadora.js` separado**, montado pelo `App` | §2.5 |
| D9 | **O PDF do resultado sai por PDFShift + Resend**, clonando `defenz-quote-email` | Padrão que já funciona em produção. Não inventar um segundo |
| D10 | **Ordem nova:** `Hero → Calculadora → Cotação → resto` | Pedido do Marcos. §5.2 |

---

## 4. O método — as cinco variáveis

### 4.1 As três que a empresa de TI mede sozinha

| # | Variável | Entrada | Fórmula (5 anos) |
|---|---|---|---|
| V1 | **Licença** | preço/estação/mês, nº de estações | `preço × estações × 60` |
| V2 | **Acurácia operacional** | chamados de falso positivo/mês, min por chamado, custo-hora do técnico | `chamados × (min/60) × custo-hora × 60` |
| V3 | **Atraso de workflow** | ocorrências/mês, min de espera, custo-hora do usuário parado | `ocorrências × (min/60) × custo-hora × 60` |

### 4.2 A quarta: operação e console

| V4 | **Operação** | horas/mês de gestão (deploy, política, relatório), custo-hora | `horas × custo-hora × 60` |

⚠️ **É a linha do pitch.** No resultado ela aparece destacada, com a legenda: *"esta é a
linha que muda de dono quando a operação é terceirizada."* Sem adjetivo, sem promessa.

### 4.3 O resultado

```
Custo total 5 anos  =  V1 + V2 + V3 + V4
Custo por estação   =  total ÷ estações
% que é licença     =  V1 ÷ total        ← a saída que dói
```

No teste do laboratório essa fração vai de ~48% (Bitdefender) a ~3% (fornecedor B). É a
prova de que preço de lista não prevê nada.

### 4.4 ⚠️ D3 — por que o custo de brecha NÃO entra em reais

A tentação é multiplicar probabilidade por R$ 7,19 milhões (IBM, recorte Brasil, já em
`mercado-fatos.ts`) e somar. **Não vamos, e a razão é dura:**

1. **A escala não transfere.** O Cost Unit do laboratório é US$ 1,76 mi para **5.000
   estações**; o R$ 7,19 mi da IBM é média de violação corporativa, coorte enterprise. Os
   dois aplicados a um contrato de 40 estações produzem número absurdo.
2. **A probabilidade seria chute.** Não há incidência por porte no Brasil com fonte citável.
   Um "12% ao ano" inventado é o ÷48 outra vez: plausível, calculado, errado.
3. **Número assustador e indefensável é pior que nenhum.** O público é técnico. Uma empresa
   de TI que refaz a conta e não fecha **perde a confiança no material inteiro** — inclusive
   nas três variáveis que estavam certas.

**No lugar:** um bloco separado e rotulado — *"exposição, para você estimar"* — onde **o
usuário informa** quanto custaria uma parada de um dia na operação dele, e a calculadora
aplica a tabela de fases da p. 9 àquele valor. O número é dele; a tabela é do laboratório; a
Defenz não estimou nada. Estende I9 na direção certa.

### 4.5 ⚠️ Como o D1 sobrevive a dois repositórios

O ebook nasce no repo **To-Do**; a calculadora mora no repo **defenz-site**. Duas cópias das
constantes é exatamente o que o D1 proíbe. Mecânica:

```
src/lib/tco/constantes.ts          ← FONTE ÚNICA (To-Do), com página do PDF anotada por número
        │
        ├─ ebook  → render HTML → PDF                 (To-Do)
        └─ script emite  constantes.js  (objeto puro) → copiado para defenz-site/marketplace/
```

**E um teste no To-Do falha se o `constantes.js` do site estiver defasado** — compara o
emitido com o commitado. Sem esse teste o D1 é intenção, não garantia.

---

## 5. Onde entra na página

### 5.1 Ordem nova (D10)

```
Nav → HeroAct → ✨CalculadoraAct → MarketplaceAct (Cotação) → CredentialsAct
    → RiskAct → GravityZoneAct → PracticeAct → FooterAct
```

`MarketplaceAct` sobe da 7ª para a 4ª posição; o resto desce.

### 5.2 O que a reordenação custa, e como pagar barato

Pôr as duas ferramentas no topo empurra `CredentialsAct` (quem é a Bitdefender), `RiskAct`
(o porquê) e `GravityZoneAct` (o quê) para **depois** de a pessoa ser convidada a configurar
uma proposta. Para tráfego frio isso é pedir compromisso antes de dar contexto.

**Só que a calculadora é uma entrada fria excelente** — não exige saber nada do produto,
começa pelos números do próprio visitante. Então a ordem se sustenta, com uma condição:

> **O resultado da calculadora é o lugar natural da credibilidade.** Em vez de o visitante
> rolar por uma seção institucional, ele recebe o dado do EPR **como explicação do próprio
> número** ("por que o intervalo entre fornecedores é tão grande"). O material de
> credibilidade deixa de ser seção a pular e vira a resposta a uma pergunta que ele acabou
> de fazer.

Isso não é enfeite: é o que impede a reordenação de virar perda líquida.

### 5.3 O gate (Q1 = B)

| Momento | O que aparece |
|---|---|
| Preenchendo as 4 variáveis | **o total, ao vivo e grande** — a ferramenta prova que é real |
| Clicou em "ver onde vaza" | formulário: nome, e-mail, empresa, consentimento |
| Passou | detalhamento por variável + a linha V4 destacada + PDF por e-mail |

O total sem o detalhamento não é acionável: ele ainda precisa saber **onde** vaza, e é isso
que troca pelo e-mail.

---

## 6. O gate — campos e checagem

| Campo | Regra |
|---|---|
| `nome` | obrigatório, 2–80 |
| `email` | obrigatório, formato + **MX no domínio** |
| `nomeEmpresa` | obrigatório, 2–120, sem HTML |
| `consentimento` | boolean, tem de ser `true`, **nunca pré-marcado** |
| `_hp` / `_t` | honeypot + tempo-mínimo 2000ms, como o `/abrir-ticket` faz |

### 6.1 ⚠️ Q3 = não. Sem blocklist — e o que isso muda

A v1 propunha barrar provedor gratuito. **O Marcos disse não, e a decisão fecha com o funil
que já existe:** o lead cai no Zoho e o Gustavo qualifica na ligação. Barrar Gmail perderia
a consultoria de TI de uma pessoa só — que nesse público é lead legítimo e frequente.

**O que sobra é a checagem de MX**, e ela não é filtro de "corporativo": é **checagem de
entregabilidade**. Se o domínio não tem MX, o e-mail não recebe o PDF — barrar ali ajuda o
usuário em vez de filtrá-lo. Pega erro de digitação e domínio inventado.

**Então "e-mail corporativo" vira rótulo do campo, não regra.** O campo pede *"e-mail
corporativo"*, o `nomeEmpresa` é obrigatório, e quem insistir em Gmail passa. Vale dizer com
todas as letras: **o gate qualifica intenção, não identidade.** Ninguém confirmou que a
pessoa trabalha lá.

---

## 7. LGPD

Primeira coleta com consentimento registrado no ecossistema Defenz (§2.6). Mínimo:

1. **Base legal:** consentimento (art. 7º, I), checkbox **não pré-marcado**.
2. **Finalidade na própria tela:** *"Usamos seu nome, e-mail e empresa para enviar o
   resultado do cálculo e entrar em contato sobre soluções de segurança."*
3. **Registro do que foi aceito:** `consentimentoEm` + `consentimentoTexto` (versão do
   texto) viajam no payload e são gravados na linha do Sheets e no campo de descrição do
   Lead no Zoho. Sem isso não há como provar **o que** a pessoa aceitou quando o texto mudar.
4. **Exclusão a pedido:** manual, pelo Zoho, no MVP.

⚠️ **Não sou advogado e isto não é parecer** — é o piso para não nascer irregular. Q4 = ok:
o texto do item 2 passa pela assessoria antes do deploy. São duas linhas e é barato antes.

⚠️ **Registro honesto:** o `lp-defenz-lead` que já roda **não** tem nada disso. Esta feature
não cria a dívida, mas se o item 3 for implementado só aqui, ficam dois padrões convivendo.
Vale considerar retrofitar o `lp-defenz-lead` no mesmo passo — **não** estou colocando isso
no escopo, só marcando.

---

## 8. Onde os dados ficam

**Nenhum modelo Prisma novo.** (⚠️ reverte a v1.) O caminho é o que já existe:

| Dado | Onde |
|---|---|
| Lead (nome, e-mail, empresa, consentimento) | **Zoho CRM** via `Zoho HTTP Lead Upsert` |
| A conta feita (entradas + resultado + versão das constantes) | **Google Sheets**, uma linha por execução |
| Notificação | **Outlook** para vendas, como a cotação já faz |
| Evento de funil | **dataLayer/GTM**, no padrão que o `defenz-tracking` já usa |

⚠️ **As entradas e o resultado vão congelados na linha do Sheets, junto com
`constantesVersao`.** É a lição do re-download da Proposta: quando a constante mudar, "que
conta a gente mostrou pra esse cara" não pode virar memória.

---

## 9. O ebook

**Título:** *O custo real do endpoint*
**Subtítulo:** *Onde a margem do seu contrato de TI vaza — e como calcular o custo da sua
solução de segurança em cinco variáveis.*

Os dois ângulos, na ordem que funciona: a dor abre, o método entrega.

| Cap. | Conteúdo | Fonte |
|---|---|---|
| 1 | A conta que todo contrato faz errado — licença ÷ estações | argumento |
| 2 | A tabela que prova — a licença de US$ 80 que termina em US$ 1.620 | EPR p. 14, 23 |
| 3 | As cinco variáveis, uma por página, com como medir | EPR p. 9, 23–25 + §4 |
| 4 | Por que a fase importa — custo de brecha por fase | EPR p. 9 |
| 5 | Exemplo trabalhado — contrato de 200 estações, linha a linha | §4 |
| 6 | Faça com os seus números → calculadora | — |

**Q2 = ok: os fornecedores são nomeados.** São resultados de teste público e independente, e
a Defenz não emite juízo sobre nenhum — reporta o que o laboratório publicou. A diferença é
entre *"o X é ruim"* (nossa afirmação) e *"o laboratório mediu X"* (fato citável).

⚠️ **Isso é uma segunda exceção à A15, e ela é mais larga que a de 22/08** — aquela permitia
comparar com o *conjunto* sem nomear; esta nomeia. Precisa ficar escrita em
`institucional-fatos.ts` como exceção **de escopo ebook**, e o teste que guarda a A15 **não
pode** passar a valer para o material institucional por tabela. Duas superfícies, duas
regras, ambas explícitas.

⚠️ **Disciplina de 22/08 em dobro:** ebook é público, indexado e não volta atrás. Todo
número sai do PDF primário com a página anotada. O caso do *"único fabricante"* mostrou que
material de fabricante chega com frase que o próprio relatório derruba.

**Onde mora:** PDF estático em `defenz-site`, servido pelo Apache. Sem gate (§9.1).

### 9.1 O ebook não tem gate; a calculadora tem

Deliberado. **O ebook é a peça de alcance** — tem de circular sem atrito, inclusive ser
reencaminhado dentro do cliente. **A calculadora é a peça de conversão.** Gate nos dois mata
o alcance e não aumenta a captura: quem não entrega e-mail por um PDF também não entrega por
dois.

---

## 10. Entregáveis por repositório

| Repo | O quê |
|---|---|
| **To-Do** | `src/lib/tco/constantes.ts` + `calculo.ts` + testes · template e render do ebook · script que emite `constantes.js` · teste que detecta o site defasado |
| **defenz-site** | `marketplace/calculadora.js` · `marketplace/constantes.js` (gerado) · 2 linhas no `bundle.js` · CSS em `assets/sections.css` · o PDF do ebook |
| **n8n** | workflow `Defenz Calculadora → Resultado por E-mail`, clone de `mtJiqtQB16xxF99H` |

---

## 11. Fases

| Fase | Entrega | Fecha sozinha? |
|---|---|---|
| **F1** | `constantes.ts` + `calculo.ts` + testes. JS puro, sem UI, sem rota | sim — é o núcleo do D1 |
| **F2** | O ebook: template, render, medidor de corte, PDF no site | sim |
| **F3** | `calculadora.js` + CSS + as 2 linhas no bundle + reordenação (D10). **Sem gate**: calcula e mostra o total | sim — ferramenta útil já no ar |
| **F4** | O gate + o workflow n8n + Zoho/Sheets/Outlook + dataLayer | sim |
| **F5** | Retrofit de consentimento no `lp-defenz-lead` | **fora do MVP**, marcado no §7 |

⚠️ **F1 antes de tudo, e sozinha.** É o módulo que ebook e calculadora compartilham. Se sair
depois de qualquer um dos dois, nasce a divergência que o D1 existe para impedir.

⚠️ **F3 sem F4 é entregável de verdade**, não meia-feature: uma calculadora que mostra o
total e não pede nada. Se o gate atrasar, o que está no ar continua fazendo sentido.

---

## 12. Critérios de aceite

**Nível 1 — automatizável (Vitest, no repo To-Do):**

- [ ] `calculo.ts` é puro e determinístico; sem `Date.now()`
- [ ] as quatro variáveis somam o total; `% licença` bate com `V1 ÷ total`
- [ ] entrada zero/negativa é recusada com mensagem — nunca `NaN` nem `Infinity`
- [ ] **o `constantes.js` commitado no site é idêntico ao emitido pelo `constantes.ts`** (D1)
- [ ] o PDF do ebook fecha sem corte — `smoke` medindo página a página, como a apresentação
- [ ] toda constante tem página do PDF primário anotada (teste varre o campo)

**Nível 1 — no site (o que der para testar sem framework):**

- [ ] consentimento `false` ou ausente → não envia
- [ ] MX inexistente → mensagem clara, não erro genérico
- [ ] honeypot preenchido ou `_t < 2000` → não envia

**Nível 2 — conferência humana antes do deploy:**

- [ ] todo número do ebook conferido no PDF primário
- [ ] o Marcos lê o ebook inteiro sem ninguém explicar
- [ ] uma empresa de TI real refaz a conta à mão e chega no mesmo número
- [ ] a página com a ordem nova, vista no celular — a Hero seguida de formulário é o risco

---

## 13. Riscos

| # | Risco | Mitigação |
|---|---|---|
| R1 | **Três cópias do site no disco, byte-idênticas, duas sem git confiável** | Q6. Enquanto não houver uma canônica declarada, qualquer edição pode ser sobrescrita por um deploy da cópia errada. **É o maior risco operacional da feature** |
| R2 | **Ebook e calculadora divergirem em público** | D1 + o teste do §4.5 |
| R3 | **Número indefensável assusta e queima credibilidade** | D3 |
| R4 | **`bundle.js` de 3 linhas fica pior a cada edição** | D8 — arquivo separado, diff de 2 linhas |
| R5 | **A reordenação derruba conversão da Cotação** | §5.2; e é reversível em 1 linha |
| R6 | **LGPD** | §7; Q4 aprovado |
| R7 | **Lead que não vira nada** | fora do escopo técnico, mas: sem o Gustavo ligando em 24h, a feature entrega planilha, não receita |
| R8 | **PDFShift é dependência externa paga** | já é dependência da Cotação em produção; não é risco novo, mas o volume sobe |

---

## 14. Fora de escopo

- Double opt-in · captcha · A/B de copy · versão em inglês
- Comparação de fornecedor **dentro** da calculadora — ela calcula o custo da solução *do
  usuário*, não ranqueia produto
- Estimativa de custo de brecha em reais (D3)
- Retrofit de consentimento no `lp-defenz-lead` (§7, marcado)

---

## 15. O que ainda depende do Marcos

- **Q6 — qual cópia do site é a canônica, e como se publica?** `defenz-site` é a única com
  git em `main` e tem uma pasta `deploy/`. Confirmo que é ela e que o deploy sai dali? ⚠️ É
  bloqueante para a F3: sem isso, editar é apostar.
- **Q7 — `calculadora.js` como arquivo separado, OK?** (D8) A alternativa é editar o
  `bundle.js` de 3 linhas, que eu não recomendo.
- **Q8 — a Cotação sobe junto com a Calculadora, ou só a Calculadora entra e a Cotação fica
  onde está?** Li o seu pedido como *Hero → Calculadora → Cotação*, o que move a Cotação
  quatro posições para cima. Confirma?

### Respondidas em 23/08

| | Resposta | Onde entrou |
|---|---|---|
| Q1 gate | **B** — total visível, detalhamento atrás do gate | §5.3 |
| Q2 nomear fornecedores | **ok** — nomeados | §9 |
| Q3 blocklist de Gmail | **não** | §6.1, D4 |
| Q4 revisão jurídica | **ok** | §7 |
| Q5 onde mora | **`defenz.com.br/marketplace/`**, Calculadora depois da Hero, Cotação na sequência | §2.3, §5.1, D10 |

---

## 16. O que a v2 corrigiu da v1

A v1 foi escrita sem olhar o `defenz.com.br`. Quatro erros estruturais, todos na mesma
direção — **eu supus que a calculadora nasceria neste projeto Next.js, e ela não nasce:**

| v1 dizia | Realidade | Efeito |
|---|---|---|
| rotas `POST /api/public/calculadora` no repo To-Do | o site é Apache + SPA React estática; o backend é **n8n** | §5 e §11 da v1 reescritos |
| **quebra a I8** ("superfície pública é uma só") e propunha a emenda I8′ | nada público é adicionado a este repo | **a I8 sobrevive intacta**; a emenda foi retirada |
| R1 = custo de Chromium em endpoint público, com cap contado no banco | o PDF sai por **PDFShift**, e o n8n já responde antes de renderizar | risco eliminado, não mitigado |
| D6: Zoho fora de escopo "porque o fluxo n8n não existe" | existe, ativo, com upsert + Sheets + Outlook | **D6′** inverte; e a v1 teria construído um segundo caminho de lead ao lado de um que já funciona |

⚠️ **A lição é a de sempre neste projeto, e eu tinha acabado de aplicá-la no comparativo:**
escrevi quatro seções apoiado no que era razoável supor, em vez de ir ler. Bastaram seis
comandos para derrubar. **Ler o alvo antes de desenhar** é a regra que a Proposta já tinha
pago uma vez, quando a medição derrubou a suposição de que o A4 era o PPTX exportado.
