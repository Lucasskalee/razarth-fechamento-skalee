# FORMULA BOOK — Razarth Intelligence Platform

> Nenhuma fórmula escondida no código.
> Este documento é a fonte de verdade para todos os cálculos do sistema.

---

## Estatísticas básicas

### Média Aritmética
```
mean(X) = (x₁ + x₂ + ... + xₙ) / n
```
**Uso:** base para comparações temporais e cross-store.

---

### Desvio Padrão (população)
```
stddev(X) = sqrt( SUM((xᵢ - mean(X))²) / n )
```
**Uso:** medir dispersão da série histórica.

**Nota:** usamos população (n), não amostra (n-1), pois a série histórica representa o universo completo de dados disponíveis.

---

### Mediana
```
Se n é ímpar: mediana = X[(n+1)/2]
Se n é par:   mediana = (X[n/2] + X[n/2 + 1]) / 2
(com X ordenado crescentemente)
```
**Uso:** referência alternativa à média em séries com outliers.

---

### Quartis
```
Q1 (1º quartil) = mediana da metade inferior da série
Q3 (3º quartil) = mediana da metade superior da série
IQR = Q3 - Q1
```

---

### Z-Score
```
z = (x - mean(X)) / stddev(X)
```
**Interpretação:**
- z = 0   → valor igual à média
- z = +2  → valor 2 desvios acima da média
- z = -1  → valor 1 desvio abaixo da média

**Uso:** classificar nível de anomalia.

---

### Limites IQR (Outlier Fence)
```
Fence inferior = Q1 - 1.5 * IQR
Fence superior = Q3 + 1.5 * IQR

Outlier extremo (severo):
Fence inferior extremo = Q1 - 3.0 * IQR
Fence superior extremo = Q3 + 3.0 * IQR
```

**Uso:** detecção de anomalias robusta para distribuições assimétricas.

---

## Comparações

### Variação Absoluta
```
variação_absoluta = valor_atual - valor_referência
```

---

### Variação Percentual
```
variação_pct = ((valor_atual - valor_referência) / valor_referência) * 100
```
**Cuidado:** quando valor_referência = 0, a variação percentual é indefinida.
Razarth trata este caso retornando `null` e exibindo "Sem histórico".

---

### Média de N meses anteriores
```
media_nm = (valor_mês-1 + valor_mês-2 + ... + valor_mês-N) / N
```
**Variações utilizadas:**
- `media_3m`: N = 3
- `media_6m`: N = 6
- `media_12m`: N = 12

---

### Desvio da Média da Rede
```
desvio_rede = ((valor_loja - media_rede) / media_rede) * 100
```

---

## Tendência — Regressão Linear Mínimos Quadrados

### Coeficientes da reta y = a + bx
```
n = número de pontos
b = (n * SUM(xᵢ * yᵢ) - SUM(xᵢ) * SUM(yᵢ)) / (n * SUM(xᵢ²) - SUM(xᵢ)²)
a = (SUM(yᵢ) - b * SUM(xᵢ)) / n
```
Onde:
- `x` = índice do mês (0, 1, 2, ..., n-1)
- `y` = valor do mês correspondente

---

### Coeficiente de Determinação R²
```
SS_res = SUM((yᵢ - ŷᵢ)²)      ← soma dos resíduos ao quadrado
SS_tot = SUM((yᵢ - mean(y))²)  ← variância total

R² = 1 - (SS_res / SS_tot)
```
**Interpretação:**
- R² = 1.0 → série perfeitamente linear
- R² = 0.0 → regressão não explica nada

---

### Projeção do próximo mês
```
próximo_mês = a + b * n
(onde n é o índice do próximo ponto, após o último da série)
```
**Nota:** projeção é uma estimativa. Deve ser exibida com ressalva quando R² < 0.7.

---

### Inclinação percentual mensal
```
slope_pct = (b / mean(y)) * 100
```
**Uso:** classificar direção da tendência.

---

## Score de Criticidade

### Fórmula geral
```
score = SUM( normalize(fator_i) * peso_i ) * 100
```

### Normalização de fatores (0 → 1)
```
normalize(x) = max(0, min(1, (x - min_ref) / (max_ref - min_ref)))
```

### Fator: Valor Financeiro
```
normalize_financeiro = min(1, valor / limiar_alto)
limiar_alto padrão = R$ 50.000 (configurável no Rules Engine)
```

### Fator: Variação Percentual
```
normalize_variacao = min(1, |variacao_pct| / 100)
(|variação| ≥ 100% → fator = 1.0)
```

### Fator: Z-Score
```
normalize_zscore = min(1, |z| / 3.0)
(|z| ≥ 3.0 → fator = 1.0)
```

### Fator: Tendência
```
Sem tendência (R² < 0.5)  → 0.0
Estável                    → 0.0
Alta ou Queda              → 0.4
Alta Forte ou Queda Forte  → 0.8
Alta Forte + R² ≥ 0.9      → 1.0
```

### Fator: Reincidência
```
normalize_reincidencia = min(1, meses_consecutivos / 6)
(6 ou mais meses consecutivos → fator = 1.0)
```

### Fator: Participação no Setor
```
normalize_setor = valor_produto / total_setor
(produto que representa 100% do setor → fator = 1.0)
```

### Fator: Participação na Loja
```
normalize_loja = valor_item / total_loja
```

### Fator: Desvio entre Lojas
```
normalize_cross = min(1, |desvio_rede_pct| / 100)
```

### Score final
```
score = (
    normalize_financeiro  * 0.20 +
    normalize_variacao    * 0.20 +
    normalize_zscore      * 0.15 +
    normalize_tendencia   * 0.15 +
    normalize_reincidencia* 0.10 +
    normalize_setor       * 0.08 +
    normalize_loja        * 0.07 +
    normalize_cross       * 0.05
) * 100
```

**Pesos são configuráveis via Rules Engine. A soma deve sempre = 1.00.**

---

## Anomalia — nível de risco

```
|Z-Score| < 1.5  AND valor dentro do IQR fence → Normal
|Z-Score| ≥ 1.5  OR  outlier IQR moderado       → Atenção
|Z-Score| ≥ 2.0  OR  outlier IQR extremo inicial → Alto
|Z-Score| ≥ 2.5  OR  outlier IQR extremo severo  → Crítico
```

Regra: **classificação final = nível mais alto entre Z-Score e IQR**.

---

## Taxa de Classificação
```
taxa_classificacao = (itens_com_motivo / total_itens) * 100
```

---

## Participação (produto / setor / loja)
```
participacao_produto = valor_produto / total_setor * 100
participacao_setor   = valor_setor   / total_loja  * 100
participacao_loja    = valor_loja    / total_rede  * 100
```

---

## Confiabilidade dos dados
```
Se meses_com_dados >= 12 → Alta
Se meses_com_dados >= 3  → Parcial
Se meses_com_dados < 3   → Baixa
```

**Impacto na exibição:**
- Alta: sem ressalva
- Parcial: exibir "Baseado em X meses de histórico"
- Baixa: exibir "Dados insuficientes para análise confiável"

---

## Tolerância (Rules Engine)
```
dentro_tolerancia = |variacao_pct| <= tolerancia_configurada
```
**Exemplo:**
```
Padaria SOL 3: tolerancia = 3%
variacao_atual = 2.8% → dentro da tolerância → não gera alerta
variacao_atual = 4.1% → fora da tolerância → gera atenção
```

---

## Notas de precisão

| Campo | Precisão no banco | Precisão nos cálculos |
|---|---|---|
| Valor monetário | `numeric(14,2)` | `decimal` C# (28 dígitos) |
| Quantidade | `numeric(14,3)` | `decimal` C# |
| Percentual | calculado | `double` (suficiente para análise) |
| Score | calculado | `double` arredondado para 1 casa |
| Z-Score | calculado | `double` |
| R² | calculado | `double` |

**Regra:** valores financeiros usam `decimal` (sem erro de ponto flutuante). Estatísticas usam `double` (performance).
