# Sprint 1 — Fundação da Plataforma
## Casa Primeiro, Depois as Cortinas

> **Este é o documento que guia Sprint 1. A ordem aqui importa.**

---

## 🏗️ Filosofia

**Dashboard é vitrine. Core é a casa.**

Muitos projetos falham porque começam pelo bonito (dashboards, relatórios) antes de ter fundação sólida. Resultado: interface linda com arquitetura que "implora por misericórdia".

**Sprint 1 constrói a casa primeiro.**
- Estrutura limpa
- Multi-tenância desde dia 1 (sem retrofit)
- Banco de dados seguro
- Autenticação robusta
- Pontos de extensão (Module SDK)

**Sprint 2 coloca os móveis e pinta as paredes** (Primeiro módulo).

---

## 📋 Sequência de Tarefas Sprint 1

### 1️⃣ Core — Estrutura da Solução

**Objetivo:** Criar a base limpa para tudo mais.

**Tarefas:**
- [ ] `dotnet new sln -n Razarth` em repositório vazio
- [ ] Criar projetos base com Clean Architecture:
  ```
  Razarth/
  ├── Razarth.Domain/
  ├── Razarth.Application/
  ├── Razarth.Infrastructure/
  ├── Razarth.API/
  ├── Razarth.Web/
  ├── Razarth.Shared/
  ├── Razarth.Tests/
  └── Razarth.Modules/
  ```
- [ ] Configurar Dependency Injection central (`Program.cs`)
- [ ] Estrutura de pastas dentro de cada projeto
- [ ] Global using statements
- [ ] .editorconfig e padrões de código

**Critério de conclusão:** `dotnet build` sem erro; testes vazios rodando.

**Duração:** 2-3 dias

**Checkpoints:**
- ✅ Solução compila
- ✅ DI container funciona
- ✅ Estrutura de testes pronta

---

### 2️⃣ Multi-tenancy — Fundação de Dados

**Objetivo:** Garantir que nenhum cliente pode acessar dados de outro.

**Tarefas:**
- [ ] Criar entidades no Domain:
  ```csharp
  public class Company : AggregateRoot
  {
      public Guid Id { get; set; }
      public string Name { get; set; }
      public string Slug { get; set; }  // barbearia-prime
      public string Domain { get; set; }  // barbearia-prime.razarth.com
      public bool IsActive { get; set; }
      public DateTime CreatedAt { get; set; }
  }
  
  public class User : AggregateRoot
  {
      public Guid Id { get; set; }
      public string Email { get; set; }
      public string PasswordHash { get; set; }
      public bool EmailConfirmed { get; set; }
      public DateTime CreatedAt { get; set; }
  }
  
  public class CompanyMember
  {
      public Guid CompanyId { get; set; }
      public Guid UserId { get; set; }
      public Role Role { get; set; }  // Owner, Admin, Member, Guest
      public DateTime AddedAt { get; set; }
  }
  
  public class Role : ValueObject
  {
      public static Role Owner = new("owner");
      public static Role Admin = new("admin");
      public static Role Member = new("member");
      public static Role Guest = new("guest");
      
      public string Value { get; }
      public IReadOnlyList<Permission> Permissions { get; }
  }
  ```

- [ ] TenantResolver (`ITenantResolver`):
  ```csharp
  public interface ITenantResolver
  {
      Guid? GetTenantId();  // Do HTTP header, JWT claim, etc
      string? GetTenantSlug();
  }
  ```

- [ ] Validação de acesso no middleware:
  ```csharp
  app.UseMiddleware<TenantMiddleware>();
  ```

**Critério de conclusão:** 
- Domain entities criadas e testadas
- TenantResolver injeta tenant context em qualquer serviço
- Testes provam isolamento (CompanyA não vê dados de CompanyB)

**Duração:** 3-4 dias

---

### 3️⃣ Data Layer — EF Core + Supabase

**Objetivo:** Banco seguro, auditado, versioned.

**Tarefas:**
- [ ] Criar `RazarthDbContext`:
  ```csharp
  public class RazarthDbContext : DbContext
  {
      private readonly ITenantResolver _tenantResolver;
      
      public RazarthDbContext(
          DbContextOptions options,
          ITenantResolver tenantResolver
      ) : base(options)
      {
          _tenantResolver = tenantResolver;
      }
      
      // Entities
      public DbSet<Company> Companies { get; set; }
      public DbSet<User> Users { get; set; }
      public DbSet<CompanyMember> CompanyMembers { get; set; }
      
      protected override void OnModelCreating(ModelBuilder builder)
      {
          // Global filter: sempre filtrar por tenant
          builder.Entity<Company>()
              .HasQueryFilter(c => c.Id == _tenantResolver.GetTenantId());
      }
  }
  ```

- [ ] Migrations com Supabase:
  ```bash
  dotnet ef migrations add InitialCreate
  dotnet ef database update
  ```

- [ ] Soft delete:
  ```csharp
  public abstract class AggregateRoot
  {
      public DateTime? DeletedAt { get; set; }
      public bool IsDeleted => DeletedAt.HasValue;
  }
  ```

- [ ] Auditoria:
  ```csharp
  public abstract class AuditedEntity
  {
      public DateTime CreatedAt { get; set; }
      public Guid? CreatedBy { get; set; }
      public DateTime UpdatedAt { get; set; }
      public Guid? UpdatedBy { get; set; }
  }
  ```

- [ ] Repository pattern (se necessário):
  ```csharp
  public interface IRepository<T> where T : AggregateRoot
  {
      Task<T?> GetByIdAsync(Guid id);
      Task AddAsync(T entity);
      Task UpdateAsync(T entity);
      Task DeleteAsync(T entity);
  }
  ```

**Critério de conclusão:**
- Supabase conectado e testado
- Migrations rodam sem erro
- Tenant filtering automático em queries
- Auditoria registra quem fez o quê quando

**Duração:** 4-5 dias

---

### 4️⃣ Autenticação & RBAC

**Objetivo:** Segurança em todo acesso.

**Tarefas:**
- [ ] JWT infrastructure:
  ```csharp
  public class JwtTokenGenerator
  {
      public string GenerateAccessToken(User user, IReadOnlyList<Role> roles)
      {
          var claims = new List<Claim>
          {
              new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
              new Claim(ClaimTypes.Email, user.Email),
              new Claim("tenant_id", _tenantResolver.GetTenantId().ToString()),
              new Claim(ClaimTypes.Role, role.Value)
          };
          
          // Sign and return token
      }
      
      public string GenerateRefreshToken() { ... }
  }
  ```

- [ ] Authentication handler:
  ```csharp
  services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
      .AddJwtBearer(options =>
      {
          options.Authority = config["Auth:Authority"];
          options.Audience = config["Auth:Audience"];
      });
  ```

- [ ] Authorization policies:
  ```csharp
  services.AddAuthorizationBuilder()
      .AddPolicy("CompanyOwnerOnly", policy =>
          policy.RequireRole("owner"))
      .AddPolicy("CanManageModules", policy =>
          policy.RequireRole("owner", "admin"));
  ```

- [ ] Refresh token flow:
  ```csharp
  [HttpPost("refresh")]
  public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
  {
      var newAccessToken = await _authService.RefreshTokenAsync(request.RefreshToken);
      return Ok(new { access_token = newAccessToken });
  }
  ```

**Critério de conclusão:**
- Login/Logout funciona
- JWT validado em toda requisição
- Roles e permissions aplicadas
- Refresh token renova sem logout
- Testes de segurança: CompanyA não acessa CompanyB mesmo com token válido

**Duração:** 3-4 dias

---

### 5️⃣ Core Services Compartilhados

**Objetivo:** Infraestrutura comum para todos os módulos.

**Tarefas:**
- [ ] Configuration service:
  ```csharp
  public interface IConfigurationService
  {
      T Get<T>(string key);
      Task SetAsync(string key, object value, Guid? companyId = null);
  }
  ```

- [ ] File Upload (com suporte a Supabase Storage):
  ```csharp
  public interface IFileUploadService
  {
      Task<string> UploadAsync(Stream stream, string filename, Guid companyId);
      Task DeleteAsync(string fileUrl, Guid companyId);
  }
  ```

- [ ] Structured Logging (Serilog):
  ```csharp
  Log.ForContext("TenantId", tenantId)
     .Information("Módulo ativado: {ModuleName}", moduleName);
  ```

- [ ] Notifications (email, SMS, push — framework apenas):
  ```csharp
  public interface INotificationService
  {
      Task SendEmailAsync(string to, string subject, string body);
      Task SendSmsAsync(string phoneNumber, string message);
  }
  ```

- [ ] Domain Events:
  ```csharp
  public abstract class DomainEvent
  {
      public Guid AggregateId { get; set; }
      public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
      public Guid CompanyId { get; set; }
  }
  
  public class UserCreatedEvent : DomainEvent { ... }
  ```

**Critério de conclusão:**
- Config service pronto
- Upload de arquivo funciona com Supabase
- Logs estruturados com tenant context
- Domain events infrastructure pronta
- Testes para cada serviço

**Duração:** 2-3 dias

---

### 6️⃣ IA Interface (Agnóstica)

**Objetivo:** Contrato que permite trocar IA depois sem quebrar nada.

**Tarefas:**
- [ ] Criar interface:
  ```csharp
  public interface IAIAssistant
  {
      Task<AIResponse> AskAsync(AIRequest request);
  }
  
  public record AIRequest(
      string Message,
      Guid CompanyId,
      string? ModuleContext = null,
      string? SystemPrompt = null
  );
  
  public record AIResponse(
      string Message,
      string Model,
      int TokensUsed,
      string? Error = null
  );
  ```

- [ ] Registrar em DI:
  ```csharp
  services.AddScoped<IAIAssistant>(sp =>
  {
      var provider = config["AI:Provider"];  // "openai", "claude", "gemini"
      return provider switch
      {
          "openai" => new OpenAIAssistant(config["AI:OpenAI:ApiKey"]),
          "claude" => new ClaudeAssistant(config["AI:Claude:ApiKey"]),
          _ => throw new InvalidOperationException($"Unknown provider: {provider}")
      };
  });
  ```

- [ ] Placeholder implementation:
  ```csharp
  public class NullAIAssistant : IAIAssistant
  {
      public Task<AIResponse> AskAsync(AIRequest request)
      {
          return Task.FromResult(new AIResponse(
              "IA não configurada. Implemente um provedor.",
              "null",
              0
          ));
      }
  }
  ```

**Critério de conclusão:**
- Interface definida e aceita por todo time
- DI setup pronto
- Placeholder que não quebra testes
- Documentação de como implementar novo provider

**Duração:** 1 dia

---

### 7️⃣ Module SDK & Discovery

**Objetivo:** Framework que permite novo módulo sem tocar no Core.

**Tarefas:**
- [ ] Criar `IModule` interface:
  ```csharp
  public interface IModule
  {
      string Name { get; }
      string Version { get; }
      
      void Register(IServiceCollection services, IConfiguration config);
      void MapEndpoints(IEndpointRouteBuilder app);
      Task<HealthCheckResult> CheckHealthAsync(Guid companyId);
  }
  ```

- [ ] Module discovery:
  ```csharp
  public class ModuleLoader
  {
      public static IEnumerable<IModule> DiscoverModules()
      {
          var moduleType = typeof(IModule);
          var types = AppDomain.CurrentDomain.GetAssemblies()
              .SelectMany(s => s.GetTypes())
              .Where(p => moduleType.IsAssignableFrom(p) && !p.IsInterface);
          
          return types.Select(t => (IModule)Activator.CreateInstance(t)!);
      }
  }
  ```

- [ ] Automatic registration:
  ```csharp
  var modules = ModuleLoader.DiscoverModules();
  foreach (var module in modules)
  {
      module.Register(services, config);
  }
  ```

- [ ] Endpoint mapping:
  ```csharp
  foreach (var module in modules)
  {
      var group = app.MapGroup($"/api/modules/{module.Name}");
      module.MapEndpoints(group);
  }
  ```

**Critério de conclusão:**
- IModule interface criada
- Discovery automático funciona
- DI registration automática
- Exemplo: módulo "dummy" que implementa IModule e funciona sem tocar em Program.cs

**Duração:** 2-3 dias

---

### 8️⃣ API Base Infrastructure

**Objetivo:** Setup básico de API (sem lógica de negócio).

**Tarefas:**
- [ ] Health checks:
  ```csharp
  app.MapHealthChecks("/health");
  app.MapHealthChecks("/health/ready", new HealthCheckOptions { });
  ```

- [ ] API Versioning (header ou URL):
  ```csharp
  app.MapGet("/api/v1/metadata", GetMetadata);
  ```

- [ ] Error handling middleware:
  ```csharp
  app.UseMiddleware<GlobalExceptionMiddleware>();
  ```

- [ ] Logging middleware:
  ```csharp
  app.UseMiddleware<RequestLoggingMiddleware>();
  ```

- [ ] CORS setup:
  ```csharp
  services.AddCors(options =>
  {
      options.AddPolicy("AllowFrontend", builder =>
          builder.WithOrigins(config["AllowedOrigins"].Split(';')));
  });
  ```

**Critério de conclusão:**
- GET /health retorna 200 OK
- Erro não capturado retorna 500 com estrutura consistente
- Requests são logadas com tenant context
- CORS funciona para frontend

**Duração:** 1-2 dias

---

### 9️⃣ Testes Unitários Sprint 1

**Objetivo:** Cobertura >85% de código crítico.

**Tarefas:**
- [ ] Testes de Multi-tenancy:
  ```csharp
  [TestMethod]
  public async Task GetCompanyUsers_WithDifferentTenants_ReturnsOnlyTenantUsers()
  {
      // CompanyA não deve ver usuários de CompanyB
  }
  ```

- [ ] Testes de Auth:
  ```csharp
  [TestMethod]
  public void ValidateJwt_WithExpiredToken_Fails() { ... }
  ```

- [ ] Testes de Services:
  ```csharp
  [TestMethod]
  public async Task UploadFile_WithValidStream_ReturnsFileUrl() { ... }
  ```

- [ ] Module Discovery tests:
  ```csharp
  [TestMethod]
  public void DiscoverModules_FindsAllImplementations() { ... }
  ```

**Critério de conclusão:**
- Coverage >85% das classes core
- CI/CD roda testes antes de merge
- Testes rápidos (<5s total)

**Duração:** 2-3 dias (paralelo com outras tarefas)

---

## ⏱️ Estimativa Total Sprint 1

| Tarefa | Dias | Paralelo? |
|--------|------|-----------|
| 1. Core | 2-3 | Não |
| 2. Multi-tenancy | 3-4 | Não (depende de 1) |
| 3. Data Layer | 4-5 | Não (depende de 2) |
| 4. Auth | 3-4 | Não (depende de 3) |
| 5. Core Services | 2-3 | Sim (depois de 4) |
| 6. IA Interface | 1 | Sim |
| 7. Module SDK | 2-3 | Sim |
| 8. API Base | 1-2 | Sim |
| 9. Testes | 2-3 | Paralelo com tudo |

**Sequência crítica (tempo mínimo):** 1 → 2 → 3 → 4, depois 5-8 em paralelo, 9 contínuo.

**Duração estimada:** 4-6 semanas (1.5 sprints se sprint = 2 semanas)

---

## 🚫 O que NÃO fazemos em Sprint 1

- ❌ Dashboard/UI (é para Sprint 2)
- ❌ Lógica de negócio (é para Sprint 2)
- ❌ Primeiro módulo (é para Sprint 2)
- ❌ IA implementation (é para Sprint 3)
- ❌ Marketplace (é para Sprint 3)

**Se alguém disser "vamos adicionar um relatório no Core porque é só essa vez", a resposta é NÃO.**

---

## 🎯 Critério de Sucesso Sprint 1

- ✅ `dotnet build` compila sem warning
- ✅ `dotnet test` roda testes com >85% coverage
- ✅ API responde a `/health` com 200 OK
- ✅ Multi-tenancy funciona: CompanyA isolada de CompanyB
- ✅ JWT gerado, validado, refrescado sem erro
- ✅ Module loader descobre módulos automaticamente
- ✅ Deploy simples (não precisa de UI ainda)
- ✅ Time inteiro entende a arquitetura

---

## 📊 Métricas Sprint 1

| Métrica | Target |
|---------|--------|
| Build time | <30s |
| Test time | <5s |
| Code coverage | >85% |
| Security scans | 0 críticas, <5 medium |
| Documentation | Checklist Sprint 1 completo |
| Bugs encontrados | <3 críticos |

---

## 🔒 "Protetor do Core" — Checklist de Vigilância

Antes de qualquer PR ser merged em Sprint 1, perguntar:

- [ ] Esta mudança está no **Core** quando deveria estar em um **Módulo**?
- [ ] Esta mudança depende de um **módulo específico**?
- [ ] Esta mudança **quebra** a interface `IModule`?
- [ ] Esta mudança deixa o Core **mais acoplado** ao que era antes?
- [ ] Esta mudança **viola DDD** (colocando lógica de negócio no Core)?

Se a resposta é "sim" para qualquer, a PR é rejeitada até arrumar.

**Mantendo a disciplina arquitetural agora vale meses de refatoração depois.**

---

**Próximo:** Sprint 2 começa com Razarth.Modules.Supermarket
