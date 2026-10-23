# DLP GTB na Apresentação Defenz — briefing + pesquisa (23/10/2026)

> Insumo da spec `feature-apresentacao-dlp-gtb` (a escrever). Nada aqui é decisão de produto
> ainda; é o que o material diz e o que a fonte primária confirma.

## Decisões do Marcos (23/10)

1. **Escopo:** abrir com a **plataforma inteira** da GTB, mas o **foco é o Endpoint Protector**
   (o único item com preço no catálogo: `DLP_GTB`, US$ 48/lic/12m).
2. **Formato:** as **duas** possibilidades — (a) seção DLP dentro da apresentação Bitdefender;
   (b) apresentação só de DLP (cliente que já tem antivírus).
3. **Canal:** Defenz **tem Acordo de Canais GTB assinado**; **ainda não tem certificação**
   Tier 1 (comercial) / Tier 2 (técnico). → A apresentação **não oferece POC conduzida pela Defenz**.

## Material da pasta "Materiais - DLP GTB" (OneDrive do Gustavo)

- 14 prints da reunião SecuriSoft → revendas (22/10). Têm rosto/inicial de participantes:
  **nenhum print entra como imagem em material de cliente.**
- `DATASHEET GTB ENTERPRISE DATA SECURITY SUITE.pdf` (PT, SecuriSoft): Full Circle Data Security™,
  Endpoint/Network/E-mail/Cloud DLP, Data Discovery, Device Control, EDM, fingerprint, OCR,
  classificação, análise contextual, IA generativa, SaaS/on-prem/híbrido, Entra ID/SIEM.
- `GTB — OVERVIEW EXECUTIVO.pptx`: deck de cliente ("Visibilidade total. Proteção contínua.").
- `GTB BATTLECARD COMPETITIVO.pdf`: GTB vs "abordagens tradicionais" (genérico, sem nomear rival).
- `PLANO DE FUNDO OFICIAL GTB.png`.

**Regras de canal (do deck SecuriSoft — não vão ao cliente, mas afetam o gerador):**
cotação **a partir de 25 licenças**; registro obrigatório da oportunidade; **proposta antes da POC**;
POC ≥ 100 endpoints, máx. 30 dias, conduzida pelo parceiro com apoio SecuriSoft; 500+ licenças =
atendimento prioritário SecuriSoft+GTB.

## Achados que mudam o material

### 🔴 1. O nome
- A GTB chama o produto de **"GTB Endpoint Protect"** no corpo do site (gttb.com/endpoint-enterprise-dlp/).
- **"Endpoint Protector" é produto da CoSoSys, hoje Netwrix** (aquisição 01/02/2024). Cliente que
  googlar "Endpoint Protector" cai na Netwrix.
- Regra: **sempre "GTB Endpoint Protector"** (nome comercial do distribuidor), nunca sozinho.
  Perguntar à SecuriSoft por que "Protector" × "Protect".

### 🔴 2. O que o Endpoint Protector faz × o que exige outro módulo
Não existe matriz pública de módulos. Confirmado em página da GTB para o **agente de endpoint**:
- Canais: USB/Wi-Fi/FireWire/dispositivos E/S, **impressora (inclusive fora da rede)**, **clipboard**,
  apps de nuvem (Dropbox, Box, Google Drive, O365, Teams, Slack), Filezilla/WinSCP/PuTTY, Outlook/Office.
- Ações: bloquear, classificar, registrar, **marca d'água**, criptografar, "shadow" (cópia de evidência), auditar, alertar.
- **Offline** ("Online and Offline modes", fingerprint fora da rede). Agente kernel-less.
- SOs: **Windows, macOS, Linux** (RHEL, Ubuntu, CentOS, SUSE) — sem versões publicadas.

**Não prometer no Endpoint Protector até a GTB/SecuriSoft confirmar por escrito:**
controle de IA generativa (a página não diz qual componente aplica), OCR no endpoint, geração de
fingerprint (provável Security Manager), EDM, justificativa do usuário, print screen, Entra ID, rótulos MIP/Purview.
Discovery de repositórios (Exchange, SharePoint, S3, bancos) e rede/e-mail/SSL = **outros módulos**
(Discovery Server, Inspector) — entram só como "a plataforma também oferece", sem preço.

Bundle `DLP_GTB` do catálogo (descrição SecuriSoft 14/09): Local PC Discovery, MS Outlook Discovery,
USB & Device Controls, Classification & Watermarking, Application Controls, File Share Audit; console on-prem sem custo.

### 🔴 3. As provas do deck não se sustentam como estão
| Alegação do deck | Veredito | Uso permitido |
|---|---|---|
| Enterprise Security Magazine 2026 | Perfil feito de entrevista com EVP da GTB, metodologia não descrita | **Sai** |
| Global 100 "Best DLP 2026" | Sem página primária; só release da GTB | **Sai** |
| SelectHub Analysts' Pick 2025 | #1 nota 88 vs 87 do 2º; página **sem ano** | "1º no ranking de DLP da SelectHub (nota 88)" — sem "2025" |
| Corporate Vision 2024 | **Confirmado** (13º de 13 vencedores); revista com pacotes pagos opcionais | "Reconhecida no Corporate Vision Security Awards 2024" — sem "mais confiável do mundo" |
| Gartner Peer Insights 4,6 / 100 | **Divergente**: arquivo abr/2026 = **4,7 / 97 avaliações** (mercado DLP) | Nota + nº + mês, conferido ao vivo no dia |
| SC Magazine Lab Approved | É de **12/09/2007**, Inspector v.12 | Sai, ou "SC LabApproved (2007)" |
| "+20 anos" | Fundação 2004 autodeclarada | "Fundada em 2004" |
| Fingerprint "patenteado" | Única patente achada (US 8.776.206) **expirou em out/2024** | "Tecnologia proprietária" até a GTB mostrar patente vigente |
| "Praticamente zero falso positivo" | Nenhum teste independente | **Sai** (ou "segundo o fabricante") |
| Magic Quadrant / Wave | MQ de DLP descontinuado (último 2017); GTB foi Niche/Visionary até lá | Não citar |

### 🟠 4. Sobreposição com Bitdefender (o que o cliente vai perguntar)
- GravityZone **já tem Device Control** em todos os planos (BS, Premium, Enterprise) e um
  "Data Protection" (Content Control) que **bloqueia strings definidas pelo admin em HTTP/SMTP**.
  Sem fingerprint, sem classificação, sem discovery, sem OCR, sem controle de nuvem/IA.
  Fonte: bitdefender.com/business/compare; doc Content Control 77209-342965.
- Frase defensável: **"O Bitdefender controla por onde o dado sai; o DLP identifica o que está saindo."**

### 🟠 5. Objeção "já tenho Microsoft 365"
- Endpoint DLP do Purview: incluso em **E5**; E3/Business Premium dependem de add-on.
  Cobre Windows e macOS (com lacunas); **não cobre Linux**; exige onboarding de cada dispositivo;
  dado nunca salvo localmente não é inspecionado. Fonte: learn.microsoft.com/purview/endpoint-dlp-learn-about.

### 🟠 6. Contexto Brasil — números defensáveis
1. LGPD art. 52, II: multa até **2% do faturamento, limitada a R$ 50 milhões por infração**. (Câmara, primária)
2. Res. CD/ANPD nº 15/2024, art. 6º: comunicar incidente à ANPD em **3 dias úteis**. (ANPD, primária)
3. Res. CMN 4.893/2021, art. 3º §2º: **"prevenção de vazamento de informações"** entre os controles mínimos. (primária; conferir versão vigente)
4. IBM Cost of a Data Breach 2025: **1 em 5** organizações teve vazamento ligado a shadow AI; +**US$ 670 mil** de custo. (IBM, primária)
5. IBM Cost of a Data Breach 2026: média global **US$ 4,99 milhões**, recorde. (IBM, primária)

⚠️ Só secundária (não usar sem conferir): Brasil R$ 7,44 mi (IBM 2026, amostra 42 empresas);
shadow AI 43% (IBM 2026); Verizon 62% elemento humano; LayerX 77% colam dados em GenAI.
⚠️ **Não vender medo de multa:** a ANPD aplicou **uma** multa em dinheiro até hoje (R$ 14.400, microempresa, 2023);
o resto foi advertência a órgão público. O argumento sólido é comunicação obrigatória + custo + exigência setorial.

## Perguntas para a SecuriSoft / GTB (antes de fechar a spec)
1. O bundle de US$ 48 inclui Security Manager (fingerprint)? OCR roda no agente?
2. O controle de IA generativa roda no Endpoint Protector ou exige outro módulo?
3. Justificativa do usuário, print screen e upload web estão no endpoint?
4. Matriz oficial de SOs/versões.
5. Console multi-tenant para MSSP: existe? Requisitos de servidor do console on-prem?
6. Links primários da Global 100 e dos relatórios de analista; patente vigente do fingerprint.
7. "Protector" × "Protect": qual é o nome oficial a usar?

## Fontes principais
gttb.com/endpoint-enterprise-dlp/ · gttb.com/dlp-chatgpt-generative-ai/ · gttb.com/dlp-as-a-service/ ·
gttb.com/enterprise-data-protection-central-command/ · endpointprotector.com (Netwrix/CoSoSys) ·
corporatevision-news.com/issues/security-awards-2024/ · selecthub.com/c/data-loss-prevention-software/ ·
gartner.com/reviews/product/gtb-technologies-dlp · scworld.com/product-test/gtb-inspector-v-12 ·
patents.google.com/patent/US8776206 · bitdefender.com/business/compare ·
learn.microsoft.com/en-us/purview/endpoint-dlp-learn-about · LGPD (camara.leg.br) ·
gov.br/anpd/pt-br/assuntos/incidente-de-seguranca · ibm.com/reports/data-breach ·
newsroom.ibm.com (2025-07-30) · Res. CMN 4.893/2021.
