# BUSINESS DICTIONARY — Razarth Intelligence Platform

> Toda conversa entre negócio e tecnologia começa aqui.
> Este documento é a fonte única de verdade sobre o que cada conceito significa no Razarth.

---

## Hierarquia de conceitos

```
Empresa (Rede)
  └── Loja
        └── Setor
              └── Produto
                    └── Movimentação
                          └── Item de Nota
                                └── Evento Operacional
```

```
Tempo
  └── Ano
        └── Competência (Mês)
              └── Período de Análise
                    └── Fechamento
                          └── Entrada de Fechamento
```

```
Análise
  └── Indicador (KPI)
        └── Comparação
              └── Anomalia
                    └── Score
                          └── Investigação
                                └── Hipótese
                                      └── Plano de Ação
```

---

## Dicionário completo

---

### Empresa / Rede
**Definição:** Conjunto de lojas pertencentes ao mesmo grupo empresarial.

Exemplo: Rede Sol (SOL 1, SOL 2, SOL 3, SOL 4, SOL 6 CD, SOL 7).

**No banco:** identificada pelo prefixo do nome das lojas.

---

### Loja
**Definição:** Unidade física de operação com CNPJ próprio e gestão independente.

Exemplos: SOL 1, SOL 2, SOL 3, SOL 4, SOL 6 CD, SOL 7.

**No banco:** campo `store` nas tabelas `loss_notes`, `loss_items`, `monthly_closing_entries`.

**Normalização:** "SUPERMERCADO SOL 3" → "SOL 3" (via StoreNormalizer).

---

### Setor
**Definição:** Divisão operacional interna de uma loja responsável por um grupo de produtos ou atividades.

| Setor | Descrição |
|---|---|
| Açougue | Carnes frescas, embaladas e processadas |
| FLV | Frutas, Legumes e Verduras |
| Padaria | Pães, bolos e confeitaria |
| Produção Padaria | Insumos e produção interna da padaria |
| Frios e Congelados | Laticínios, embutidos, congelados |
| Mercearia | Produtos de prateleira, enlatados, grãos |
| Bebidas | Bebidas alcoólicas e não alcoólicas |
| Hortifruti | Produtos frescos (pode sobrepor FLV) |
| Frente de Caixa | Itens de conveniência próximos ao caixa |
| Administrativo | Materiais de uso interno |
| Loja/Depósito | Itens sem setor definido ou em trânsito |
| Não classificado | Setor pendente de atribuição manual |

**No banco:** campo `sector` em `loss_notes`, `loss_items`, `monthly_closing_entries`.

---

### Produto
**Definição:** Item comercializado ou utilizado internamente identificado pelo nome na nota fiscal.

**No banco:** campo `product` em `loss_items`.

**Observação:** o produto ainda não possui entidade própria com código EAN ou SKU. Atualmente é identificado apenas pelo nome textual da NF.

---

### Tipo de Movimentação
**Definição:** Classificação da origem da nota fiscal.

| Tipo | Descrição |
|---|---|
| Perdas | Produtos perdidos (vencimento, avaria, furto, etc.) |
| Uso/Consumo | Produtos consumidos internamente pela operação |
| Saída entre lojas | Transferência de produto entre unidades da rede |

**No banco:** campo `type` em `loss_notes` e `loss_items`.

---

### Motivo de Perda
**Definição:** Causa específica atribuída a um item de nota durante a classificação manual.

| Motivo | Descrição |
|---|---|
| Vencimento | Produto com prazo de validade expirado |
| Avaria | Produto com dano físico não intencional |
| Quebra | Produto fracionado ou partido |
| Corte | Aparas e resíduos de processamento |
| Lavagem | Perdas em processo de higienização |
| Manipulação | Perdas no preparo e manipulação |
| Furto | Subtração por terceiros ou colaboradores |
| Uso/Consumo | Consumo interno autorizado |
| Perdas Pagas | Perdas ressarcidas por fornecedor |
| Saída de um para outro | Transferência entre setores ou lojas |
| Degustação | Amostras e demonstrações |
| Outros | Motivos não categorizados |

**No banco:** campo `reason` em `loss_items`.

---

### Nota Fiscal de Perda (Nota de Saída)
**Definição:** Documento fiscal que registra a saída de produtos do estoque por perda, consumo ou transferência.

**Campos relevantes:**
- `invoice`: número da NF
- `access_key` (chave NF-e): identificador único nacional
- `store`: loja emissora
- `emission_date`: data de emissão
- `sector`: setor responsável
- `type`: tipo de movimentação
- `total_value`: valor total da nota
- `item_count`: quantidade de itens

**No banco:** tabela `loss_notes`.

---

### Item de Nota
**Definição:** Linha individual de uma nota fiscal contendo produto, quantidade, valor unitário e motivo.

**No banco:** tabela `loss_items`, relacionada a `loss_notes` via `note_key`.

---

### Competência
**Definição:** O mês de referência ao qual uma perda ou movimentação é atribuída para fins de fechamento, independente da data de emissão da nota.

**Exemplo:** Uma nota emitida em 01/07 pode ter competência em 06 (junho), se o produto foi perdido em junho.

**Distinção importante:**
- `emission_month`: mês em que a nota foi emitida.
- `competence_month` (ou `competência`): mês ao qual o lançamento pertence para o fechamento.

**No banco:** campos `competence_month` e `emission_month` em `loss_notes` e `loss_items`.

---

### Fechamento Mensal
**Definição:** Processo de consolidação, validação e aprovação de todos os lançamentos de uma competência para uma loja e setor específicos.

**Status possíveis:**
- `pendente`: lançamentos existem mas não foram conferidos
- `confere`: validado e aprovado
- `divergente`: existem inconsistências identificadas
- `sem_nota`: nenhum lançamento encontrado para o período

**No banco:** tabela `monthly_closing_entries`.

---

### Entrada de Fechamento
**Definição:** Registro consolidado de um fechamento para uma combinação única de (loja × tipo × setor × mês × ano).

**No banco:** tabela `monthly_closing_entries`.

---

### Histórico
**Definição:** Série de valores consolidados mês a mês, usada como base para todas as comparações e detecção de anomalias.

**Fontes:**
1. Dados operacionais: derivados de `loss_items` e `loss_notes` (detalhados, desde a implantação do sistema).
2. Dados históricos: tabela `historical_closing_entries`, populada a partir da planilha histórica (antes do sistema).

---

### Evento Operacional
**Definição:** Ocorrência relevante que explica uma variação nos indicadores de uma loja ou setor em um determinado período.

Exemplos:
- Separação da Produção Padaria em setor próprio.
- Greve de fornecedor com impacto em FLV.
- Reforma de câmara fria causando perda temporária.
- Troca de gerente de setor.
- Sazonalidade (Natal, Páscoa, etc.).

**Importância:** Eventos operacionais são a principal fonte de hipóteses geradas pelo Investigation Engine.

**No Knowledge Engine:** tabela `operational_events`.

---

### Anomalia
**Definição:** Valor que se desvia significativamente do padrão histórico esperado para aquela dimensão (produto, setor, loja).

**Critério de detecção:** Z-Score ≥ 1,5 ou IQR (outlier moderado/extremo), o que for mais sensível ao contexto.

**Níveis:**
| Nível | Z-Score | Descrição |
|---|---|---|
| Normal | < 1,5 | Dentro do esperado |
| Atenção | 1,5 – 2,0 | Desvio moderado, monitorar |
| Alto | 2,0 – 2,5 | Desvio relevante, investigar |
| Crítico | ≥ 2,5 | Desvio severo, ação imediata |

---

### Score de Criticidade
**Definição:** Índice de 0 a 100 que resume a gravidade de uma anomalia ou situação, considerando múltiplos fatores com pesos configuráveis.

**Níveis:**
| Faixa | Nível | Ação sugerida |
|---|---|---|
| 0 – 25 | Baixo | Monitorar |
| 26 – 50 | Médio | Atenção |
| 51 – 75 | Alto | Investigar |
| 76 – 100 | Crítico | Ação imediata |

---

### Tendência
**Definição:** Direção e intensidade da variação de um indicador ao longo do tempo, calculada por regressão linear sobre a série histórica.

| Direção | Inclinação mensal | Descrição |
|---|---|---|
| Alta Forte | > +15% | Crescimento acelerado |
| Alta | +5% a +15% | Crescimento moderado |
| Estável | -5% a +5% | Sem variação significativa |
| Queda | -15% a -5% | Redução moderada |
| Queda Forte | < -15% | Redução acelerada |

---

### Investigação
**Definição:** Processo analítico estruturado que transforma uma anomalia em um dossiê com hipóteses, plano de ação e justificativa técnica.

**Componentes:**
1. **Resumo Executivo** — o que aconteceu, qual o impacto, qual ação imediata.
2. **Comparações históricas** — o valor no contexto do histórico da loja/setor.
3. **Comparação entre lojas** — o mesmo setor/produto nas outras lojas.
4. **Tendência** — desde quando e a que velocidade.
5. **Produtos relacionados** — outros produtos do mesmo setor com comportamento similar.
6. **Hipóteses prováveis** — causas possíveis com probabilidade e evidências.
7. **Plano de investigação** — passos concretos para confirmar ou descartar cada hipótese.
8. **Justificativa técnica** — metodologia utilizada (Z-Score, série analisada, pesos).

---

### Tolerância
**Definição:** Limite percentual configurável acima do qual uma variação é considerada relevante para um setor ou loja específicos.

**Exemplo:**
- Padaria (SOL 3): tolerância de 3% sobre o valor médio histórico.
- FLV (rede): tolerância de 5%.
- Açougue (SOL 1): tolerância de 2%.

**Gerenciado por:** Rules Engine.

---

### Período de Análise
**Definição:** Janela temporal utilizada para calcular comparações e médias.

| Período | Uso |
|---|---|
| Mês atual | Valor sendo analisado |
| Mês anterior | Comparação imediata |
| Últimos 3 meses | Média de curto prazo |
| Últimos 6 meses | Média de médio prazo |
| Últimos 12 meses | Média de longo prazo / sazonalidade |
| Mesmo mês do ano anterior | Comparação anual com sazonalidade |

---

### Reincidência
**Definição:** Número de períodos consecutivos (ou dentro de uma janela) em que uma anomalia ou desvio se repete para a mesma dimensão.

**Importância:** Alta reincidência aumenta o score de criticidade e fortalece hipóteses de causas estruturais (não pontuais).

---

### Participação
**Definição:** Percentual que um produto, setor ou loja representa no total analisado.

**Fórmulas:**
- `participação_setor = valor_setor / valor_total_loja`
- `participação_loja = valor_loja / valor_total_rede`
- `participação_produto = valor_produto / valor_total_setor`

---

### Mudança Estrutural
**Definição:** Alteração permanente na operação que cria uma quebra de série histórica, tornando comparações com períodos anteriores parcialmente inválidas.

**Exemplos:**
- Separação de "Produção Padaria" como setor independente.
- Abertura de nova loja.
- Mudança de fornecedor de carne afetando volume do Açougue.

**Tratamento:** O Knowledge Engine registra a mudança e o Analytics Engine pode ser instruído a desconsiderar períodos anteriores à quebra.

---

### Confiabilidade dos Dados
**Definição:** Indicador da qualidade e completude dos dados disponíveis para análise.

| Nível | Condição |
|---|---|
| Alta | ≥ 12 meses de histórico, sem gaps |
| Parcial | 3 a 11 meses, ou gaps pontuais |
| Baixa | < 3 meses ou dados incompletos |

**Impacto:** Análises com confiabilidade baixa têm suas conclusões marcadas com ressalva.

---

### Dossiê Analítico
**Definição:** Sinônimo de Investigação. Documento estruturado gerado pelo Investigation Engine contendo todas as análises, hipóteses e plano de ação para uma anomalia ou seleção manual.

---

### Competência (página do Knowledge Engine)
**Definição:** Visão consolidada e navegável de tudo o que aconteceu em um mês específico para uma loja ou setor.

**Conteúdo de uma competência:**
- Indicadores consolidados do período.
- Anomalias detectadas.
- Eventos operacionais registrados.
- Justificativas inseridas pela equipe.
- Planos de ação criados.
- Resultados dos planos anteriores.
- Responsáveis envolvidos.
- Anexos, fotos e atas vinculadas.
- Histórico de alterações.
