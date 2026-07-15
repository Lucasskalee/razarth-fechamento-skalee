# KPI CATALOG — Razarth Intelligence Platform

> Nenhum indicador sem definição, fórmula e fonte.

---

## Categorias

- [Financeiros](#financeiros)
- [Quantitativos](#quantitativos)
- [Comparativos](#comparativos)
- [Tendência](#tendencia)
- [Qualidade operacional](#qualidade-operacional)
- [Criticidade e risco](#criticidade-e-risco)
- [Eficiência e desempenho](#eficiencia-e-desempenho)
- [Rede / Multi-loja](#rede--multi-loja)

---

## Financeiros

### TotalLosses — Valor Total de Perdas
**Definição:** Soma de todos os valores de itens classificados como "Perdas" no período.
**Fórmula:** `SUM(loss_items.value) WHERE type = 'Perdas'`
**Fonte:** `loss_items`
**Unidade:** R$ (BRL)
**Granularidade:** loja × setor × mês

---

### TotalUsageConsumption — Valor Total de Uso/Consumo
**Definição:** Soma de todos os valores de itens classificados como "Uso/Consumo" no período.
**Fórmula:** `SUM(loss_items.value) WHERE type = 'Uso/Consumo'`
**Fonte:** `loss_items`
**Unidade:** R$ (BRL)

---

### TotalGeneral — Valor Total Geral
**Definição:** Soma de todos os lançamentos do período (perdas + uso/consumo + saídas).
**Fórmula:** `SUM(loss_items.value)`
**Fonte:** `loss_items`
**Unidade:** R$ (BRL)

---

### AverageNoteValue — Ticket Médio por Nota
**Definição:** Valor médio por nota fiscal no período.
**Fórmula:** `TotalGeneral / COUNT(DISTINCT note_key)`
**Fonte:** `loss_notes`
**Unidade:** R$ (BRL)

---

### AverageItemValue — Valor Médio por Item
**Definição:** Valor médio por linha de item no período.
**Fórmula:** `TotalGeneral / COUNT(loss_items)`
**Unidade:** R$ (BRL)

---

## Quantitativos

### TotalQuantity — Quantidade Total
**Definição:** Soma das quantidades de todos os itens do período.
**Fórmula:** `SUM(loss_items.quantity)`
**Unidade:** kg / unidade (conforme produto)

---

### NoteCount — Total de Notas
**Definição:** Número de notas fiscais distintas no período.
**Fórmula:** `COUNT(DISTINCT loss_notes.note_key)`
**Fonte:** `loss_notes`

---

### ItemCount — Total de Itens
**Definição:** Número de linhas de item no período.
**Fórmula:** `COUNT(loss_items.id)`

---

### ProductCount — Produtos Distintos
**Definição:** Número de produtos diferentes no período.
**Fórmula:** `COUNT(DISTINCT loss_items.product)`

---

## Comparativos

### VariationVsPreviousMonth — Variação vs. Mês Anterior
**Definição:** Variação percentual do valor total em relação ao mês imediatamente anterior.
**Fórmula:**
```
((valor_mes_atual - valor_mes_anterior) / valor_mes_anterior) * 100
```
**Unidade:** % (positivo = aumento, negativo = redução)
**Contexto:** resultado mais alto que +10% deve acionar verificação.

---

### VariationVsAverage3M — Variação vs. Média 3 Meses
**Definição:** Variação percentual vs. média aritmética dos 3 meses anteriores.
**Fórmula:**
```
media_3m = MEAN(valores dos 3 meses anteriores)
variacao = ((valor_atual - media_3m) / media_3m) * 100
```

---

### VariationVsAverage6M — Variação vs. Média 6 Meses
**Fórmula:** `((valor_atual - MEAN(últimos 6 meses)) / MEAN(últimos 6 meses)) * 100`

---

### VariationVsAverage12M — Variação vs. Média 12 Meses
**Fórmula:** `((valor_atual - MEAN(últimos 12 meses)) / MEAN(últimos 12 meses)) * 100`
**Uso:** principal referência de médio-longo prazo. Captura sazonalidade.

---

### VariationVsSameMonthLastYear — Variação vs. Mesmo Mês Ano Anterior
**Definição:** Comparação com o mesmo mês do ano anterior (elimina sazonalidade).
**Fórmula:** `((valor_julho_2026 - valor_julho_2025) / valor_julho_2025) * 100`

---

### DeviationFromNetworkAverage — Desvio da Média da Rede
**Definição:** Quanto a loja desvia da média de todas as lojas para o mesmo setor/período.
**Fórmula:**
```
media_rede = MEAN(valores de todas as lojas)
desvio = ((valor_loja - media_rede) / media_rede) * 100
```

---

## Tendência

### TrendSlope — Inclinação da Tendência
**Definição:** Variação média mensal calculada por regressão linear sobre a série histórica.
**Fórmula:** coeficiente angular da regressão linear mínimos quadrados
**Unidade:** R$/mês ou %/mês
**Interpretação:**
- Positivo = crescimento mensal médio
- Negativo = redução mensal média

---

### TrendR2 — Confiança da Tendência
**Definição:** Coeficiente de determinação (R²) da regressão linear. Mede o quanto a série se comporta como uma linha reta.
**Fórmula:** R² = 1 - (SS_res / SS_tot)
**Unidade:** 0 a 1
**Interpretação:**
- R² < 0.5 → tendência fraca / dados voláteis
- R² ≥ 0.7 → tendência confiável
- R² ≥ 0.9 → tendência muito forte

---

### TrendDuration — Duração da Tendência
**Definição:** Número de meses consecutivos em que a tendência atual é sustentada.
**Cálculo:** Contagem de meses consecutivos na mesma direção (dentro do limiar configurado).

---

## Qualidade operacional

### ClassificationRate — Taxa de Classificação
**Definição:** Percentual de itens que possuem motivo atribuído.
**Fórmula:**
```
(COUNT(items com reason preenchido) / COUNT(total items)) * 100
```
**Meta:** ≥ 95% para fechamento aprovado.

---

### PendingItems — Itens Pendentes
**Definição:** Número de itens sem motivo atribuído.
**Fórmula:** `COUNT(loss_items WHERE reason IS NULL OR reason = '')`

---

### ClosingCompletionRate — Taxa de Fechamento Concluído
**Definição:** Percentual de entradas de fechamento com status "confere" no período.
**Fórmula:**
```
(COUNT(entries WHERE status = 'confere') / COUNT(total entries)) * 100
```

---

### DataCompleteness — Completude dos Dados
**Definição:** Percentual de meses no histórico de 12 meses que possuem dados.
**Fórmula:** `(COUNT(meses com dados) / 12) * 100`
**Impacto:** Afeta a confiabilidade das comparações.

---

## Criticidade e risco

### AnomalyCount — Total de Anomalias Detectadas
**Definição:** Número de anomalias com nível de risco ≥ Atenção detectadas no período.
**Cálculo:** COUNT(anomalias WHERE risk_level IN ('Atenção', 'Alto', 'Crítico'))

---

### CriticalAnomalyCount — Anomalias Críticas
**Definição:** Número de anomalias com score ≥ 76 (nível Crítico).

---

### AverageCriticalityScore — Score Médio de Criticidade
**Definição:** Média dos scores de criticidade de todas as anomalias detectadas no período.
**Fórmula:** `MEAN(anomaly.score)`
**Unidade:** 0 a 100

---

### MaxCriticalityScore — Score Máximo
**Definição:** Score da anomalia mais crítica do período.
**Uso:** indicador de alerta máximo para o gestor.

---

### RecurrenceRate — Taxa de Reincidência
**Definição:** Percentual de anomalias do período que também ocorreram no mês anterior.
**Fórmula:**
```
(COUNT(anomalias que reincidiram) / COUNT(total anomalias)) * 100
```
**Interpretação:** Alta reincidência indica problema estrutural, não pontual.

---

## Eficiência e desempenho

### LossToRevenueRatio — Perdas / Faturamento
**Definição:** Percentual que as perdas representam sobre o faturamento da loja.
**Fórmula:** `(TotalLosses / revenue) * 100`
**Dependência:** requer campo de faturamento (futuro — v1.5).
**Meta de mercado:** < 1,5% para supermercados eficientes.

---

### SectorConcentration — Concentração por Setor
**Definição:** Percentual que o setor de maior valor representa no total da loja.
**Fórmula:** `valor_setor_lider / TotalGeneral * 100`
**Interpretação:** concentração > 40% em um setor merece atenção.

---

### ToleranceAdherence — Aderência à Tolerância
**Definição:** Se o valor do setor/loja está dentro da tolerância configurada no Rules Engine.
**Resultado:** Dentro / Fora / Sem configuração
**Fonte:** Rules Engine (configuração de tolerâncias)

---

## Rede / Multi-loja

### NetworkLeader — Loja Líder da Rede
**Definição:** Loja com maior valor total de perdas no período.
**Uso:** identificar qual unidade requer atenção prioritária.

---

### NetworkAverage — Média da Rede
**Definição:** Média aritmética do valor total entre todas as lojas para o mesmo período e setor.
**Fórmula:** `MEAN(TotalGeneral por loja)`

---

### NetworkStdDev — Desvio Padrão da Rede
**Definição:** Variabilidade dos valores entre as lojas.
**Uso:** lojas com desvio > 1.5σ da média da rede são candidatas a anomalia cross-store.

---

### BenchmarkPosition — Posição no Benchmark
**Definição:** Posição da loja no ranking da rede para um setor/período.
**Formato:** "3ª de 6 lojas" ou "acima da média da rede".
