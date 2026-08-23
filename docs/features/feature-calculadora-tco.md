# Feature: Custo Real do Endpoint — o ebook e a calculadora

**Status:** DRAFT · aguarda aprovação do Marcos
**Slug:** `feature-calculadora-tco`
**Autor:** sessão de 23/08/2026
**Depende de:** `feature-portal-proposta` (caminho de render), `feature-portal-apresentacao` (catálogos de fatos), `service-desk-GUIA.md` §6 e §9 (superfície pública)

---

## 1. Objetivo

Duas peças que só funcionam juntas:

1. **Um ebook** para download, dirigido a **empresas de TI** — que são simultaneamente
   clientes potenciais e potenciais indicadores.
2. **Uma calculadora pública** no site, que faz a conta do ebook com os números do próprio
   leitor e entrega o resultado **mediante e-mail corporativo e nome da empresa**.

O ebook estabelece o método. A calculadora captura. A conversão não está no PDF — está no
momento em que o cara vê o custo **dele**.

### 1.1 Por que esta audiência, e por que este tema

Empresa de TI não compra segurança: compra **margem**. Ebook sobre ameaça não move ninguém
— todos já viram. Ebook que diz *"a conta com que você precifica seu contrato está
incompleta, e aqui está o método que um laboratório independente usa"* fala a língua do
dono.

⚠️ **O mecanismo de indicação é o que decide o tema.** O melhor material para quem pode
**indicar** não é o que explica o produto da Defenz — é o que **arma o cara para a conversa
dele com o cliente dele**. Ele baixa, usa o argumento, o cliente aceita, e agora ele precisa
de quem entregue a solução por trás do argumento. Um ebook sobre "por que a Defenz é boa"
não tem esse efeito; fica na gaveta.

### 1.2 A quinta variável é o pitch, e ela nasce da conta

O método tem cinco variáveis (§4). As quatro primeiras são do laboratório. **A quinta —
custo de operar o console — não está no relatório porque o laboratório testa o produto, não
o serviço.** Uma empresa de TI não pode excluí-la: é o que ela vende.

E é exatamente a linha que **some quando ela terceiriza para um MSSP**. O material revela a
linha; a Defenz zera a linha. O argumento comercial sai da própria conta, sem a Defenz
precisar afirmar nada sobre si mesma.

---

## 2. O que foi medido antes de desenhar

### 2.1 O método existe, é público, e não é nosso

Lido em 22/08 direto do PDF primário (`avc_epr_2025.pdf`, AV-Comparatives EPR Comparative
Report 2025, 37 páginas). ⚠️ **As tabelas são imagem** — `pdftotext` devolve 288 linhas
inúteis; é preciso rasterizar as páginas e ler.

| Variável | Onde | O que o laboratório faz |
|---|---|---|
| Licença | p. 23 | preço de lista, 5 anos, 5.000 estações |
| Acurácia operacional | p. 24 | faixas por nº de cenários afetados; fator ×0 a ×20 |
| Atraso de workflow | p. 25 | faixas por minutos de espera; fator ×0 a ×10 |
| Custo de brecha | p. 9 | % do custo total conforme a **fase** em que parou |
| **Operação/console** | *não existe* | o laboratório testa produto, não serviço |

**A tabela de custo de brecha (p. 9) é o achado que sustenta o ebook inteiro:**

| Onde parou o ataque | % do custo de brecha que entra |
|---|---|
| Resposta ativa na fase 1 | **0%** |
| Só detecção na fase 1 | 12,5% |
| Resposta ativa na fase 2 | 25% |
| Só detecção na fase 2 | 50% |
| Resposta ativa na fase 3 | 75% |
| Só detecção na fase 3 | 95% |
| Nenhuma resposta | 100% |

É isso — e não a diferença de licença — que explica o intervalo de custo entre fornecedores.

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
entrada.** Não é retórica: é a tabela.

⚠️ **Armadilha já registrada** (`feature-portal-apresentacao.md` §7.3.2-bis): a p. 23 mostra
a G Data mais barata que a Bitdefender. Aquilo é **preço de lista**. Quem citar a p. 23
achando que é TCO afirma o contrário do que quer.

### 2.3 A superfície pública já existe, e a invariante diz que é uma só

I8 (`SPEC-MAE.md` §5): *"Superfície pública é uma só (`/abrir-ticket`) e é burra."*
**Esta feature quebra I8** e a emenda está no §9 — declarada, não contrabandeada.

O `/abrir-ticket` dá o molde inteiro (`src/app/api/public/tickets/route.ts`): rate-limit
antes de parsear o body, honeypot `_hp`, tempo-mínimo `_t` de 2000ms, Zod `.strict()`,
resposta genérica uniforme.

### 2.4 ⚠️ O que o `/abrir-ticket` NÃO enfrenta, e a calculadora enfrenta

**Abrir ticket custa um INSERT. Gerar a calculadora custa um Chromium.**

O `renderPdf` sobe um navegador headless (`src/lib/proposta/pdf.ts`). Num endpoint público
e anônimo isso é um **vetor de custo**: cada requisição queima segundos de CPU de Lambda.
E a defesa que existe hoje não segura:

> O `checkRateLimit` (`src/lib/rate-limit.ts`) é um `Map` **em memória do processo**. Em
> Lambda cada instância tem o seu, e instâncias novas nascem zeradas. Já está registrado
> como R5 do Portal, aberto. Ele mitiga duplo-clique; **não segura conta no fim do mês.**

Consequência de desenho (§5.4): **o render é a última coisa, atrás do gate, e o cap é
contado no banco.**

### 2.5 Não existe tratamento de LGPD no código hoje

Varredura por `lgpd|consent|consentimento` em `src/` e no schema: a única ocorrência é um
texto de fato de mercado. **Esta é a primeira feature do projeto que coleta dado pessoal de
quem não é usuário nem cliente contratado.** O §7 trata disso como requisito, não como
enfeite.

---

## 3. Decisões

| # | Decisão | Porquê |
|---|---|---|
| D1 | **Ebook e calculadora compartilham UM módulo de constantes** (`src/lib/tco/constantes.ts`) | Se cada um tiver a sua cópia, eles vão **discordar em público**. O ebook é PDF baixado que não volta atrás; a calculadora muda no deploy seguinte. Divergência entre os dois é o pior defeito possível desta feature |
| D2 | **O ebook é renderizado por código** (HTML → Chromium → PDF), como proposta e apresentação | Mesmo caminho já provado, números vindos do catálogo, versionado. Não é InDesign |
| D3 | **A calculadora NÃO estima custo de brecha em reais no MVP** | Ver §4.4. É o maior risco de correção da feature |
| D4 | **Gate = e-mail corporativo + nome da empresa**, com blocklist de provedor gratuito + checagem de MX | Pedido do Marcos. A checagem de MX é o que separa qualificação de teatro (§6.2) |
| D5 | **Consentimento LGPD explícito, nunca pré-marcado** | §7 |
| D6 | **Lead fica no banco da Defenz; sync com Zoho fora de escopo** | O fluxo n8n que a Proposta espera desde 09/08 **ainda não existe**. Não amarrar feature nova a dependência que não existe |
| D7 | **Duas telas novas no `/dashboard`: os leads e o log de cálculos** | I11 — a aba só entra com tela viva |

---

## 4. O método — as cinco variáveis

### 4.1 As três que a empresa de TI mede sozinha

Estas entram na conta com os números do usuário. São verificáveis por ele, e é isso que
torna o resultado crível.

| # | Variável | Entrada do usuário | Fórmula |
|---|---|---|---|
| V1 | **Licença** | preço/estação/mês, nº de estações | `preço × estações × 60` (5 anos) |
| V2 | **Acurácia operacional** | chamados de falso positivo/desbloqueio por mês, custo-hora do técnico, minutos por chamado | `chamados × (min/60) × custo-hora × 60` |
| V3 | **Atraso de workflow** | minutos de espera por ocorrência, ocorrências/mês, custo-hora do usuário parado | `ocorrências × (min/60) × custo-hora × 60` |

### 4.2 A quarta: operação e console

| V4 | **Operação** | horas/mês de gestão (deploy, política, relatório, atualização), custo-hora | `horas × custo-hora × 60` |

⚠️ **É a linha do pitch.** No resultado ela aparece destacada, com a legenda:
*"esta é a linha que muda de dono quando a operação é terceirizada."* Sem adjetivo, sem
promessa — o número fala.

### 4.3 O resultado

```
Custo total 5 anos  =  V1 + V2 + V3 + V4
Custo por estação   =  total ÷ estações
% que é licença     =  V1 ÷ total
```

**O `% que é licença` é a saída que dói.** No teste do laboratório essa fração varia de
~48% (Bitdefender) a ~3% (fornecedor B). É a prova de que o preço de lista não prevê nada.

### 4.4 ⚠️ D3 — por que o custo de brecha NÃO entra na conta em reais

A tentação é multiplicar probabilidade por R$ 7,19 milhões (IBM, recorte Brasil, já em
`mercado-fatos.ts`) e somar. **Não vamos fazer isso, e a razão é dura:**

1. **A escala não transfere.** O Cost Unit do laboratório é US$ 1,76 milhão para **5.000
   estações**. O R$ 7,19 mi da IBM é média de violações **corporativas** — coorte
   enterprise-enviesada. Aplicar qualquer um dos dois a um contrato de 40 estações produz um
   número absurdo.
2. **A probabilidade seria chute.** Não temos incidência por porte no Brasil com fonte
   citável. Um "12% ao ano" inventado seria exatamente o ÷48 outra vez — número plausível,
   calculado, e errado.
3. **Um número assustador e indefensável é pior que nenhum.** O público é técnico e cético.
   Uma empresa de TI que refaz a conta e não fecha **perde a confiança no material inteiro**,
   inclusive nas três variáveis que estavam certas.

**O que entra no lugar:** um bloco separado e rotulado — *"exposição, para você estimar"* —
onde o **usuário informa** o custo que uma parada de um dia teria na operação dele, e a
calculadora mostra a tabela de fases da p. 9 aplicada àquele valor. O número é dele; a
tabela é do laboratório; a Defenz não estimou nada.

> Isso estende I9 na direção certa: nenhum número que vai ao leitor sai de estimativa nossa.

---

## 5. Fluxo

### 5.1 Do ebook à calculadora

```
site/LinkedIn → landing do ebook → download (sem gate)
                                        ↓
                        última página do PDF: "faça a conta com os seus números"
                                        ↓
                              /calculadora  (público)
                                        ↓
                        preenche as 4 variáveis → vê o TOTAL na tela
                                        ↓
                        quer o detalhamento e o PDF? → e-mail corporativo + empresa
                                        ↓
                              PDF com a conta dele, marca Defenz
                                        ↓
                        lead no /dashboard/portal/leads · Gustavo liga sabendo tudo
```

### 5.2 ⚠️ O ebook NÃO tem gate. A calculadora tem.

Parece contraintuitivo, e é deliberado: **o ebook é a peça de alcance**, tem de circular sem
atrito — inclusive ser reencaminhado dentro do cliente. **A calculadora é a peça de
conversão.** Pôr gate nos dois mata o alcance e não aumenta a captura, porque quem não
entrega e-mail por um PDF também não entrega por dois.

### 5.3 O que o gate libera — decisão pendente do Marcos

O Marcos pediu: *"só entrega o resultado com email corporativo e nome da empresa."* Escrevi
a spec com isso como **default**, mas registro a alternativa porque muda conversão:

| | Opção A — **como pedido** | Opção B — parcial aberto |
|---|---|---|
| Antes do e-mail | nada; só o formulário | **o número total**, grande |
| Depois do e-mail | total + detalhamento + PDF | detalhamento por variável + PDF |
| A favor | captura tudo que interage | o total visível prova que a ferramenta é real e cria o desconforto que motiva a entrega do e-mail |
| Contra | quem não confia sai antes de ver qualquer valor | perde o lead que se satisfaz com o total |

**Minha recomendação é a B**, por um motivo concreto: nesse público, um formulário que pede
e-mail **antes** de mostrar qualquer coisa lê como captura de lead disfarçada de ferramenta,
e o cara fecha a aba. O total sem o detalhamento não é acionável — ele ainda precisa saber
**onde** vaza, e é isso que ele troca pelo e-mail.

Fica como **§13-Q1**. Implemento a A se você mantiver.

### 5.4 Ordem de operações no servidor (a que protege o custo)

```
1. rate-limit por IP          (mitiga duplo-clique; NÃO segura custo — §2.4)
2. honeypot + tempo-mínimo
3. Zod .strict()
4. e-mail: formato → blocklist → MX
5. CAP CONTADO NO BANCO       ← a defesa de custo de verdade
6. grava o lead + o cálculo
7. calcula (JS puro, determinístico)
8. renderPdf                  ← Chromium por último, e só aqui
```

⚠️ **O passo 5 é o que impede a conta de estourar.** `COUNT` de cálculos na janela (por IP
e global) contra um teto em env — porque banco é estado compartilhado e memória de Lambda
não é. Default sugerido: 5/IP/hora, 300/dia global.

⚠️ **O passo 8 vem depois do 6 de propósito.** Lição da Proposta: lá a sequência é reservada
**antes** do render e uma falha de Chromium queimou o número da DFZ-2026-01991. Aqui não há
sequência a queimar, mas há lead a perder: **se o Chromium falhar, o lead já está gravado** e
a tela oferece reenviar. O lead é o produto; o PDF é o brinde.

---

## 6. O gate

### 6.1 Campos

| Campo | Regra |
|---|---|
| `nomeEmpresa` | obrigatório, 2–120 chars, sem HTML |
| `email` | obrigatório, formato + blocklist + MX |
| `nome` | obrigatório, 2–80 chars |
| `consentimento` | boolean, **tem de ser `true`**, nunca pré-marcado |
| `_hp` / `_t` | honeypot e tempo-mínimo, como no `/abrir-ticket` |

### 6.2 ⚠️ "E-mail corporativo" — o que a checagem faz e o que não faz

Duas camadas, e é importante não confundir o que cada uma entrega:

1. **Blocklist de provedor gratuito** (~40 domínios: gmail, hotmail, outlook, yahoo, bol,
   uol, terra, icloud, proton, …). Barra o caminho preguiçoso.
2. **Checagem de MX no domínio** (DNS, `dns.promises.resolveMx`). Barra domínio inventado e
   erro de digitação — `@empresa.com.br` que não existe.

**O que isso NÃO é:** validação. Ninguém confirmou que o e-mail existe nem que a pessoa
trabalha lá. Quem quiser burlar registra um domínio de R$ 40 ou usa o e-mail de um colega.

**É um filtro de fricção, e é assim que deve ser tratado no funil:** ele qualifica intenção,
não identidade. O Gustavo continua precisando ligar. Verificação real seria double opt-in —
que corta a conversão pela metade e **não** recomendo no MVP.

⚠️ **Custo do falso positivo:** consultoria de TI de uma pessoa só usa Gmail com frequência
real. A blocklist **vai** barrar lead legítimo. Por isso a mensagem de recusa não é um erro
seco: *"Use o e-mail do seu domínio corporativo. Se a sua empresa não tem domínio próprio,
fale com a gente em [contato]"* — o caminho não pode terminar em parede.

---

## 7. LGPD — o que esta feature introduz no projeto

Primeira coleta de dado pessoal de não-usuário (§2.5). Mínimo para não nascer irregular:

1. **Base legal:** consentimento (art. 7º, I), coletado em checkbox **não pré-marcado**.
2. **Finalidade declarada na própria tela**, em texto curto e literal: *"Usamos seu nome,
   e-mail e empresa para enviar o resultado do cálculo e entrar em contato sobre soluções de
   segurança. Não compartilhamos com terceiros."* — e a segunda frase só entra se for
   verdade, o que hoje é (D6: nada de Zoho no MVP).
3. **Retenção:** campo `expiraEm` no lead, default 24 meses, e um caminho de exclusão a
   pedido. No MVP a exclusão é manual pela tela do dashboard; automação fica para depois.
4. **Registro do consentimento:** `consentimentoEm` (timestamp) e `consentimentoTexto`
   (a versão do texto aceita). Sem isso não há como provar **o que** a pessoa aceitou quando
   o texto mudar.

⚠️ **Não sou advogado e isto não é parecer.** É o piso técnico para a feature não nascer
obviamente irregular. Se a Defenz tem assessoria jurídica, o texto do item 2 e o prazo do
item 3 deveriam passar por ela antes do deploy — são duas linhas, e é barato fazer antes.

---

## 8. Dados

```prisma
model CalculadoraLead {
  id String @id @default(cuid())

  nome        String
  email       String
  emailDominio String   /// separado para agrupar leads da mesma empresa
  nomeEmpresa String

  /// LGPD — o que foi aceito e quando (§7.4)
  consentimentoEm    DateTime
  consentimentoTexto String
  expiraEm           DateTime

  /// origem: 'ebook' | 'direto' | utm
  origem String @default("direto")

  calculos CalculadoraExecucao[]
  createdAt DateTime @default(now())

  @@index([emailDominio])
  @@index([createdAt])
  @@map("calculadora_leads")
}

model CalculadoraExecucao {
  id String @id @default(cuid())

  /// Nulo enquanto o gate não foi passado (Opção B do §5.3).
  leadId String?
  lead   CalculadoraLead? @relation(fields: [leadId], references: [id], onDelete: SetNull)

  /// As entradas exatas, congeladas. Mesma razão do precoSnapshot e do fatosSnapshot:
  /// "que conta a gente mostrou pra esse cara" não pode virar memória.
  entradas Json
  /// O resultado calculado, congelado junto.
  resultado Json
  /// Versão do módulo de constantes que produziu o número (D1).
  constantesVersao String

  /// Hash do IP — anti-abuso sem guardar IP em claro (§7).
  ipHash String

  arquivoNome String?
  createdAt   DateTime @default(now())

  @@index([createdAt])
  @@index([ipHash, createdAt])   /// o cap do §5.4 lê por aqui
  @@map("calculadora_execucoes")
}
```

⚠️ **`entradas` e `resultado` congelados, e `constantesVersao` junto.** É a lição do
re-download da Proposta, aplicada de saída: quando a constante mudar, o cálculo antigo
continua reproduzindo o que o cara viu.

---

## 9. ⚠️ Emenda declarada à I8

A I8 diz **"a superfície pública é uma só"**. Depois desta feature são **duas**. A invariante
não morre — ela passa a ser:

> **I8′ — Toda superfície pública é burra e segue o mesmo molde:** 422/resposta uniforme,
> honeypot, tempo-mínimo, Zod `.strict()`, rate-limit antes do body, `companyId` resolvido
> por CONFIG e nunca vindo do corpo, nenhum campo de controle no schema. **E, quando a rota
> custa mais que um INSERT, cap contado no banco.**

A cláusula final é nova e nasce aqui (§2.4). Ela precisa subir para a `SPEC-MAE.md` §5
quando a feature for implementada, junto com o registro de que a superfície deixou de ser
uma só.

---

## 10. O ebook

**Título:** *O custo real do endpoint*
**Subtítulo:** *Onde a margem do seu contrato de TI vaza — e como calcular o custo da sua
solução de segurança em cinco variáveis.*

Os dois ângulos, na ordem que funciona: a dor abre, o método entrega.

| Cap. | Conteúdo | De onde sai |
|---|---|---|
| 1 | **A conta que todo contrato faz errado** — licença ÷ estações. O que fica de fora | argumento |
| 2 | **A tabela que prova** — o caso da licença de US$ 80 que termina em US$ 1.620 | EPR p. 14, 23 |
| 3 | **As cinco variáveis** — uma por página, com como medir na própria operação | EPR p. 9, 23–25 + §4 |
| 4 | **Por que a fase importa** — a tabela de custo de brecha por fase | EPR p. 9 |
| 5 | **Exemplo trabalhado** — contrato fictício de 200 estações, linha a linha | §4 |
| 6 | **Faça com os seus números** — a chamada para a calculadora | — |

⚠️ **A disciplina de 22/08 vale em dobro aqui.** Ebook é público, indexado e não tem como
corrigir depois de baixado. Todo número sai do PDF primário com a página anotada no
`constantes.ts`. O caso do *"único fabricante"* mostrou que material de fabricante chega com
frase que o próprio relatório derruba.

### 10.1 Decisão pendente: nomear os fornecedores

O gráfico do capítulo 2 perde força anonimizado — *"um fornecedor"* não choca, *"a licença
mais barata do teste"* choca. Mas a A15 proíbe nomear concorrente no material institucional.

**Aqui é diferente e eu voto por citar com os nomes:** são resultados de um teste público e
independente, e a Defenz não emite juízo sobre nenhum deles — reporta o que o laboratório
publicou. A diferença é entre *"o X é ruim"* (nossa afirmação) e *"o laboratório mediu X"*
(fato citável). Se preferir seguro, anonimiza e perde uns 20% do impacto.

Fica como **§13-Q2**.

---

## 11. Rotas e telas

| Rota | Acesso | O quê |
|---|---|---|
| `/ebook/custo-real-do-endpoint` | público | landing + download direto, sem gate |
| `/calculadora` | público | a ferramenta |
| `POST /api/public/calculadora` | público | calcula e grava a execução |
| `POST /api/public/calculadora/resultado` | público | passa o gate, vincula o lead, devolve o PDF |
| `/dashboard/portal/leads` | sessão, emissor Defenz | os leads, com busca e período (cap 200, I5) |
| `/dashboard/portal/leads/[id]` | sessão | as execuções daquele lead + exclusão LGPD |

⚠️ **`<ServiceWorkerRegister/>` não pode pegar `/calculadora` nem `/ebook/*`** — I7 e a §9.8
do GUIA. O gate por path já existe para `/abrir-ticket`; **estender, com teste.**

---

## 12. Fases

| Fase | Entrega | Fecha sozinha? |
|---|---|---|
| **F1** | `src/lib/tco/constantes.ts` + `calculo.ts` + testes. JS puro, sem UI, sem rota | sim — é o núcleo do D1 |
| **F2** | O ebook: template + render + a landing de download | sim |
| **F3** | A calculadora: rota pública, gate, cap no banco, PDF | sim |
| **F4** | As telas de lead no dashboard + exclusão LGPD | sim (I11: F3 sem F4 deixa lead cego) |
| **F5** | UTM, origem, e sync com Zoho | **fora do MVP** (D6) |

⚠️ **F1 antes de tudo, e sozinha.** É o módulo que ebook e calculadora compartilham. Se ele
sair depois de qualquer um dos dois, nasce a divergência que o D1 existe para impedir.

---

## 13. O que depende do Marcos

- **Q1 — o gate:** Opção A (como pedido: nada antes do e-mail) ou B (total visível,
  detalhamento atrás do gate)? Recomendo B. §5.3
- **Q2 — nomear os fornecedores no ebook?** Recomendo citar, sem juízo. §10.1
- **Q3 — a blocklist barra Gmail?** Barra lead legítimo de consultoria pequena. Mantenho a
  blocklist com a saída de escape do §6.2, ou afrouxo?
- **Q4 — texto de consentimento e prazo de retenção** passam por assessoria jurídica antes do
  deploy? São duas linhas e é barato fazer antes. §7
- **Q5 — onde a landing mora?** O site institucional da Defenz é este projeto ou é outro?
  A spec assume que é aqui; se for outro, F2 muda de casa e a calculadora vira embed.

---

## 14. Critérios de aceite

**Nível 1 — automatizável (Vitest):**

- [ ] `calculo.ts` é puro e determinístico: mesma entrada → mesma saída, sem `Date.now()`
- [ ] as quatro variáveis somam o total; `% licença` bate com `V1 ÷ total`
- [ ] entrada zero ou negativa é recusada com mensagem, não produz `NaN` nem `Infinity`
- [ ] **o ebook e a calculadora leem a MESMA constante** — teste que importa os dois e
      compara (é o D1 virando código)
- [ ] blocklist barra `@gmail.com`; domínio corporativo passa (MX mockado)
- [ ] consentimento `false` → recusa; ausente → recusa
- [ ] cap: N+1ª execução do mesmo `ipHash` na janela → 429, contado no **banco**
- [ ] honeypot preenchido ou `_t < 2000` → mesma resposta genérica
- [ ] Zod `.strict()`: campo extra no body → recusa
- [ ] o SW não é registrado em `/calculadora` nem em `/ebook/*`
- [ ] re-render de uma execução antiga usa `entradas` + `constantesVersao` congelados
- [ ] o PDF do ebook fecha sem corte — `smoke` medindo página a página, como a apresentação

**Nível 2 — conferência humana antes do deploy:**

- [ ] todo número do ebook conferido no PDF primário, com página anotada no `constantes.ts`
- [ ] o Marcos lê o ebook inteiro sem ninguém explicar (mesmo aceite da apresentação)
- [ ] uma empresa de TI real refaz a conta à mão e chega no mesmo número

---

## 15. Riscos

| # | Risco | Mitigação |
|---|---|---|
| R1 | **Custo de Chromium em endpoint público** | cap no banco (§5.4); render por último; monitorar. É o risco nº 1 |
| R2 | **Ebook e calculadora divergirem em público** | D1 + o teste que compara os dois |
| R3 | **Número indefensável assusta e queima credibilidade** | D3 — brecha não vira reais estimados por nós |
| R4 | **Blocklist barra lead bom** | saída de escape no texto de recusa (§6.2) |
| R5 | **LGPD** — primeira coleta do projeto | §7; revisão jurídica no Q4 |
| R6 | **Lead que não vira nada** — captura sem processo de follow-up | fora de escopo técnico, mas vale dizer: sem o Gustavo ligando em 24h, a feature entrega planilha, não receita |
| R7 | **O rate-limit em memória segue mentindo** (R5 do Portal) | não é resolvido aqui; o cap no banco é o que protege. Registrar que a dívida continua |

---

## 16. Fora de escopo

- Sync com Zoho (D6) · double opt-in de e-mail · captcha · A/B de copy
- Comparação de fornecedor **dentro** da calculadora — ela calcula o custo da solução *do
  usuário*, não ranqueia produto. Ranking é o que o EPR já faz, e citar é suficiente
- Estimativa de custo de brecha em reais (D3)
- Versão em inglês
