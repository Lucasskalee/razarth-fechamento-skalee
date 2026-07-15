# CORE ARCHITECTURE — Razarth Intelligence Platform

> **"Primeiro construímos o cérebro. Depois damos olhos, voz e gráficos a ele."**

---

## Visão geral

```
                     ┌──────────────────────────────┐
                     │       RAZARTH PLATFORM       │
                     └──────────────────────────────┘

   ┌────────────────────┐          ┌────────────────────────┐
   │   Razarth Web      │          │    Razarth Desktop     │
   │ React 19 + TS +    │          │  C# + Avalonia UI      │
   │ Vite (PWA)         │          │  (importação, admin,   │
   │                    │          │   auditoria avançada)  │
   └─────────┬──────────┘          └───────────┬────────────┘
             │                                 │
             └──────────────┬──────────────────┘
                            │ HTTP / REST
                 ┌──────────▼──────────┐
                 │    Razarth API      │
                 │ ASP.NET Core .NET 9 │
                 │ Auth · Audit · RBAC │
                 └──────────┬──────────┘
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
│ Data Engine    │  │ Analytics      │  │ Rules Engine   │
│ Import·Valid.  │  │ Engine         │  │ Tolerâncias    │
│ Normalize·Ver. │  │ Stats·Compare  │  │ Pesos·Limites  │
└───────┬────────┘  │ Trend·Rank     │  └───────┬────────┘
        │           │ Anomaly·Score  │          │
        │           └───────┬────────┘          │
        │                   │                   │
        │           ┌───────▼────────┐          │
        │           │ Investigation  │          │
        │           │ Engine         │◄─────────┘
        │           │ Hipóteses      │
        │           │ Dossiê·Plano   │
        │           └───────┬────────┘
        │                   │
        │           ┌───────▼────────┐
        │           │ Knowledge      │
        │           │ Engine         │
        │           │ Eventos·Hist.  │
        │           │ Decisões·Learn │
        │           └───────┬────────┘
        │                   │
        │           ┌───────▼────────┐
        │           │ Forecast Engine│
        │           │ (v2.0)         │
        │           └───────┬────────┘
        │                   │
        │           ┌───────▼────────┐
        │           │ AI Context     │
        │           │ Engine (v3.0)  │
        │           └───────┬────────┘
        │                   │
        └───────────────────┘
                    │
        ┌───────────▼────────────┐
        │  PostgreSQL            │
        │  (Supabase inicialmente)│
        └────────────────────────┘
```

---

## Estrutura da solução

```
Razarth.sln
│
├── src/
│   ├── Razarth.Domain           # Entidades, ValueObjects, Interfaces, Contratos
│   ├── Razarth.Shared           # Types, Extensions, Helpers compartilhados
│   ├── Razarth.Core             # Regras centrais, Abstrações base
│   │
│   ├── Razarth.Data             # EF Core, Repositories, Migrations, Queries
│   ├── Razarth.Infrastructure   # Supabase, Storage, Email, Logging externo
│   │
│   ├── Razarth.Rules            # Rules Engine: tolerâncias, pesos, limites
│   │
│   ├── Razarth.Analytics        # Analytics Engine completo
│   │   ├── Statistics/
│   │   ├── Comparison/
│   │   ├── Trend/
│   │   ├── Ranking/
│   │   ├── Anomaly/
│   │   └── Score/
│   │
│   ├── Razarth.Investigation    # Investigation Engine
│   ├── Razarth.Knowledge        # Knowledge Engine
│   ├── Razarth.Forecast         # Forecast Engine (v2.0)
│   ├── Razarth.AI               # AI Context Engine (v3.0)
│   │
│   ├── Razarth.Application      # Use Cases, Commands, Queries (CQRS)
│   ├── Razarth.Api              # ASP.NET Core — Controllers, Middleware, Auth
│   │
│   ├── Razarth.Web              # React 19 + TypeScript + Vite
│   └── Razarth.Desktop          # C# + Avalonia UI
│
├── tests/
│   ├── Razarth.Analytics.Tests
│   ├── Razarth.Investigation.Tests
│   ├── Razarth.Rules.Tests
│   ├── Razarth.Data.Tests
│   └── Razarth.Application.Tests
│
└── docs/
    ├── PRODUCT_VISION.md
    ├── CORE_ARCHITECTURE.md     ← este arquivo
    ├── BUSINESS_DICTIONARY.md
    ├── ANALYTICS_ENGINE.md
    ├── KNOWLEDGE_ENGINE.md
    ├── KPI_CATALOG.md
    ├── FORMULA_BOOK.md
    └── ROADMAP.md
```

---

## Projetos — Responsabilidades detalhadas

### Razarth.Domain
**Camada:** Domain (DDD)
**Responsabilidade:** O coração do sistema. Define o que existe no negócio.

```
Entities/
  Store.cs              # Loja
  Sector.cs             # Setor
  Product.cs            # Produto
  LossNote.cs           # Nota de perda
  LossItem.cs           # Item de nota
  Competence.cs         # Competência mensal
  OperationalEvent.cs   # Evento operacional
  ClosingEntry.cs       # Entrada de fechamento

ValueObjects/
  Money.cs              # Valor monetário com precisão
  Period.cs             # Período (ano/mês)
  Score.cs              # Score 0-100
  Percentage.cs         # Percentual
  Trend.cs              # Direção + intensidade

Interfaces/
  IRepository<T>
  IAnalyticsEngine
  IKnowledgeEngine
  IRulesEngine
  IDataEngine

Enums/
  LossType.cs           # Perdas, Uso/Consumo, Saída entre lojas
  RiskLevel.cs          # Baixo, Médio, Alto, Crítico
  TrendDirection.cs     # AltaForte, Alta, Estável, Queda, QuedaForte
  ClosingStatus.cs      # Pendente, Confere, Divergente, SemNota
```

**Regra:** Razarth.Domain não depende de nenhum outro projeto.

---

### Razarth.Shared
**Camada:** Cross-cutting
**Responsabilidade:** Tipos, helpers e extensões utilizados por todos os projetos.

```
Types/
  Result<T>.cs          # Retorno estruturado (nunca lança exceção para o caller)
  PagedResult<T>.cs     # Paginação padronizada
  AnalyticsContext.cs   # Contexto de análise (filtros)

Extensions/
  DecimalExtensions.cs  # .ToBrl(), .ToPercent()
  DateExtensions.cs     # .ToPeriod(), .ToLabel()
  StringExtensions.cs

Constants/
  Sectors.cs            # Nomes canônicos dos setores
  LossTypes.cs          # Tipos canônicos de perda
```

---

### Razarth.Data
**Camada:** Infrastructure / Data
**Responsabilidade:** Único ponto de acesso ao banco. Nenhum outro projeto consulta o banco diretamente.

```
Context/
  RazarthDbContext.cs

Repositories/
  LossNoteRepository.cs
  LossItemRepository.cs
  ClosingRepository.cs
  HistoricalRepository.cs
  KnowledgeRepository.cs

Queries/
  AnalyticsQueries.cs   # Queries otimizadas para o Analytics Engine
  HistoricalQueries.cs  # Série temporal para comparações
  CrossStoreQueries.cs  # Dados agregados entre lojas

Migrations/
```

**Regra:** Razarth.Data depende apenas de Razarth.Domain e Razarth.Shared.

---

### Razarth.Rules
**Camada:** Business Rules
**Responsabilidade:** Centraliza todas as regras configuráveis. Nenhuma tolerância ou peso fica hardcoded.

```
Models/
  Tolerance.cs          # Limite aceitável por setor/loja (ex: Padaria até 3%)
  ScoreWeights.cs       # Pesos do score de criticidade por cliente/loja
  AnomalyThreshold.cs   # Limites de Z-Score para cada nível de risco

Services/
  RulesService.cs       # Resolve qual regra se aplica a um contexto
  ToleranceEvaluator.cs # Avalia se um valor está dentro da tolerância

Providers/
  DatabaseRulesProvider.cs  # Carrega regras do banco
  DefaultRulesProvider.cs   # Regras padrão quando não há configuração
```

**Princípio:** Mudar o comportamento do sistema é uma mudança de configuração, não de código.

---

### Razarth.Analytics
**Camada:** Domain Service / Engine
**Responsabilidade:** Toda a inteligência analítica. Funções puras onde possível.

```
Statistics/
  StatisticsCalculator.cs   # Média, desvio, mediana, Q1, Q3, Z-Score, IQR

Comparison/
  TemporalComparator.cs     # mês × anterior, × média 3/6/12m, × ano anterior
  CrossStoreComparator.cs   # loja × loja para mesmo período/setor
  CrossSectorComparator.cs  # setor × setor

Trend/
  TrendAnalyzer.cs          # Regressão linear, direção, intensidade, duração

Ranking/
  RankingBuilder.cs         # Rankings por qualquer dimensão

Anomaly/
  AnomalyDetector.cs        # Detecção via Z-Score + IQR com evidências
  AnomalyClassifier.cs      # Classifica nível de risco

Score/
  CriticalityScorer.cs      # Score 0-100 com breakdown por fator
  ScoreBreakdown.cs         # Contribuição de cada fator ao score

Indicators/
  KpiCalculator.cs          # KPIs executivos calculados
  IndicatorFormatter.cs     # Formata KPIs para exibição
```

**Regra:** Razarth.Analytics não acessa o banco diretamente. Recebe dados já carregados.
**Regra:** Razarth.Analytics não referencia UI, DOM ou qualquer framework de apresentação.

---

### Razarth.Investigation
**Camada:** Domain Service / Engine
**Responsabilidade:** Gerar relatórios estruturados completos a partir de anomalias ou seleção manual.

```
Services/
  InvestigationGenerator.cs   # Orquestra a geração do relatório completo
  HypothesisEngine.cs         # Gera hipóteses prováveis com evidências
  ActionPlanBuilder.cs        # Monta plano de investigação passo a passo

Models/
  InvestigationReport.cs      # Relatório completo estruturado
  ExecutiveSummary.cs         # Resumo executivo
  Hypothesis.cs               # Hipótese com probabilidade e evidências
  ActionPlan.cs               # Plano de ação com passos e responsáveis
```

---

### Razarth.Knowledge
**Camada:** Domain Service / Engine
**Responsabilidade:** Memória institucional. A história da empresa mês a mês.

```
Services/
  CompetenceService.cs        # Gerencia uma competência completa
  EventService.cs             # Registra e consulta eventos operacionais
  DecisionService.cs          # Registra decisões e seus resultados

Models/
  CompetencePage.cs           # Página completa de uma competência
  OperationalEvent.cs         # Evento: o que, quando, quem, impacto
  Decision.cs                 # Decisão tomada + resultado posterior
  ActionPlanRecord.cs         # Plano registrado com acompanhamento
```

---

### Razarth.Application
**Camada:** Application (CQRS)
**Responsabilidade:** Casos de uso. Orquestra os Engines. Nunca contém lógica de negócio.

```
Commands/
  ImportLossXmlCommand.cs
  RegisterEventCommand.cs
  CloseCompetenceCommand.cs

Queries/
  GetAnalyticsReportQuery.cs
  GetAnomalyRadarQuery.cs
  GetInvestigationQuery.cs
  GetKnowledgePageQuery.cs

Handlers/           # Um handler por command/query
```

---

### Razarth.Api
**Camada:** Presentation / API
**Responsabilidade:** Expor a Application via HTTP REST. Autenticação, autorização, logging.

```
Controllers/
  AnalyticsController.cs
  InvestigationController.cs
  KnowledgeController.cs
  ImportController.cs
  ReportsController.cs

Middleware/
  AuditMiddleware.cs          # Log de todas as requisições
  ExceptionMiddleware.cs      # Tratamento global de erros

Auth/
  JwtService.cs
  PermissionHandler.cs
```

---

### Razarth.Data Engine (importação)
**Camada:** Infrastructure / Data Ingestion
**Responsabilidade:** Todo dado que entra no sistema passa aqui. Única porta de entrada.

```
Importers/
  XmlImporter.cs              # NF-e XML
  ExcelImporter.cs            # Planilhas históricas
  CsvImporter.cs              # Exportações de ERP

Validators/
  LossNoteValidator.cs
  ProductValidator.cs
  SectorValidator.cs

Normalizers/
  StoreNormalizer.cs          # "SUPERMERCADO SOL 3" → "SOL 3"
  SectorNormalizer.cs         # Variações → nome canônico
  ReasonNormalizer.cs

Pipeline/
  ImportPipeline.cs           # Orquestra: import → validate → normalize → persist
  ImportResult.cs             # Resultado com itens processados, erros e avisos
```

---

### Razarth.Web
**Camada:** Presentation / Frontend
**Responsabilidade:** Interface web. **Nunca calcula. Apenas exibe o que a API retorna.**

```
src/
  components/       # Componentes reutilizáveis
  pages/            # Páginas da aplicação
  services/         # Chamadas à API (fetch/axios)
  hooks/            # React hooks de dados
  types/            # TypeScript types espelhando os DTOs da API
  utils/            # Formatadores (moeda, data, percentual)
```

---

### Razarth.Desktop
**Camada:** Presentation / Desktop
**Responsabilidade:** Aplicação desktop para operações avançadas, importação em massa e administração.

Casos de uso exclusivos do Desktop:
- Importação em lote de XMLs de pastas locais.
- Administração de regras do Rules Engine.
- Auditoria técnica de importações.
- Operação offline com sincronização posterior.

---

## Fluxo principal de dados

```
1. ENTRADA
   XML / Excel / CSV
         │
         ▼
2. DATA ENGINE
   Importar → Validar → Normalizar → Versionar
         │
         ▼
3. BANCO (PostgreSQL)
   loss_notes · loss_items · historical_closing_entries
         │
         ▼
4. RAZARTH.DATA (Repository)
   Queries otimizadas → série temporal, cross-store
         │
         ▼
5. ANALYTICS ENGINE
   Statistics → Comparison → Trend → Anomaly → Score
         │
         ▼
6. RULES ENGINE
   Avaliar tolerâncias → Aplicar pesos configurados
         │
         ▼
7. INVESTIGATION ENGINE
   Anomalias → Hipóteses → Plano de ação → Dossiê
         │
         ▼
8. KNOWLEDGE ENGINE
   Persistir competência → Vincular eventos → Registrar decisões
         │
         ▼
9. APPLICATION LAYER
   Montar AnalyticsReport completo
         │
         ▼
10. API REST
    Serializar → Autenticar → Auditar → Responder
         │
         ▼
11. INTERFACE (Web ou Desktop)
    Exibir inteligência — nunca calcular
```

---

## Princípios arquiteturais

| Princípio | Aplicação |
|---|---|
| **Dependency Rule (DDD)** | Dependências sempre apontam para o centro (Domain) |
| **Single Responsibility** | Cada projeto tem uma e apenas uma razão para mudar |
| **Open/Closed** | Novo tipo de importação: novo Importer, sem alterar Pipeline |
| **Interface Segregation** | IAnalyticsEngine separado de IKnowledgeEngine |
| **Funções puras** | Statistics, Comparison e Trend: mesma entrada → mesma saída |
| **Sem banco na interface** | Web e Desktop nunca acessam PostgreSQL diretamente |
| **Sem lógica na API** | Controllers orquestram, não calculam |
| **Result<T> everywhere** | Nenhum Engine lança exceção para o caller |

---

## Stack tecnológica

| Componente | Tecnologia | Versão |
|---|---|---|
| Backend | .NET | 9 |
| API | ASP.NET Core | 9 |
| ORM | Entity Framework Core | 9 |
| Banco | PostgreSQL | 16+ |
| Banco (atual) | Supabase | hosted |
| Frontend Web | React + TypeScript + Vite | 19 / 5+ |
| Frontend Desktop | C# + Avalonia UI | latest |
| Testes | xUnit + FluentAssertions | latest |
| CI/CD | GitHub Actions | — |
| Containers | Docker + Docker Compose | — |
