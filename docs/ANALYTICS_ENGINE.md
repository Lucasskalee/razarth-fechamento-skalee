# ANALYTICS ENGINE — Especificação Técnica

> O cérebro do Razarth. Toda inteligência nasce aqui.

---

## Princípios

1. **Funções puras onde possível.** Mesma entrada → mesma saída. Sem estado, sem efeitos colaterais.
2. **Sem acesso ao banco.** O Analytics Engine recebe dados já carregados. Quem busca é o Razarth.Data.
3. **Sem referência à UI.** Nenhum tipo de formatação de tela, nenhum HTML, nenhum JSON de resposta HTTP.
4. **Result<T> sempre.** Nenhum método lança exceção para o caller. Erros são retornados como dados.
5. **Pesos configuráveis via Rules Engine.** Nenhum limiar ou peso é hardcoded.

---

## Módulos do Analytics Engine

```
Razarth.Analytics/
  Statistics/
    StatisticsCalculator.cs
    StatisticsProfile.cs

  Comparison/
    TemporalComparator.cs
    CrossStoreComparator.cs
    CrossSectorComparator.cs
    ComparisonResult.cs

  Trend/
    TrendAnalyzer.cs
    LinearRegression.cs
    TrendResult.cs

  Ranking/
    RankingBuilder.cs
    RankingItem.cs

  Anomaly/
    AnomalyDetector.cs
    AnomalyClassifier.cs
    AnomalyResult.cs

  Score/
    CriticalityScorer.cs
    ScoreBreakdown.cs
    ScoreResult.cs

  Indicators/
    KpiCalculator.cs
    KpiResult.cs

  AnalyticsOrchestrator.cs    ← ponto de entrada principal
  AnalyticsReport.cs          ← objeto de saída consolidado
```

---

## Módulo 1 — Statistics

**Responsabilidade:** Calcular o perfil estatístico de uma série de valores.
É a base matemática de todo o motor. Nenhum outro módulo faz estatística diretamente.

### StatisticsProfile

```csharp
public record StatisticsProfile
{
    public double Mean { get; init; }           // Média aritmética
    public double StdDev { get; init; }         // Desvio padrão
    public double Median { get; init; }         // Mediana
    public double Q1 { get; init; }             // Primeiro quartil
    public double Q3 { get; init; }             // Terceiro quartil
    public double IQR { get; init; }            // Q3 - Q1
    public double Min { get; init; }
    public double Max { get; init; }
    public int Count { get; init; }
    public double LowerFence { get; init; }     // Q1 - 1.5 * IQR
    public double UpperFence { get; init; }     // Q3 + 1.5 * IQR
    public double ConfidenceLevel { get; init; } // 0 a 1 — baseado no Count
}
```

### StatisticsCalculator — métodos

```csharp
// Calcula o perfil completo de uma série
StatisticsProfile Calculate(IReadOnlyList<double> values);

// Calcula o Z-Score de um valor em relação a um perfil
double ZScore(double value, StatisticsProfile profile);

// Verifica se o valor é outlier moderado (1.5 IQR) ou extremo (3 IQR)
OutlierLevel ClassifyOutlier(double value, StatisticsProfile profile);

// Confiabilidade dos dados baseada no número de amostras
DataConfidence GetConfidence(int sampleCount);
// < 3 → Baixa | 3–11 → Parcial | >= 12 → Alta
```

---

## Módulo 2 — Comparison

**Responsabilidade:** Produzir todas as comparações obrigatórias em formato padronizado e contextualizado.

### ComparisonResult

```csharp
public record ComparisonResult
{
    public string Dimension { get; init; }       // "vs. mês anterior"
    public decimal CurrentValue { get; init; }
    public decimal ReferenceValue { get; init; }
    public decimal AbsoluteVariation { get; init; }
    public double PercentVariation { get; init; }
    public TrendDirection Direction { get; init; }
    public RiskLevel AlertLevel { get; init; }
    public string Description { get; init; }     // "21% acima da média de 6 meses"
}
```

### TemporalComparator — métodos

```csharp
// Gera todas as comparações temporais de uma vez
TemporalComparison Compare(
    decimal currentValue,
    IReadOnlyList<MonthSeries> historicalSeries,
    decimal? sameMonthPreviousYear = null
);

// Resultado contém:
public record TemporalComparison
{
    public ComparisonResult VsPreviousMonth { get; init; }
    public ComparisonResult VsAverage3Months { get; init; }
    public ComparisonResult VsAverage6Months { get; init; }
    public ComparisonResult VsAverage12Months { get; init; }
    public ComparisonResult? VsSameMonthLastYear { get; init; }
    public StatisticsProfile HistoricalProfile { get; init; }
}
```

### CrossStoreComparator — métodos

```csharp
// Compara todas as lojas para o mesmo período/setor
CrossStoreComparison CompareStores(IReadOnlyList<StoreData> storeData);

public record CrossStoreComparison
{
    public decimal NetworkAverage { get; init; }
    public IReadOnlyList<StoreComparisonItem> Stores { get; init; }
    public IReadOnlyList<string> AboveAverage { get; init; }
    public IReadOnlyList<string> BelowAverage { get; init; }
    public string HighestStore { get; init; }
    public string LowestStore { get; init; }
}
```

---

## Módulo 3 — Trend

**Responsabilidade:** Identificar direção, intensidade e duração das tendências na série histórica.

### TrendResult

```csharp
public record TrendResult
{
    public TrendDirection Direction { get; init; }
    public double Slope { get; init; }            // Variação média mensal absoluta
    public double SlopePercent { get; init; }     // Variação média mensal em %
    public double R2 { get; init; }               // Confiança da regressão (0-1)
    public string StartEstimate { get; init; }    // "jan/2025"
    public int DurationMonths { get; init; }
    public decimal? NextMonthProjection { get; init; }
    public string Description { get; init; }      // "Alta consistente há 4 meses (+8%/mês)"
}
```

### TrendAnalyzer — métodos

```csharp
// Analisa tendência em uma série temporal
TrendResult Analyze(IReadOnlyList<MonthSeries> series);

// Regressão linear simples
LinearRegressionResult CalculateLinearRegression(IReadOnlyList<double> values);

// Classifica a direção pela inclinação percentual mensal
TrendDirection ClassifyDirection(double slopePercent);
// > +15% → AltaForte | +5 a +15% → Alta | -5 a +5% → Estavel
// -5 a -15% → Queda | < -15% → QuedaForte
```

---

## Módulo 4 — Ranking

**Responsabilidade:** Ordenar e rankear qualquer dimensão com contexto analítico.

### RankingItem

```csharp
public record RankingItem
{
    public int Position { get; init; }
    public string Entity { get; init; }           // Nome do produto/setor/loja
    public decimal Value { get; init; }
    public double? VariationPercent { get; init; }
    public double? Score { get; init; }
    public double Participation { get; init; }    // % do total
    public TrendDirection? Trend { get; init; }
    public string? Badge { get; init; }           // "↑ Alta", "⚠ Atenção"
}
```

### RankingBuilder — métodos

```csharp
// Ranking de produtos por valor
IReadOnlyList<RankingItem> RankProducts(IReadOnlyList<LossItem> items, int top = 10);

// Ranking de setores
IReadOnlyList<RankingItem> RankSectors(IReadOnlyList<LossItem> items);

// Ranking de lojas
IReadOnlyList<RankingItem> RankStores(IReadOnlyList<StoreData> storeData);

// Ranking de motivos de perda
IReadOnlyList<RankingItem> RankReasons(IReadOnlyList<LossItem> items);

// Ranking de reincidência (quantos meses o item apareceu na análise)
IReadOnlyList<RankingItem> RankRecurrence(
    IReadOnlyList<MonthSeries> series,
    RecurrenceDimension dimension
);
```

---

## Módulo 5 — Anomaly

**Responsabilidade:** Detectar automaticamente desvios significativos em qualquer dimensão.

### AnomalyResult

```csharp
public record AnomalyResult
{
    public string Id { get; init; }
    public AnomalyType Type { get; init; }        // Produto, Setor, Loja, Custo, Quantidade
    public string Entity { get; init; }
    public string? Store { get; init; }
    public string? Sector { get; init; }
    public string ReferencePeriod { get; init; }  // "jun/2026"
    public decimal CurrentValue { get; init; }
    public decimal ExpectedValue { get; init; }   // Média histórica
    public double DeviationPercent { get; init; }
    public double ZScore { get; init; }
    public RiskLevel RiskLevel { get; init; }
    public double Score { get; init; }
    public string Reason { get; init; }           // "45% acima da média dos últimos 6 meses"
    public IReadOnlyList<string> Evidence { get; init; }
    public IReadOnlyList<string> Recommendations { get; init; }
}
```

### AnomalyDetector — métodos

```csharp
// Detecta anomalias em todos os setores de uma loja/mês
IReadOnlyList<AnomalyResult> DetectBySector(
    string store, Period period, IReadOnlyList<SectorSeries> historicalSeries
);

// Detecta anomalias em produtos dentro de um setor
IReadOnlyList<AnomalyResult> DetectByProduct(
    string store, string sector, Period period,
    IReadOnlyList<ProductSeries> historicalSeries
);

// Detecta anomalias comparando lojas entre si
IReadOnlyList<AnomalyResult> DetectCrossStore(
    Period period, string sector, IReadOnlyList<StoreData> storeData
);

// Varredura completa — todas as dimensões
Task<IReadOnlyList<AnomalyResult>> RunFullRadarAsync(
    Period period, string? store = null
);
```

### AnomalyClassifier — lógica de classificação

```
Nível de risco é o maior entre Z-Score e IQR:

|Z-Score| < 1.5 AND valor dentro do IQR fence → Normal
|Z-Score| ≥ 1.5 OR outlier IQR moderado       → Atenção
|Z-Score| ≥ 2.0 OR outlier IQR extremo inicial → Alto
|Z-Score| ≥ 2.5 OR outlier IQR extremo severo  → Crítico

Usando os dois métodos juntos porque:
- Z-Score é sensível a distribuições normais
- IQR é robusto para distribuições assimétricas (comum em perdas)
```

---

## Módulo 6 — Score

**Responsabilidade:** Calcular o índice de criticidade 0–100 com pesos configuráveis.

### ScoreBreakdown

```csharp
public record ScoreFactor
{
    public string Name { get; init; }
    public double RawValue { get; init; }    // Valor normalizado 0-1
    public double Weight { get; init; }      // Peso configurado (0-1)
    public double Contribution { get; init; } // RawValue * Weight * 100
    public string Explanation { get; init; }
}

public record ScoreResult
{
    public double Score { get; init; }                         // 0-100
    public RiskLevel Level { get; init; }
    public IReadOnlyList<ScoreFactor> Breakdown { get; init; }
    public string Justification { get; init; }                 // Texto automático
}
```

### Fatores do score

| Fator | Peso padrão | O que mede |
|---|---|---|
| FinancialValue | 0.20 | Magnitude absoluta do valor |
| VariationPercent | 0.20 | Desvio percentual vs. média histórica |
| ZScore | 0.15 | Desvio estatístico |
| Trend | 0.15 | Direção e intensidade da tendência |
| Recurrence | 0.10 | Meses consecutivos com anomalia |
| SectorParticipation | 0.08 | % do total do setor |
| StoreParticipation | 0.07 | % do total da loja |
| CrossStoreDeviation | 0.05 | Desvio vs. outras lojas |

**Soma dos pesos = 1.00**

Pesos são fornecidos pelo Rules Engine e podem ser diferentes por cliente, loja ou setor.

### CriticalityScorer — métodos

```csharp
// Calcula o score com os pesos do contexto
ScoreResult Calculate(ScoreInput input, ScoreWeights weights);

// Normaliza um valor bruto para 0-1
double Normalize(double value, double min, double max);

// Converte score para nível de risco
RiskLevel ToRiskLevel(double score);
// 0-25 → Baixo | 26-50 → Médio | 51-75 → Alto | 76-100 → Crítico
```

---

## Módulo 7 — Indicators / KPIs

**Responsabilidade:** Produzir KPIs calculados e prontos para exibição pela API.

### KpiResult

```csharp
public record KpiResult
{
    public string Label { get; init; }
    public decimal Value { get; init; }
    public string FormattedValue { get; init; }  // "R$ 12.450,00"
    public double? VariationPercent { get; init; }
    public TrendDirection? Direction { get; init; }
    public RiskLevel? Status { get; init; }
}
```

### KpiCalculator — KPIs executivos por período

```csharp
public record ExecutiveKpis
{
    public KpiResult TotalLosses { get; init; }
    public KpiResult TotalUsageConsumption { get; init; }
    public KpiResult TotalGeneral { get; init; }
    public KpiResult NetworkAverage { get; init; }
    public KpiResult LeadingSector { get; init; }
    public KpiResult ClassifiedNotes { get; init; }
    public KpiResult DetectedAnomalies { get; init; }
    public KpiResult AverageCriticalityScore { get; init; }
}

ExecutiveKpis CalculateExecutiveKpis(
    AnalyticsDataset dataset,
    TemporalComparison comparison
);
```

---

## AnalyticsOrchestrator — ponto de entrada

```csharp
// Relatório completo — todas as análises
Task<AnalyticsReport> GenerateFullReportAsync(AnalyticsContext context);

// Relatório rápido — apenas KPIs + anomalias (para dashboard, < 2s)
Task<QuickAnalyticsReport> GenerateQuickReportAsync(AnalyticsContext context);
```

### AnalyticsContext (filtros de entrada)

```csharp
public record AnalyticsContext
{
    public string? Store { get; init; }          // null = todas as lojas
    public int Year { get; init; }
    public int Month { get; init; }
    public string? Sector { get; init; }
    public string? LossType { get; init; }
    public string? Product { get; init; }
    public int HistoricalMonths { get; init; } = 12;
}
```

### AnalyticsReport (saída consolidada)

```csharp
public record AnalyticsReport
{
    public DateTime GeneratedAt { get; init; }
    public AnalyticsContext Context { get; init; }
    public ExecutiveKpis Kpis { get; init; }
    public TemporalComparison TemporalComparisons { get; init; }
    public CrossStoreComparison StoreComparisons { get; init; }
    public TrendResult Trend { get; init; }
    public IReadOnlyList<AnomalyResult> Anomalies { get; init; }
    public RankingSet Rankings { get; init; }
    public DataConfidence Confidence { get; init; }
    public string AnalysisSummary { get; init; }  // Parágrafo auto-gerado
}
```

---

## Sequência de processamento

```
AnalyticsOrchestrator.GenerateFullReportAsync(context)
  │
  ├─ 1. Razarth.Data carrega AnalyticsDataset
  │       loss_items + loss_notes + historical_closing_entries
  │
  ├─ 2. StatisticsCalculator.Calculate(série histórica)
  │       → StatisticsProfile
  │
  ├─ 3. TemporalComparator.Compare(atual, série, ano anterior)
  │       → TemporalComparison
  │
  ├─ 4. TrendAnalyzer.Analyze(série)
  │       → TrendResult
  │
  ├─ 5. CrossStoreComparator.CompareStores(dados lojas)
  │       → CrossStoreComparison
  │
  ├─ 6. AnomalyDetector.RunFullRadar(period, store)
  │       → List<AnomalyResult>
  │
  ├─ 7. Rules Engine resolve pesos para o contexto
  │       → ScoreWeights
  │
  ├─ 8. CriticalityScorer.Calculate(anomalias, pesos)
  │       → ScoreResult por anomalia
  │
  ├─ 9. RankingBuilder.Rank*(items)
  │       → RankingSet (produtos, setores, lojas, motivos)
  │
  ├─ 10. KpiCalculator.CalculateExecutiveKpis(dataset, comparações)
  │        → ExecutiveKpis
  │
  └─ 11. Montar AnalyticsReport completo
           → retornar para Application Layer
```

---

## Saída esperada (exemplo)

```
Produto............. Pão Francês
Loja................ SOL 3
Setor............... Padaria
Período............. Julho/2026

Valor............... R$ 8.420,00
Quantidade.......... 1.284 kg

Mês anterior........ +21% (era R$ 6.958,00)
Média 6 meses....... +34% (média era R$ 6.284,00)
Mesmo mês 2025...... +13% (era R$ 7.451,00)

Tendência........... Alta — crescimento de +8,2%/mês há 4 meses (R² = 0,91)

Anomalias........... 2 detectadas
Score............... 87 — Crítico

Posição no setor.... 1º produto (23% do total Padaria)

Hipóteses...........
• Mudança estrutural: separação da Produção Padaria (evidência: evento registrado em mar/2026)
• Concentração de perdas: maior volume de produção sem ajuste de tolerância
• Revisar parâmetros de produção diária

Recomendação........ Necessita investigação. Abrir dossiê e verificar produção diária vs. vendas.
```
