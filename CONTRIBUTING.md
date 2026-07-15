# CONTRIBUTING.md — Guia de Desenvolvimento Razarth

> **Como contribuir para Razarth sem criar caos.**

---

## 🎯 Antes de Começar

Leia nesta ordem:
1. `docs/NORTH_STAR.md` — Sentença que define o projeto
2. `docs/CORE_ARCHITECTURE.md` — Estrutura geral
3. `docs/CORE_GUARDIAN.md` — Regras de PR

---

## 📁 Estrutura de Pastas

### Projeto .NET

```
Razarth.Domain/
├── Entities/
│   ├── Company.cs
│   ├── User.cs
│   └── ...
├── ValueObjects/
├── Exceptions/
│   └── DomainException.cs
├── Interfaces/
└── Events/
    └── IDomainEvent.cs

Razarth.Application/
├── Services/
│   ├── AuthService.cs
│   └── ...
├── UseCases/
├── DTOs/
└── Interfaces/

Razarth.Infrastructure/
├── Persistence/
│   ├── Contexts/
│   ├── Repositories/
│   └── Migrations/
├── ExternalServices/
└── Configuration/

Razarth.API/
├── Controllers/
├── Endpoints/
├── Middleware/
└── Program.cs

Razarth.Web/
├── src/
│   ├── pages/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── types/
├── public/
└── package.json

Razarth.Shared/
├── Result/
│   └── Result.cs
├── Errors/
├── Extensions/
└── Utilities/

Razarth.Tests/
├── Unit/
├── Integration/
└── Scenarios/

Razarth.Modules.Supermarket/
├── Domain/
├── Application/
├── Infrastructure/
├── API/
├── Web/
└── Tests/
```

---

## 🏗️ Como Criar um Novo Módulo

### 1. Scaffold

```bash
# Criar pastas
mkdir -p Razarth.Modules.{ModuleName}/{Domain,Application,Infrastructure,API,Web,Tests}

# Criar projects
dotnet new classlib -n Razarth.Modules.ModuleName.Domain -o Razarth.Modules.ModuleName/Domain
dotnet new classlib -n Razarth.Modules.ModuleName.Application -o Razarth.Modules.ModuleName/Application
# ...

# Adicionar à solução
dotnet sln add Razarth.Modules.ModuleName/Domain/Razarth.Modules.ModuleName.Domain.csproj
# ...
```

### 2. Implementar IModule

```csharp
namespace Razarth.Modules.ModuleName.API;

[RazarthModule("modulename")]
public class ModuleNameModule : IModule
{
    public string Name => "ModuleName";
    public string Version => "1.0.0";
    
    public void Register(IServiceCollection services, IConfiguration config)
    {
        // DI setup
    }
    
    public void MapEndpoints(IEndpointRouteBuilder app)
    {
        // Endpoint mapping
    }
}
```

### 3. Criar ModuleManifest.json

```json
{
  "id": "modulename",
  "name": "Razarth ModuleName",
  "version": "1.0.0",
  "capabilities": {
    "entities": ["Entity1", "Entity2"],
    "engines": ["Engine1"],
    "featureFlags": ["feature1"]
  }
}
```

---

## 🏷️ Convenções de Nomes

| Coisa | Convenção | Exemplo |
|-------|-----------|---------|
| Projeto | PascalCase | `Razarth.Modules.Supermarket.Domain` |
| Namespace | PascalCase, refletir pasta | `Razarth.Modules.Supermarket.Domain.Entities` |
| Classes | PascalCase | `Product`, `LossRecord` |
| Interfaces | I + PascalCase | `IRepository<T>`, `IAnalyticsEngine` |
| Métodos | PascalCase | `GetProductsAsync()` |
| Variáveis | camelCase | `productId`, `totalValue` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE`, `MAX_ATTEMPTS` |
| Arquivos | PascalCase.cs | `Product.cs`, `IRepository.cs` |
| Banco de dados | snake_case | `products`, `loss_records` |

---

## 🗄️ Migrations

### Criar Migration

```bash
cd Razarth.Infrastructure

dotnet ef migrations add InitialCreate \
  --startup-project ../Razarth.API

# Ou se módulo tem seu próprio DbContext
dotnet ef migrations add InitialCreate \
  --project Razarth.Modules.Supermarket.Infrastructure
```

### Nomeação de Migrations

```
20260115_InitialCreate.cs
20260120_AddAnalysisTable.cs
20260125_AddTenantContext.cs
```

**Padrão:** `YYYYMMDD_DescritiveAction.cs`

### Migrations nunca deletam dados

```csharp
// ❌ ERRADO
protected override void Down(MigrationBuilder mb)
{
    mb.DropTable("products");  // Nunca drop em produção!
}

// ✅ CERTO
// Migrations têm Up, Down é documentado mas não automático
```

---

## ✍️ Teste: Convenções & Structure

### Unit Tests

```csharp
[TestClass]
public class ScoringEngineTests
{
    private ScoringEngine _engine;
    
    [TestInitialize]
    public void Setup()
    {
        _engine = new ScoringEngine();
    }
    
    [TestMethod]
    public void CalculateScore_WithValidData_ReturnsScore()
    {
        // Arrange
        var loss = CreateTestLoss();
        var history = CreateTestHistory();
        
        // Act
        var result = _engine.CalculateScore(loss, history);
        
        // Assert
        Assert.IsNotNull(result);
        Assert.IsTrue(result.Value > 0);
    }
}
```

### Nomes de Test

```
{Method}_{Scenario}_{Expected}

CalculateScore_WithValidData_ReturnsScore
CalculateScore_WithNullLoss_ThrowsException
```

### Coverage

- Target: >85% para código crítico
- Commandline: `dotnet test /p:CollectCoverage=true`

---

## 📝 Convenção de Código

### Result<T> Pattern

```csharp
// ✅ Sempre retornar Result<T>, nunca throw
public Result<Product> Create(string name, decimal price)
{
    if (string.IsNullOrEmpty(name))
        return Result<Product>.Failure("Name required");
    
    if (price < 0)
        return Result<Product>.Failure("Price must be positive");
    
    return Result<Product>.Success(new Product { Name = name, Price = price });
}
```

### Dependency Injection

```csharp
// ✅ Sempre injetar dependências
public class ProductService
{
    private readonly IProductRepository _repo;
    
    public ProductService(IProductRepository repo)
    {
        _repo = repo;
    }
}

// ❌ Nunca usar new
public class ProductService
{
    private readonly IProductRepository _repo = new ProductRepository();  // ❌
}
```

### Async/Await

```csharp
// ✅ Sempre async para I/O
public async Task<Product> GetProductAsync(Guid id)
{
    return await _repo.GetByIdAsync(id);
}

// ❌ Nunca .Result ou .Wait()
public Product GetProduct(Guid id)
{
    return _repo.GetByIdAsync(id).Result;  // ❌ Causa deadlock
}
```

### Exception Handling

```csharp
// ✅ Catch específico
try
{
    await _db.SaveChangesAsync();
}
catch (DbUpdateException ex)
{
    _logger.Error("Database error", ex);
    return Result<T>.Failure("Database operation failed");
}

// ❌ Nunca catch genérico
catch (Exception ex)  // ❌ Muito genérico
```

---

## 🔌 Como Registrar Serviços

### No Core

```csharp
// Program.cs
services.AddScoped<IAuthService, AuthService>();
services.AddScoped<ITenantResolver, HttpContextTenantResolver>();
services.AddScoped<IFileUploadService, SupabaseFileUploadService>();
```

### Em um Módulo

```csharp
public class SupermarketModule : IModule
{
    public void Register(IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<SupermarketDbContext>();
        services.AddScoped<ILossRepository, LossRepository>();
        services.AddScoped<AnalyticsEngine>();
        services.AddScoped<IAnalyticsProvider, SupermarketAnalyticsProvider>();
    }
}
```

---

## 🌐 Como Criar Endpoints

### Usar Minimal APIs (não Controllers)

```csharp
namespace Razarth.Modules.Supermarket.API;

public static class LossEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/modules/supermarket/losses")
            .WithName("Losses")
            .WithOpenApi();
        
        group.MapPost("", CreateLoss)
            .WithName("Create Loss")
            .WithOpenApi();
        
        group.MapGet("{id:guid}", GetLoss)
            .WithName("Get Loss")
            .WithOpenApi();
    }
    
    private static async Task<IResult> CreateLoss(
        CreateLossRequest request,
        ILossService service,
        HttpContext context
    )
    {
        var companyId = context.GetTenantId();
        var result = await service.CreateLossAsync(companyId, request);
        
        return result.IsSuccess
            ? Results.Ok(result.Value)
            : Results.BadRequest(result.Error);
    }
    
    private static async Task<IResult> GetLoss(
        Guid id,
        ILossRepository repo,
        HttpContext context
    )
    {
        var companyId = context.GetTenantId();
        var loss = await repo.GetByIdAsync(id);
        
        return loss?.CompanyId == companyId
            ? Results.Ok(loss)
            : Results.NotFound();
    }
}
```

### Registrar Endpoints em Módulo

```csharp
public void MapEndpoints(IEndpointRouteBuilder app)
{
    LossEndpoints.Map(app);
    AnalyticsEndpoints.Map(app);
    ClosingEndpoints.Map(app);
}
```

---

## 📋 Checklist Antes de PR

- [ ] Código compila sem warnings
- [ ] Testes passam
- [ ] Coverage >85%
- [ ] Migrations executam sem erro
- [ ] Nenhuma mudança quebra IModule
- [ ] Alignado com NORTH_STAR.md
- [ ] Alignado com CORE_GUARDIAN.md
- [ ] Commits com mensagens descritivas
- [ ] Sem código comentado ou debug
- [ ] Documentação atualizada

---

## 🔐 Quando Está Pronto?

Uma PR está pronta para review quando:

1. ✅ Toda checklist passou
2. ✅ Não quebra nenhum teste existente
3. ✅ Segue convenções do projeto
4. ✅ Tem descrição clara do que faz
5. ✅ Referencia issue relacionada (ex: #123)

---

## ❓ Perguntas Frequentes

### P: Posso usar padrão X que não está aqui?
**R:** Abre uma discussão no projeto. Se fizer sentido e não quebra norte star, adiciona à convenção.

### P: E se não souber se minha mudança respeita CORE_GUARDIAN?
**R:** Abre PR como Draft, comenta que quer feedback sobre arquitetura, e espera review de Tech Lead.

### P: Como descubro se meu endpoint está correto?
**R:** Build local, teste manual com Postman/curl, valida que multi-tenancy funciona (CompanyA não vê dados de CompanyB).

### P: Posso usar async/await em tudo?
**R:** Para I/O sim. Para CPU-bound, talvez seja overkill. Quando em dúvida, pergunta.

---

**Bem-vindo ao projeto. Siga essas convenções e o projeto cresce limpo.**
