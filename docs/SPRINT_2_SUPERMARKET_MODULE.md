# Sprint 2 — Primeiro Módulo: Razarth.Modules.Supermarket
## Transformando Intelligence em um módulo plugável

---

## 🎯 Objetivo Sprint 2

**Validar que a Platform funciona com um módulo real.**

A Sprint 1 construiu a casa. Sprint 2 coloca os móveis (primeiro módulo) e pinta as paredes (UI).

**Resultado esperado:** 
- Razarth.Modules.Supermarket rodando
- Dashboard de Supermercado funcional
- Análises reais do Supermercado Sol
- Prova de que um novo módulo (ex: Barbearia) pode ser adicionado sem tocar no Core

---

## 📁 Estrutura do Módulo

```
Razarth.Modules.Supermarket/
├── Razarth.Modules.Supermarket.Domain/
│   ├── Entities/
│   │   ├── Product.cs
│   │   ├── Store.cs
│   │   ├── Sector.cs
│   │   ├── Loss.cs
│   │   ├── OperationalEvent.cs
│   │   ├── Inventory.cs
│   │   ├── Analysis.cs
│   │   └── Score.cs
│   ├── ValueObjects/
│   │   ├── LossType.cs
│   │   ├── AlertLevel.cs
│   │   └── AnomalyCategory.cs
│   ├── Rules/
│   │   ├── AnomalyRules.cs
│   │   ├── ScoringRules.cs
│   │   └── ClosingRules.cs
│   └── DomainEvents/
│       ├── LossRecordedEvent.cs
│       ├── AnomalyDetectedEvent.cs
│       └── ClosingCompletedEvent.cs
│
├── Razarth.Modules.Supermarket.Application/
│   ├── Engines/
│   │   ├── Analytics/
│   │   │   ├── StatisticsEngine.cs
│   │   │   ├── ComparisonEngine.cs
│   │   │   ├── TrendEngine.cs
│   │   │   ├── RankingEngine.cs
│   │   │   ├── AnomalyEngine.cs
│   │   │   └── ScoringEngine.cs
│   │   ├── Knowledge/
│   │   │   ├── MemoryEngine.cs
│   │   │   ├── TimelineEngine.cs
│   │   │   └── EventProcessingEngine.cs
│   │   └── Investigation/
│   │       ├── HypothesisEngine.cs
│   │       ├── ActionPlanEngine.cs
│   │       └── ReportBuilder.cs
│   ├── UseCases/
│   │   ├── RecordLoss.cs
│   │   ├── ExecuteMonthlyClosing.cs
│   │   ├── AnalyzeAnomalies.cs
│   │   ├── GenerateReport.cs
│   │   └── CalculateScore.cs
│   ├── Services/
│   │   └── SupermarketAIContextProvider.cs
│   └── DTOs/
│       ├── LossDTO.cs
│       ├── AnalysisDTO.cs
│       └── ReportDTO.cs
│
├── Razarth.Modules.Supermarket.Infrastructure/
│   ├── Persistence/
│   │   ├── SupermarketDbContext.cs
│   │   ├── Repositories/
│   │   │   ├── LossRepository.cs
│   │   │   ├── ProductRepository.cs
│   │   │   └── StoreRepository.cs
│   │   └── Migrations/
│   │       ├── 20260115_InitialCreate.cs
│   │       └── 20260120_AddAnalysisTable.cs
│   └── ExternalServices/
│       └── SupermarketNotificationService.cs
│
├── Razarth.Modules.Supermarket.API/
│   ├── Controllers/
│   │   ├── LossesController.cs
│   │   ├── AnalyticsController.cs
│   │   ├── ClosingController.cs
│   │   ├── ReportsController.cs
│   │   └── ConfigurationController.cs
│   ├── Endpoints/
│   │   ├── LossEndpoints.cs
│   │   ├── AnalyticsEndpoints.cs
│   │   └── ConfigEndpoints.cs
│   └── SupermarketModuleRegister.cs ← Implementa IModule
│
├── Razarth.Modules.Supermarket.Web/
│   ├── Pages/
│   │   ├── Dashboard.tsx
│   │   ├── MonthlyClosing.tsx
│   │   ├── LossAnalysis.tsx
│   │   ├── Reports/
│   │   │   ├── ComparativeAnalysis.tsx
│   │   │   ├── TrendReport.tsx
│   │   │   └── AnomalyReport.tsx
│   │   └── Settings.tsx
│   ├── Components/
│   │   ├── LossCard.tsx
│   │   ├── ScoreGauge.tsx
│   │   ├── AnomalyAlert.tsx
│   │   ├── TrendChart.tsx
│   │   └── ClosingWizard.tsx
│   ├── Hooks/
│   │   ├── useSupermarketData.ts
│   │   └── useLosses.ts
│   ├── Services/
│   │   └── api/supermarketAPI.ts
│   └── Theme/
│       └── supermarket.theme.css
│
├── Razarth.Modules.Supermarket.Tests/
│   ├── Unit/
│   │   ├── EnginesTests/
│   │   │   ├── ScoringEngineTests.cs
│   │   │   ├── AnomalyEngineTests.cs
│   │   │   └── StatisticsEngineTests.cs
│   │   └── RulesTests/
│   │       ├── AnomalyRulesTests.cs
│   │       └── ScoringRulesTests.cs
│   ├── Integration/
│   │   ├── LossRecordingTests.cs
│   │   ├── ClosingTests.cs
│   │   └── AnalyticsAPITests.cs
│   └── Scenarios/
│       ├── PadariJulho2026.cs (cenário real)
│       ├── FLVMarco2025.cs (cenário histórico)
│       └── AcouguePicoVendas.cs (cenário de pico)
│
├── ModuleManifest.json
└── README.md
```

---

## 🔧 Tarefas Sprint 2

### 1️⃣ Estrutura do Módulo & IModule

**Tarefas:**
- [ ] Criar projeto `Razarth.Modules.Supermarket`
- [ ] Implementar `IModule`:
  ```csharp
  namespace Razarth.Modules.Supermarket.API;
  
  public class SupermarketModule : IModule
  {
      public string Name => "Supermarket";
      public string Version => "1.0.0";
      
      public void Register(IServiceCollection services, IConfiguration config)
      {
          // Registrar DbContext
          services.AddDbContext<SupermarketDbContext>();
          
          // Registrar Engines
          services.AddScoped<AnalyticsEngine>();
          services.AddScoped<KnowledgeEngine>();
          services.AddScoped<InvestigationEngine>();
          
          // Registrar Repositories
          services.AddScoped<ILossRepository, LossRepository>();
          services.AddScoped<IProductRepository, ProductRepository>();
          
          // Registrar Use Cases
          services.AddScoped<RecordLossUseCase>();
          services.AddScoped<ExecuteClosingUseCase>();
      }
      
      public void MapEndpoints(IEndpointRouteBuilder app)
      {
          LossEndpoints.Map(app);
          AnalyticsEndpoints.Map(app);
          ClosingEndpoints.Map(app);
      }
      
      public async Task<HealthCheckResult> CheckHealthAsync(Guid companyId)
      {
          // Check database, services
          return new HealthCheckResult { Status = HealthStatus.Healthy };
      }
  }
  ```

- [ ] Criar `ModuleManifest.json`:
  ```json
  {
    "id": "supermarket",
    "name": "Razarth Supermarket",
    "version": "1.0.0",
    "description": "Analytics engine for supermarket operations",
    "capabilities": {
      "entities": ["Loss", "Product", "Store", "Sector"],
      "engines": ["Analytics", "Knowledge", "Investigation"],
      "featureFlags": ["anomaly_detection", "monthly_closing", "comparative_analysis"]
    },
    "permissions": {
      "required": ["supermarket:read", "supermarket:write"]
    }
  }
  ```

**Critério de conclusão:**
- Módulo compilacompila
- Implementa `IModule` corretamente
- `ModuleManifest.json` válido

**Duração:** 1 dia

---

### 2️⃣ Domain Entities (DDD)

**Tarefas:**
- [ ] Criar entities com validações:
  ```csharp
  public class Product : AggregateRoot
  {
      public Guid CompanyId { get; set; }  // ← Multi-tenant
      public Guid StoreId { get; set; }
      public Guid SectorId { get; set; }
      
      public string Name { get; set; }
      public string Sku { get; set; }
      public decimal Price { get; set; }
      public int Quantity { get; set; }
      
      public static Result<Product> Create(
          Guid companyId, Guid storeId, Guid sectorId,
          string name, string sku, decimal price
      )
      {
          if (string.IsNullOrEmpty(name))
              return Result<Product>.Failure("Name required");
          if (price < 0)
              return Result<Product>.Failure("Price cannot be negative");
          
          return Result<Product>.Success(new Product
          {
              Id = Guid.NewGuid(),
              CompanyId = companyId,
              StoreId = storeId,
              SectorId = sectorId,
              Name = name,
              Sku = sku,
              Price = price
          });
      }
  }
  
  public class Loss : AggregateRoot
  {
      public Guid CompanyId { get; set; }  // ← Multi-tenant
      public Guid ProductId { get; set; }
      public Guid StoreId { get; set; }
      
      public DateTime Date { get; set; }
      public int Quantity { get; set; }
      public decimal Value { get; set; }
      public LossType Type { get; set; }  // Damage, Theft, Expiration, etc
      public string? Reason { get; set; }
      
      public Score? Score { get; set; }  // Criticidade
      public bool IsAnomaly { get; set; }
  }
  ```

- [ ] Value Objects:
  ```csharp
  public class LossType : ValueObject
  {
      public static LossType Damage = new("damage");
      public static LossType Theft = new("theft");
      public static LossType Expiration = new("expiration");
      public string Value { get; }
  }
  
  public class AlertLevel : ValueObject
  {
      public static AlertLevel Low = new(1);
      public static AlertLevel Medium = new(2);
      public static AlertLevel High = new(3);
      public static AlertLevel Critical = new(4);
      public int Value { get; }
  }
  ```

- [ ] Domain Events:
  ```csharp
  public class LossRecordedEvent : DomainEvent
  {
      public Guid ProductId { get; set; }
      public int Quantity { get; set; }
      public decimal Value { get; set; }
  }
  
  public class AnomalyDetectedEvent : DomainEvent
  {
      public Guid LossId { get; set; }
      public decimal Score { get; set; }
      public string Reason { get; set; }
  }
  ```

**Critério de conclusão:**
- Entities compilam
- Validações funcionam
- Domain Events definidos
- Testes unitários passam

**Duração:** 2-3 dias

---

### 3️⃣ Engines (Puras, Testáveis)

**Tarefas:**
- [ ] Analytics Engine:
  ```csharp
  public class ScoringEngine
  {
      // ← PURA: sem HTTP, sem banco, sem I/O
      public Score CalculateScore(
          Loss loss,
          IReadOnlyList<Loss> history,
          ScoringRules rules
      )
      {
          var factors = new Dictionary<string, decimal>
          {
              ["frequency"] = CalculateFrequency(loss, history, rules),
              ["value"] = CalculateValue(loss, rules),
              ["trend"] = CalculateTrend(loss, history, rules),
              ["pattern"] = CalculatePattern(loss, history, rules)
          };
          
          decimal score = factors.Values.Sum() / factors.Count;
          return new Score
          {
              Value = score,
              Factors = factors,
              AlgorithmVersion = 1,
              CalculatedAt = DateTime.UtcNow
          };
      }
  }
  ```

- [ ] Anomaly Engine:
  ```csharp
  public class AnomalyEngine
  {
      public AnomalyDetectionResult DetectAnomalies(
          List<MonthlyLoss> history,
          AnomalyRules rules
      )
      {
          var zScores = CalculateZScores(history);
          var anomalies = zScores
              .Where(z => Math.Abs(z) > rules.ZScoreThreshold)
              .ToList();
          
          return new AnomalyDetectionResult
          {
              AnomalousMonths = anomalies.Count,
              TotalAnalyzed = history.Count,
              Anomalies = anomalies.Select(a => new AnomalyInfo { ... }).ToList()
          };
      }
  }
  ```

- [ ] Comparison Engine, Trend Engine, etc (especificados em ANALYTICS_ENGINE.md)

**Critério de conclusão:**
- Engines compilam
- Engines não têm dependências de banco ou HTTP
- Unit tests para cada engine
- Coverage >85%

**Duração:** 4-5 dias

---

### 4️⃣ Rules Engine (Configuração)

**Tarefas:**
- [ ] Implementar Rules como configuração:
  ```csharp
  public class ScoringRules
  {
      public decimal FrequencyWeight { get; set; } = 0.3m;
      public decimal ValueWeight { get; set; } = 0.25m;
      public decimal TrendWeight { get; set; } = 0.25m;
      public decimal PatternWeight { get; set; } = 0.2m;
      
      public decimal CriticalityThreshold { get; set; } = 7.0m;
  }
  
  public class AnomalyRules
  {
      public decimal ZScoreThreshold { get; set; } = 2.5m;
      public int MinDataPoints { get; set; } = 6;
      public bool IgnoreOutliers { get; set; } = true;
  }
  ```

- [ ] Permitir override por company:
  ```csharp
  public interface IRulesService
  {
      Task<T> GetRulesAsync<T>(string ruleType, Guid companyId)
          where T : class;
      
      Task SetRulesAsync<T>(string ruleType, Guid companyId, T rules)
          where T : class;
  }
  ```

**Critério de conclusão:**
- Rules podem ser alteradas sem código
- Cada empresa pode ter rules diferentes
- Testes provam isolamento

**Duração:** 1-2 dias

---

### 5️⃣ API Endpoints

**Tarefas:**
- [ ] Criar controllers/endpoints:
  ```csharp
  [ApiController]
  [Route("api/modules/supermarket")]
  [Authorize]
  public class LossesController : ControllerBase
  {
      [HttpPost("losses")]
      public async Task<IActionResult> RecordLoss([FromBody] RecordLossRequest request)
      {
          var result = await _recordLossUseCase.ExecuteAsync(
              HttpContext.GetTenantId(),
              request
          );
          
          if (!result.IsSuccess)
              return BadRequest(result.Error);
          
          return Ok(result.Value);
      }
      
      [HttpGet("losses/month/{month}")]
      public async Task<IActionResult> GetMonthlyLosses(string month)
      {
          var losses = await _lossRepository.GetByMonthAsync(
              HttpContext.GetTenantId(),
              DateTime.Parse(month)
          );
          
          return Ok(losses);
      }
  }
  
  [ApiController]
  [Route("api/modules/supermarket")]
  [Authorize]
  public class AnalyticsController : ControllerBase
  {
      [HttpPost("analyze/anomalies")]
      public async Task<IActionResult> AnalyzeAnomalies([FromBody] AnalyzeRequest request)
      {
          var result = await _analyzeAnomaliesUseCase.ExecuteAsync(
              HttpContext.GetTenantId(),
              request
          );
          
          return Ok(result.Value);
      }
  }
  ```

- [ ] Use Cases para lógica:
  ```csharp
  public class RecordLossUseCase
  {
      public async Task<Result<LossDTO>> ExecuteAsync(Guid companyId, RecordLossRequest request)
      {
          var product = await _productRepo.GetByIdAsync(request.ProductId);
          if (product?.CompanyId != companyId)
              return Result<LossDTO>.Failure("Product not found");
          
          var loss = Loss.Create(companyId, request.ProductId, request.StoreId, ...);
          if (!loss.IsSuccess)
              return Result<LossDTO>.Failure(loss.Error);
          
          await _lossRepo.AddAsync(loss.Value);
          await _unitOfWork.SaveChangesAsync();
          
          return Result<LossDTO>.Success(_mapper.Map<LossDTO>(loss.Value));
      }
  }
  ```

**Critério de conclusão:**
- Endpoints compilam
- Testes de integração passam
- Autenticação/autorização funciona
- Multi-tenancy respeitada

**Duração:** 3-4 dias

---

### 6️⃣ Web UI (React 19)

**Tarefas:**
- [ ] Dashboard principal:
  ```tsx
  export function Dashboard() {
      const { company } = useContext(CompanyContext);
      const { data: losses } = useLosses(company.id);
      const { data: analysis } = useAnalytics(company.id);
      
      return (
          <div className="dashboard">
              <h1>{company.name}</h1>
              <div className="metrics">
                  <MetricCard 
                      label="Perdas este mês" 
                      value={`R$ ${losses.totalValue}`} 
                      trend={losses.trend}
                  />
                  <MetricCard 
                      label="Anomalias detectadas" 
                      value={analysis.anomalies.length}
                      level="warning"
                  />
              </div>
              <Charts losses={losses} analysis={analysis} />
          </div>
      );
  }
  ```

- [ ] Monthly Closing workflow
- [ ] Loss Analysis & Anomaly Alerts
- [ ] Comparative Reports
- [ ] Customizable dashboard

**Critério de conclusão:**
- UI compila sem erro
- API calls funcionam
- Charts mostram dados reais
- Responsivo (mobile, tablet, desktop)

**Duração:** 4-5 dias

---

### 7️⃣ Testes Supermarket

**Tarefas:**
- [ ] Unit tests (Engines):
  ```csharp
  [TestClass]
  public class ScoringEngineTests
  {
      [TestMethod]
      public void CalculateScore_WithHighFrequency_ReturnsHighScore()
      {
          // Arrange
          var loss = CreateTestLoss();
          var history = CreateHistoryWithHighFrequency();
          var rules = new ScoringRules();
          
          // Act
          var score = _engine.CalculateScore(loss, history, rules);
          
          // Assert
          Assert.IsTrue(score.Value > 7);
      }
  }
  ```

- [ ] Integration tests:
  ```csharp
  [TestClass]
  public class LossRecordingTests
  {
      [TestMethod]
      public async Task RecordLoss_WithValidData_PersistsAndAnalyzes()
      {
          var result = await _useCase.ExecuteAsync(_companyId, request);
          
          Assert.IsTrue(result.IsSuccess);
          Assert.IsNotNull(result.Value.Id);
          
          var persisted = await _repo.GetByIdAsync(result.Value.Id);
          Assert.IsNotNull(persisted);
      }
  }
  ```

- [ ] Scenarios (dados reais):
  ```csharp
  public class PadariJulho2026Scenario
  {
      // Dados reais: Padaria em julho 2026
      // Perdas esperadas, anomalias esperadas
      // Testes validam que análise dá resultado esperado
  }
  ```

**Critério de conclusão:**
- Coverage >85%
- Testes rodamrápido (<10s)
- Todos os caminhos testados

**Duração:** 2-3 dias

---

## ⏱️ Estimativa Total Sprint 2

| Tarefa | Dias |
|--------|------|
| 1. Module Structure | 1 |
| 2. Domain Entities | 2-3 |
| 3. Engines | 4-5 |
| 4. Rules | 1-2 |
| 5. API | 3-4 |
| 6. UI | 4-5 |
| 7. Tests | 2-3 |

**Sequência:**
1 → 2 → 3, depois 4-5-6 em paralelo, 7 contínuo.

**Duração:** 5-7 semanas (2-3 sprints)

---

## 🎯 Critério de Sucesso Sprint 2

- ✅ Razarth.Modules.Supermarket roda sem erro
- ✅ Dashboard mostra dados do Supermercado Sol
- ✅ Análises (anomalias, scores) funcionam
- ✅ Coverage >85%
- ✅ IModule implementada corretamente
- ✅ Multi-tenancy mantida
- ✅ Rules podem ser configuradas sem código

---

**Próximo:** Sprint 3 começa com Marketplace e IA Implementation
