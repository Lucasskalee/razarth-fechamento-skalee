# Sistema de Módulos — Razarth Platform

> **Como desenvolver, registrar, ativar e desativar módulos na Razarth Platform.**

---

## O que é um Módulo?

Um módulo é uma **unidade de negócio independente** que adiciona capacidades à plataforma.

**Exemplos:**
- 📦 Supermarket (Analytics, Investigação, Previsão)
- 💈 Barbershop (Agenda, Descrição IA, Marketing)
- 🍔 Food (Delivery, Cardápio, Pedidos)
- 🏥 Clinic (Prontuários, Agenda, Pacientes)

**O que cada módulo traz:**
- Entidades de domínio próprias
- Engines especializadas
- Rules específicas
- Endpoints de API
- Interface (UI/Dashboard)
- KPIs nativos
- Observabilidade

---

## Anatomia de um Módulo

```
Razarth.Modules.Supermarket/
├── Domain/
│   ├── Loss.cs
│   ├── OperationalEvent.cs
│   ├── Store.cs
│   ├── Sector.cs
│   └── Product.cs
├── Engines/
│   ├── Analytics/
│   │   ├── Statistics.cs
│   │   ├── Comparison.cs
│   │   ├── Trend.cs
│   │   └── Anomaly.cs
│   ├── Knowledge/
│   │   ├── Memory.cs
│   │   └── Timeline.cs
│   └── Investigation/
│       ├── ReportBuilder.cs
│       └── Hypothesis.cs
├── Rules/
│   ├── AnomalyRules.cs
│   ├── ScoringRules.cs
│   └── ClosingRules.cs
├── Data/
│   ├── LossRepository.cs
│   ├── EventRepository.cs
│   └── SupermarketDbContext.cs
├── API/
│   ├── AnalyticsController.cs
│   ├── InvestigationController.cs
│   └── ConfigurationController.cs
├── Web/
│   ├── Pages/
│   │   ├── Dashboard.tsx
│   │   ├── Monthly Closing.tsx
│   │   └── Reports.tsx
│   └── Components/
│       ├── LossCard.tsx
│       └── ScoreGauge.tsx
├── Tests/
│   ├── AnalyticsEngineTests.cs
│   └── ScoringTests.cs
└── ModuleManifest.json
```

---

## ModuleManifest.json

Cada módulo declara o que oferece:

```json
{
  "id": "supermarket",
  "name": "Razarth Supermarket",
  "version": "1.0.0",
  "description": "Analytics engine for supermarket operations",
  "author": "Razarth Team",
  "
  "capabilities": {
    "engines": ["Analytics", "Knowledge", "Investigation"],
    "entities": ["Loss", "OperationalEvent", "Product", "Store", "Sector"],
    "rules": ["AnomalyDetection", "Scoring", "Closing"],
    "apiEndpoints": ["/api/modules/supermarket/analytics", "/api/modules/supermarket/investigation"],
    "webPages": ["/supermarket/dashboard", "/supermarket/closing", "/supermarket/reports"],
    "featureFlags": ["monthly_closing", "anomaly_alerts", "comparative_analysis"]
  },
  "permissions": {
    "required": ["view_company", "manage_company"],
    "can_grant": ["supermarket:read", "supermarket:write", "supermarket:admin"]
  },
  "dependencies": {
    "platform": ">=1.0.0",
    "modules": []
  },
  "scalable": true,
  "multiTenant": true,
  "maturityLevel": "GA",
  "pricing": {
    "model": "per_company",
    "tier": "standard",
    "monthlyPrice": 99.99
  }
}
```

---

## Ciclo de Vida do Módulo

### 1. Desenvolvimento

**Onde:** Projeto separado `Razarth.Modules.{ModuleName}`

**Requisitos:**
- [ ] ModuleManifest.json no raiz
- [ ] Documentação de entidades (Entity.md)
- [ ] Testes unitários (>85% coverage)
- [ ] Migrations EF Core versionadas
- [ ] Exemplo de uso/tutorial
- [ ] API documentation (Swagger)

**Estrutura de Package:**
```
NuGet package: Razarth.Modules.Supermarket
└── version: semver (1.0.0, 1.1.0, etc.)
```

### 2. Registro

Módulo é registrado no marketplace (publicado em NuGet ou privado):

```csharp
// Platform Core descobre módulos
var modules = await moduleRegistry.DiscoverModulesAsync();
// [
//   { id: "supermarket", version: "1.0.0", status: "ready" },
//   { id: "barbershop", version: "1.0.0", status: "available" }
// ]
```

### 3. Ativação

Cliente escolhe módulos via dashboard:

```
Razarth Admin
└── Empresa: Supermercado Sol
    └── Módulos disponíveis
        ✅ Supermarket (instalado)
        ❌ Barbershop (disponível)
        ❌ Food (em breve)
```

Quando ativado:
1. Platform carrega biblioteca do módulo
2. Executa migrations EF Core específicas
3. Cria registros em `company_modules`
4. Ativa feature flags do módulo
5. Pronta a interface (web routes)

### 4. Desativação

Quando cliente desativa módulo:
1. Dados histéricos permanecem (auditoria)
2. Novas operações são bloqueadas
3. Feature flags desativadas
4. Interface fica indisponível

### 5. Atualização

Nova versão do módulo:
1. Publica no NuGet
2. Platform notifica admin de updates
3. Pode fazer "canary" (ativar para 10% dos usuários)
4. Migrations aplicadas automaticamente
5. Algoritmos versionados rastreiam mudanças

---

## Exemplo: Criando um Novo Módulo

### Passo 1: Scaffold

```bash
dotnet new classlib -n Razarth.Modules.Barbershop
cd Razarth.Modules.Barbershop
```

### Passo 2: Adicionar dependências

```bash
dotnet add package Razarth.Shared --version 1.0.0
dotnet add package Microsoft.EntityFrameworkCore --version 9.0.0
```

### Passo 3: Criar ModuleManifest

```json
{
  "id": "barbershop",
  "name": "Razarth Barbershop",
  "version": "1.0.0",
  "capabilities": {
    "engines": ["Scheduling", "DescriptionAI", "Marketing"],
    "entities": ["Appointment", "Service", "Barber", "Client"],
    "rules": ["SchedulingRules", "PricingRules"]
  }
}
```

### Passo 4: Implementar IRazarthModule

```csharp
using Razarth.Platform.Module;

[RazarthModule("barbershop")]
public class BarbershopModule : IRazarthModule
{
    public ModuleInfo GetInfo() => new()
    {
        Id = "barbershop",
        Name = "Razarth Barbershop",
        Version = "1.0.0",
        Description = "Scheduling and operations for barbershops"
    };

    public ModuleCapabilities GetCapabilities() => new()
    {
        Entities = new[] 
        { 
            typeof(Appointment), 
            typeof(Service),
            typeof(Barber)
        },
        Rules = new[] 
        { 
            typeof(SchedulingRules), 
            typeof(PricingRules)
        },
        FeatureFlags = new[] 
        { 
            "appointments", 
            "ai_descriptions", 
            "marketing_automation"
        }
    };

    public void ConfigureServices(IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<BarbershopDbContext>();
        services.AddScoped<ISchedulingEngine, SchedulingEngine>();
        services.AddScoped<IMarketingEngine, MarketingEngine>();
    }

    public void ConfigureEndpoints(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/modules/barbershop/appointments", CreateAppointment);
        app.MapGet("/api/modules/barbershop/schedule", GetSchedule);
    }

    public IAsyncEnumerable<Migration> GetMigrations() => 
        MigrationProvider.GetMigrationsAsync();
}
```

### Passo 5: Domain & Entities

```csharp
namespace Razarth.Modules.Barbershop.Domain;

public class Appointment : IAggregateRoot
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }  // ← Multi-tenant
    
    public Guid ClientId { get; set; }
    public Guid BarberId { get; set; }
    public Guid ServiceId { get; set; }
    
    public DateTime ScheduledFor { get; set; }
    public TimeSpan Duration { get; set; }
    public decimal Price { get; set; }
    
    public AppointmentStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public static Result<Appointment> Create(
        Guid companyId, 
        Guid clientId, 
        Guid barberoid, 
        Guid serviceId,
        DateTime scheduledFor,
        BarbershopRules rules
    )
    {
        if (companyId == Guid.Empty)
            return Result<Appointment>.Failure("Company ID required");
            
        if (scheduledFor < DateTime.UtcNow)
            return Result<Appointment>.Failure("Cannot schedule in the past");
            
        if (!rules.IsAvailable(barberId, scheduledFor))
            return Result<Appointment>.Failure("Barber not available at that time");
        
        return Result<Appointment>.Success(new()
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            ClientId = clientId,
            BarberId = barberId,
            ServiceId = serviceId,
            ScheduledFor = scheduledFor,
            Status = AppointmentStatus.Scheduled,
            CreatedAt = DateTime.UtcNow
        });
    }
}

public enum AppointmentStatus
{
    Scheduled,
    InProgress,
    Completed,
    Cancelled,
    NoShow
}
```

### Passo 6: Engine (Pure Library)

```csharp
namespace Razarth.Modules.Barbershop.Engines;

public class SchedulingEngine
{
    public Result<IReadOnlyList<TimeSlot>> GetAvailableSlots(
        Guid barberId,
        DateTime date,
        TimeSpan serviceDuration,
        IReadOnlyList<Appointment> existingAppointments,
        BarbershopRules rules
    )
    {
        var slots = new List<TimeSlot>();
        
        var businessHours = rules.GetBusinessHours(date.DayOfWeek);
        if (!businessHours.HasValue)
            return Result<IReadOnlyList<TimeSlot>>.Failure("Closed on this day");
        
        var current = businessHours.Value.Start;
        
        while (current.Add(serviceDuration) <= businessHours.Value.End)
        {
            var isAvailable = !existingAppointments.Any(a =>
                a.BarberId == barberId &&
                a.ScheduledFor.Date == date &&
                a.ScheduledFor.TimeOfDay < current.Add(serviceDuration) &&
                current < a.ScheduledFor.TimeOfDay.Add(a.Duration)
            );
            
            if (isAvailable)
                slots.Add(new TimeSlot(current, current.Add(serviceDuration)));
            
            current = current.AddMinutes(15);  // 15-min intervals
        }
        
        return Result<IReadOnlyList<TimeSlot>>.Success(slots.AsReadOnly());
    }
}
```

### Passo 7: Testes

```csharp
[TestClass]
public class SchedulingEngineTests
{
    [TestMethod]
    public void GetAvailableSlots_WithNoConflicts_ReturnsFull Schedule()
    {
        // Arrange
        var engine = new SchedulingEngine();
        var barberId = Guid.NewGuid();
        var date = DateTime.UtcNow.AddDays(1);
        var rules = new BarbershopRules
        {
            BusinessHours = new Dictionary<DayOfWeek, (TimeSpan Start, TimeSpan End)>
            {
                { date.DayOfWeek, (new(9, 0, 0), new(17, 0, 0)) }
            }
        };
        
        // Act
        var result = engine.GetAvailableSlots(
            barberId, 
            date, 
            TimeSpan.FromMinutes(30), 
            new List<Appointment>(), 
            rules
        );
        
        // Assert
        Assert.IsTrue(result.IsSuccess);
        Assert.IsTrue(result.Value.Count > 0);
    }
}
```

### Passo 8: Publicar

```bash
dotnet pack -c Release
dotnet nuget push bin/Release/Razarth.Modules.Barbershop.1.0.0.nupkg \
  -s https://api.nuget.org/v3/index.json
```

---

## Interface de Descoberta (Platform Core)

```csharp
public interface IRazarthModule
{
    ModuleInfo GetInfo();
    ModuleCapabilities GetCapabilities();
    void ConfigureServices(IServiceCollection services, IConfiguration config);
    void ConfigureEndpoints(IEndpointRouteBuilder app);
    IAsyncEnumerable<Migration> GetMigrations();
    Task<HealthCheckResult> CheckHealthAsync(Guid companyId);
}

public class ModuleCapabilities
{
    public Type[] Entities { get; set; }
    public Type[] Rules { get; set; }
    public Type[] Engines { get; set; }
    public string[] FeatureFlags { get; set; }
    public string[] ApiEndpoints { get; set; }
    public string[] WebPages { get; set; }
}
```

---

## Ativação de Módulo no Admin

Quando cliente ativa um módulo:

```sql
INSERT INTO company_modules (id, company_id, module_id, activated_at, configuration)
VALUES (
    uuid_generate_v4(),
    '550e8400-e29b-41d4-a716-446655440000',  -- Supermercado Sol
    'barbershop',                              -- Módulo
    NOW(),
    '{"businessHours": {"monday": ["08:00", "18:00"]}}'
);

-- Feature flags ativadas
INSERT INTO feature_flags (company_id, flag_name, enabled)
SELECT 
    '550e8400-e29b-41d4-a716-446655440000',
    unnest(ARRAY['barbershop:appointments', 'barbershop:ai_descriptions', 'barbershop:marketing']),
    true;

-- Migrations rodadas
-- EF Core detecta entidades do módulo e aplica migrations
```

---

## Integração com IA

Cada módulo pode providenciar prompts especializados:

```csharp
public class BarbershopAIContext : IAIModuleContext
{
    public string GetSystemPrompt(string task) => task switch
    {
        "describe_service" => @"
            You are a barbershop marketing expert.
            Create engaging, professional descriptions for barbershop services.
            Be specific about benefits, not just features.
            Language: Portuguese (Brazil)
        ",
        "schedule_assistant" => @"
            You are a helpful barbershop scheduling assistant.
            Help clients find appointment times and explain the process.
        ",
        _ => throw new NotSupportedException()
    };
    
    public IReadOnlyList<ChatMessage> GetExamples(string task) => task switch
    {
        "describe_service" => new[]
        {
            new ChatMessage("user", "Corte degradê, 35"),
            new ChatMessage("assistant", "Corte Degradê Moderno — R$35...")
        },
        _ => Array.Empty<ChatMessage>()
    };
}
```

---

## Maturity Levels de Módulo

| Level | Criteria | Audience |
|-------|----------|----------|
| **Alpha** | Feature-complete, known bugs, minimal docs | Internal |
| **Beta** | Stable API, comprehensive docs, <10% production use | Early adopters |
| **GA** | Proven, SLA support, monitored | Everyone |
| **Deprecated** | Superseded, support window closing | Existing users |
| **EOL** | Support ended | None |

---

## Marketplace Razarth

**Futuro: Loja de módulos**

```
Razarth Marketplace
├── Supermarket (Instalado)
│   └── v1.0.0 (Última)
│       └── Atualizar
├── Barbershop (Disponível)
│   ├── Avaliação: 4.8/5
│   ├── Instalações: 234
│   ├── Preço: R$99/mês
│   └── [Instalar]
├── Food Delivery (Disponível em breve)
└── Clinic (Roadmap)
```

---

## Convenção de Nomes

- **Package:** `Razarth.Modules.{PascalCase}`
- **Namespace:** `Razarth.Modules.{PascalCase}`
- **Entity:** `{SingularNoun}.cs`
- **Engine:** `{Capability}Engine.cs`
- **Repository:** `{Entity}Repository.cs`
- **DbContext:** `{ModuleName}DbContext.cs`
- **Controller:** `{Feature}Controller.cs`
- **Integration Tests:** `{Feature}IntegrationTests.cs`

---

## Checklist: Novo Módulo

- [ ] Scaffold projeto
- [ ] ModuleManifest.json criado e validado
- [ ] IRazarthModule implementada
- [ ] Domain entities com Company ID
- [ ] Engines como bibliotecas puras
- [ ] Rules Engine para configuração
- [ ] Data layer com DbContext
- [ ] EF Core migrations
- [ ] API endpoints (Swagger)
- [ ] Integration tests (>85% coverage)
- [ ] Unit tests para engines
- [ ] Documentação entidades
- [ ] Exemplo de uso
- [ ] Health checks
- [ ] Observability (logging, tracing)
- [ ] Publicado no NuGet (ou privado)
