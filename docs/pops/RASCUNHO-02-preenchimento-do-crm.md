# RASCUNHO · Preenchimento do Zoho CRM

> ⚠️ **Rascunho extraído das atas (25/03 a 03/06).** Marcos valida antes de virar POP no Portal.
> **Convergência:** os 4 lotes encontraram estas regras.

**Para quem:** todo mundo que mexe no Zoho.
**Por quê:** o CRM alimenta o forecast, o mapeamento com a SecuriSoft e o relatório. Campo vazio aqui vira decisão errada lá na frente.

## Nomenclatura de tarefa

Formato obrigatório:

```
[Ação a ser realizada] - [Nome do Contato] e [Empresa]
```

Exemplo: `Ligar para Fábio - Empresa X`

## Campos obrigatórios

| Campo | Quando passa a ser obrigatório |
|---|---|
| **Nome da empresa** | Sempre — é o campo principal do registro, **não** o nome da pessoa |
| **CNPJ** | Em todo cliente que recebe proposta. Sem CNPJ o contato é **descartado do mapeamento automático** para a SecuriSoft |
| **Telefone** | Assim que a conversa avança para proposta |
| **Montante** | A partir de "Proposta Enviada" — é o que alimenta o forecast |
| **Fonte** | Identifica a origem: Apollo (campo "Fonte do Cliente Potencial") ou SecuriSoft (tag SS) |

## Forecast ponderado

Cada coluna do funil tem um percentual estimado de fechamento (ex.: Proposta Enviada = 50%). O valor exibido no topo é o **valor real multiplicado pelo percentual** da coluna. Por isso o campo Montante não pode ficar vazio: sem ele a oportunidade não entra na conta.

## Regras de coluna

- **Contato Futuro** só é usado quando já houve **proposta formal enviada** *e* o cliente sinalizou uma janela específica (data de renovação, mudança de orçamento). Não é depósito de lead frio.
- **Fechado Perdido** exige justificativa no campo **Resultados**, com data e motivo.

## Prospect que responde no LinkedIn

Cadastro no CRM é **obrigatório**. Se a conversa avançar para proposta, pedir o telefone é obrigatório.

---

## ⚠️ A confirmar com o Marcos

1. **Prazo** para preencher CNPJ e telefone — no mesmo dia? antes de mover de coluna?
2. **Percentuais atuais por coluna** — a ata só cita "Proposta Enviada = 50%" como exemplo. Qual a tabela completa?
3. Quem **audita** os campos vazios e com que frequência?
4. As colunas "Aguardando Contato" e "Clientes Potenciais antigos" foram declaradas obsoletas em 22/04 — já foram removidas?

## Evidência nas atas

- "Mantido o padrão obrigatório no CRM: [Ação a ser realizada] - [Nome do Contato] e [Empresa]" — 31/03, 01/04
- "Clientes Potenciais: nome da empresa deve ser o campo principal (não o nome da pessoa). CNPJ obrigatório" — 14/04
- "É obrigatório pesquisar e preencher o CNPJ no CRM de todos os clientes que receberem proposta" — 30/03
- "Sem CNPJ, o contato é descartado do mapeamento" — 20/04
- "Cada coluna do Kanban tem um percentual estimado de fechamento (ex: Proposta Enviada = 50%). O valor exibido no topo é o valor real multiplicado pelo percentual" — 14/04
- "Uma oportunidade só é classificada como Contato Futuro quando já houve proposta formal enviada e o cliente sinalizou janela específica. Todo Fechado Perdido recebe justificativa no campo 'Resultados' do Zoho com data e motivo" — 27/05
