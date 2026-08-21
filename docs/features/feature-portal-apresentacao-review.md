# Crítica adversarial — `feature-portal-apresentacao.md`

**Data:** 2026-08-20 · **Alvo:** spec v1 · **Método:** ler a spec como se fosse de outro
autor e procurar o que quebra em produção, o que se contradiz, e o que está decidido no
texto mas não está decidido de fato.

**Resultado:** 4 críticos, 5 médios, 3 menores. **Todos os críticos têm correção
aplicada** na v1.1 (emenda no fim da spec). Dois itens **não** são para eu resolver: são
decisão do Marcos e estão marcados assim.

> **Estado em 20/08, depois da v2.** O Marcos mudou o eixo do produto (deck de despertar,
> não deck técnico) — mas isso **não invalidou nenhum achado**: C1–C4 e M1–M5 são sobre o
> encanamento, não sobre o conteúdo, e estão todos aplicados na v2. **M3 foi resolvido pelo
> Marcos:** o slide competitivo fica só com eficácia de detecção e impacto em performance,
> cada linha com fonte e ano — a saída (a), recomendada aqui. **M5 segue aberto** (papel
> mínimo para gerar). A v2 trouxe uma guarda nova que esta crítica não cobriu, porque o
> requisito não existia quando ela foi escrita: o **anonimato da vítima** (spec §6.4), que
> merece uma segunda passada adversarial quando estiver implementado.

---

## 🔴 C1 — Grounding e saída estruturada provavelmente não coexistem na mesma chamada

**Onde:** §6.2, §6.3, F3.

A spec pede, numa chamada só: Google Search grounding **e** um JSON validado por Zod com
enum fechado. No Gemini isso é conflito conhecido — ferramenta de busca e
`responseMimeType: application/json` costumam ser mutuamente exclusivos, e o
`groundingSupports` mapeia trechos **do texto bruto da resposta**, que nesse desenho seria
a própria string JSON. Casar "fonte 3" com "dor 2" viraria adivinhação sobre offsets de
caracteres dentro do JSON.

**Consequência se não corrigir:** F3 vira tentativa e erro contra a API — exatamente o que
a regra da casa proíbe. E o pior caso não é erro: é o modelo devolver JSON bonito com
`fonteIdx` inventado, o que passa no Zod e **produz citação falsa num documento de
cliente**.

**Correção aplicada — duas chamadas, papéis separados:**
1. **Chamada A (com busca, saída em prosa):** pesquisa o setor. Devolve texto + o
   `groundingMetadata` real. É aqui que as fontes nascem.
2. **Chamada B (sem ferramenta, saída JSON):** recebe **só o texto da chamada A e a lista
   das 12 funcionalidades**, e estrutura. Não pode inventar fato porque não tem acesso a
   nada além do texto da A.

Fonte que não aparece no `groundingMetadata` da chamada A **não existe** para a chamada B.
Isso fecha a porta da citação inventada por construção, não por confiança no modelo.

---

## 🔴 C2 — A spec se contradiz sobre o vendedor poder digitar número

**Onde:** §6.4 contra §10.

§6.4 abre a saída explícita: *"se o vendedor quiser citar um dado, ele digita"*.
§10 manda o POST de geração **reaplicar a proibição de números** sobre o que vem do
navegador.

As duas coisas não podem ser verdade. Do jeito escrito, **o vendedor digita a estatística,
clica em gerar, e o servidor recusa sem que ninguém entenda por quê** — que é I4 sendo
violada pela própria spec que a herda.

**Correção aplicada:** a guarda de números vale **na saída do modelo, no passo de
pesquisa**, e só ali. Todo campo carrega `origem: 'ia' | 'humano'`; editar um bloco na tela
de revisão vira `humano` e o isenta. O servidor revalida enum, tamanho e presença de fonte
em tudo; a guarda de dígito, só no que continua marcado como `ia`.

---

## 🔴 C3 — Re-download promete "igual" e vai entregar diferente

**Onde:** §10 ("regenerado do snapshot"), §14, §9.

`pesquisaSnapshot` guarda o que a IA produziu. Mas metade do documento vem de
`institucional-fatos.ts` e `comparativo.ts`, que são **código versionado**. No dia em que
o Gartner 2026 substituir o 2025 no arquivo de fatos, todo re-download de apresentação
antiga passa a sair com o conteúdo novo, **sob o mesmo registro**.

É literalmente a razão de o `precoSnapshot` existir na Proposta — e a spec cita o
`precoSnapshot` como modelo enquanto comete o erro que ele evita. Guardar só
`fatosVigencia` documenta a divergência; não a impede.

**Correção aplicada:** o snapshot guarda **todo o payload de render**, fixo incluído (é
JSON pequeno: texto e rótulos). Re-download imprime o payload gravado. O template pode
evoluir; o conteúdo afirmado ao cliente, não.

---

## 🔴 C4 — A confirmação do setor chega tarde demais para servir de mitigação

**Onde:** §4, §6.1, R2, A5.

R2 diz que o homônimo é barrado porque *"a tela de revisão mostra o `setorResumo`
primeiro"*. Mas nesse ponto **a pesquisa já rodou inteira sobre a empresa errada**: já se
gastou a chamada cara, e o vendedor recebe cinco dores coerentes sobre um setor que não é
o do cliente dele. Texto coerente é justamente o que não dispara desconfiança.

Some-se a isso o problema do A5: **CNAE não é nicho.** É atividade fiscal declarada, muitas
vezes genérica ("comércio varejista de mercadorias em geral") ou desatualizada por anos. A
spec o trata como âncora oficial e superior ao texto do vendedor, e em boa parte dos casos
ele é pior.

**Correção aplicada — passo zero, barato, antes da busca:** resolve o CNAE, mostra
*"Setor identificado: **X**. É isso?"* com o campo **editável**, e a busca só roda depois
do aceite. CNAE vira **sugestão**, não verdade; o texto do vendedor vence quando ele
corrige. Custo de um erro de identificação cai de uma chamada de LLM para um clique.

---

## 🟠 M1 — A guarda de dígitos, do jeito descrito, vai brigar com texto legítimo

**Onde:** §6.4.

"Dígito em posição de estatística" é vago, e a implementação óbvia (regex de número)
rejeita `LGPD`, `ISO 27001`, `Windows 11`, `24/7`, `Lei 13.709`, `PCI-DSS 4.0` — tudo que
uma dor de setor regulado naturalmente cita. Pior: a spec manda **repetir a chamada** uma
vez, o que dobra custo justamente nos setores mais relevantes.

**Correção aplicada:** a guarda é estreita e nomeada, não genérica. Bloqueia: `%`, moeda
(`R$`, `US$`, `USD`), e as formas "N em cada M" / "N vezes mais" / "N x mais". **Permite**
norma, lei, versão e horário. Sem retry: item que viola é **descartado** e contado para o
vendedor (I4). Retry cara para conserto cosmético não se paga.

---

## 🟠 M2 — `fonteIdx` fora de faixa não tem comportamento definido

**Onde:** §6.2.

O Zod valida que é `number().int()`; não valida que aponta para dentro de `fontes`. Modelo
que devolve `fonteIdx: [7]` com quatro fontes passa no schema e explode na renderização,
ou pior, imprime rodapé vazio.

**Correção aplicada:** validação de faixa depois do parse. Índice fora → **a dor inteira é
descartada** (não a fonte), porque dor sem fonte não entra (§6.3). Descarte entra na
contagem mostrada ao vendedor.

---

## 🟠 M3 — O critério de aceite do slide competitivo provavelmente apaga o slide

**Onde:** §13 R3, §14 último item. **⚠️ Decisão do Marcos, não minha.**

"Toda linha com fonte e ano, ou a linha não existe" é a regra certa. Só que, aplicada ao
conteúdo real, ela apaga quase tudo: *"consumo excessivo de disco (VSS)"* sobre o
SentinelOne, *"complexidade de políticas"* sobre o Kaspersky e *"depende de 3ºs para
funções chave"* são **julgamentos comerciais**, não resultados de teste. Não há AV-TEST que
sustente essas frases como estão.

O que **é** sustentável com fonte pública e datada: eficácia de detecção (AV-TEST,
MITRE ATT&CK Evaluations) e impacto em performance (AV-Comparatives Performance Test).

**Não corrijo isto sozinho** — apagar dois terços de um slide que a Defenz já usa é decisão
comercial. **O que muda é a escala:** hoje esse slide sai quando alguém monta um deck à
mão; depois desta feature ele sai automaticamente em todo deck gerado. Afirmação sobre
concorrente nomeado, em volume, é exposição de outra ordem.

**Três saídas, para o Marcos escolher:** (a) manter dois critérios com fonte pública e
cortar os três editoriais; (b) manter tudo e assumir; (c) trocar por um slide sem nome de
concorrente ("o que avaliar num EDR"), que vende igual e não cita ninguém. **Minha
recomendação é (a)**; (c) é a mais segura.

## 🟠 M4 — Os critérios de aceite chamam o Gemini dentro do `npm test`

**Onde:** §14 ("padaria de bairro", "hospital").

São os melhores testes da spec e não podem rodar em CI: dependem de rede, de chave, de
custo, e de um modelo não determinístico. Do jeito escrito, ou a suíte fica intermitente
ou alguém os apaga no primeiro vermelho.

**Correção aplicada:** dois níveis. **Unitário** com respostas gravadas em
`src/test/fixtures/` (guarda de dígitos, enum, `fonteIdx` fora de faixa, dores vazias, a
régua de plano) roda sempre e é determinístico. **Smoke ao vivo** por script
(`scripts/smoke-apresentacao-pesquisa.ts`), rodado à mão, com padaria e hospital reais, e
o resultado colado na spec — o mesmo protocolo do `smoke-proposta-pdf.ts`.

## 🟠 M5 — Não está dito quem pode gerar

**Onde:** §10.

A spec fecha para "só sessão" e nunca diz qual papel. O documento leva o logo da Defenz e
afirma coisas ao mercado; `user`, `gerencia` e `admin` não deveriam ter a mesma mão.

**Correção aplicada:** gerar exige `gerencia` ou `admin`; `user` vê o log da própria
empresa e faz download. Alinha com quem hoje conduz oportunidade. Se o Marcos quiser
vendedor `user` gerando, é uma linha — mas tem de ser escolha, não omissão.

---

## 🟡 m1 — A quantidade de endpoints é declarada fora de escopo e usada mesmo assim

§5 pede 5–999 e §12 diz que preço está fora. Coerente, mas a faixa 5–999 é da **tabela de
preços**, e aqui não há preço. Uma empresa de 1.500 endpoints é uma oportunidade ótima que
o formulário recusaria por um motivo que não se aplica. **Correção:** limite vira 1–100.000
e o campo é opcional; o que ele alimenta é o texto de escala e o plano sugerido.

## 🟡 m2 — Enviar nome e CNPJ do prospect para a busca do Google é decisão, não detalhe

O deck se chama "Apresentação Confidencial" e a feature começa mandando a identidade do
prospect para um buscador de terceiro. É razão social de pessoa jurídica, o risco é baixo,
e não há dado pessoal. **Correção:** fica **escrito** na spec (§12.1) que a consulta manda
razão social, site e setor, e **nunca** o contexto interno da oportunidade — que é onde o
vendedor escreve o que ouviu numa reunião. Esse campo entra só na chamada B, que não tem
acesso à internet.

## 🟡 m3 — Colisão de nome de arquivo no mesmo dia depende de consulta

O sufixo `_2` do §8 exige contar as apresentações da empresa naquele dia; dois cliques
simultâneos geram dois `_2`. Não é grave (nome de arquivo, não identidade), mas vale
resolver de graça: sufixo é o **horário** (`_1432`), não o contador.

---

## O que a crítica NÃO achou

Vale registrar, porque crítica que só acha defeito não é medida:

- **A separação fixo × gerado (§7.1) está certa** e é o que torna a feature auditável.
  Três lugares tocados por IA, todos identificáveis.
- **F2 antes de F3** é a melhor decisão da spec: existe produto entregável antes de a IA
  entrar em cena.
- **A6 (sem numeração)** aplica corretamente uma cicatriz recente em vez de repeti-la.
- **O enum fechado de funcionalidades** é o mecanismo certo: transforma "a IA escreve sobre
  a solução" em "a IA escolhe entre 12 opções", que é uma classe de erro muito menor.
