# Razarth Tenancy Architecture

**Classificação:** 🔐 Crítico (Proteger a qualquer custo)  
**Versão:** 1.0  
**Sprint:** 1.3

---

## O Problema

Razarth executa múltiplas empresas no mesmo banco.

```
Banco (PostgreSQL)
├── Supermercado Sol (Dados do Supermercado Sol)
├── Barbearia ABC (Dados da Barbearia ABC)
└── Restaurante XYZ (Dados do Restaurante XYZ)
```

Se CompanyA conseguir ler dados de CompanyB = **Vazamento de dados crítico**.

---

## Solução: 3 Camadas de Isolamento

### Camada 1: **Request Context** (Middleware)
Toda requisição deve informar explicitamente qual empresa está acessando.

```csharp
// HTTP Header
GET /api/products
Authorization: Bearer <JWT>
X-Company-Id: 550e8400-e29b-41d4-a716-446655440000

// Middleware extrai:
public class TenantMiddleware : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var companyId = context.Request.Headers["X-Company-Id"];
        if (string.IsNullOrEmpty(companyId))
            throw new UnauthorizedException("Empresa não especificada");
        
        context.Items["CurrentCompanyId"] = companyId;
        context.Items["CurrentUserId"] = tokenClaims["sub"];
        
        await next(context);
    }
}
```

**Por que no header?**
- Simples de validar a cada request
- Impossível esquecer (middleware intercepta antes de controller)
- Fácil de tester (sempre enviar header nos testes)

---

### Camada 2: **Permission Check** (AuthorizationAttribute)
Verifica se usuário atual tem Membership naquela empresa.

```csharp
[Authorize]
[RequiresCompanyMembership]
[HttpGet("api/companies/{companyId}/products")]
public async Task<IActionResult> ListProducts(string companyId)
{
    // RequiresCompanyMembership attribute:
    // 1. Extrai Current User e Current Company do context
    // 2. Consulta Memberships
    // 3. Se não encontra → 403 Forbidden
    // 4. Se encontra → continua
}
```

**Memberships Table:**
```sql
CREATE TABLE memberships (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL,  -- 'owner', 'editor', 'viewer'
    created_at TIMESTAMP,
    UNIQUE(user_id, company_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);
```

---

### Camada 3: **Database Row-Level Security** (SQL/EF Core)
Toda query inclui `WHERE company_id = :currentCompanyId`.

```csharp
// EF Core DbContext
public class RazarthDbContext : DbContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    
    public RazarthDbContext(DbContextOptions options, IHttpContextAccessor httpContextAccessor) 
        : base(options)
    {
        _httpContextAccessor = httpContextAccessor;
    }
    
    // Automatic tenant filtering
    public override int SaveChanges()
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is ITenantEntity tenantEntity)
            {
                if (entry.State == EntityState.Added)
                {
                    tenantEntity.CompanyId = GetCurrentCompanyId();
                }
            }
        }
        return base.SaveChanges();
    }
    
    public IQueryable<T> FilterByCompany<T>(IQueryable<T> query) where T : ITenantEntity
    {
        var currentCompanyId = GetCurrentCompanyId();
        return query.Where(x => x.CompanyId == currentCompanyId);
    }
    
    private Guid GetCurrentCompanyId()
    {
        var companyIdStr = _httpContextAccessor.HttpContext?.Items["CurrentCompanyId"]?.ToString();
        if (string.IsNullOrEmpty(companyIdStr))
            throw new InvalidOperationException("Company context not set");
        return Guid.Parse(companyIdStr);
    }
}
```

**Interface para marcar entities multi-tenant:**
```csharp
public interface ITenantEntity
{
    Guid CompanyId { get; set; }
}

// Domain entities herdam
public class Product : IAggregateRoot, ITenantEntity
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }  // OBRIGATÓRIO
    public string Name { get; set; }
    public decimal Price { get; set; }
}
```

---

## 🔒 Fluxo de uma Requisição Segura

```
1. Cliente faz:
   GET /api/companies/ABC/products
   Header: X-Company-Id: ABC
   Authorization: Bearer <JWT>

2. Middleware TenantMiddleware:
   → Valida JWT (válido)
   → Extrai userId do JWT
   → Extrai companyId do header
   → Guarda em HttpContext.Items

3. Controller
   [RequiresCompanyMembership]
   → Query: SELECT * FROM memberships 
            WHERE user_id = :userId AND company_id = :companyId
   → Se não encontra → 403
   → Se encontra → continua

4. Repository
   → Query para database:
      SELECT * FROM products 
      WHERE company_id = :companyId  ← AUTOMÁTICO (row-level security)
      AND deleted_at IS NULL

5. Resposta
   → Apenas produtos de ABC
   → Impossível retornar produtos de XYZ
```

---

## 📊 Tabelas Multi-Tenant

**Toda tabela de negócio deve ter `company_id`:**

```sql
Companies (id, name, slug, logo_url, created_at)
Users (id, email, password_hash, created_at)
Memberships (id, user_id, company_id, role) ← Link
Products (id, company_id, name, price) ← Multi-tenant
Orders (id, company_id, product_id, customer_name) ← Multi-tenant
AuditLog (id, company_id, user_id, action) ← Multi-tenant
Subscriptions (id, company_id, plan_id, status) ← Multi-tenant

-- Tabelas compartilhadas (SEM company_id):
Plans (id, name, price, features)
Modules (id, name, version)
```

---

## 🛡️ Anti-Patterns (O que NÃO fazer)

### ❌ Confiar na segurança "na aplicação"
```csharp
// WRONG! Apenas filtra no repository, sem verificação de permissão
public List<Product> GetProducts(Guid companyId)
{
    return db.Products.Where(p => p.CompanyId == companyId).ToList();
}
```
**Por quê?** Se alguém conseguir passar `companyId` diferente do seu, vaza dados.

### ✅ Confiar em múltiplas camadas
```csharp
// RIGHT! Middleware + Authorization + Row-level
[Authorize]
[RequiresCompanyMembership]  // Valida permissão
public List<Product> GetProducts()
{
    return db.Products
        .FilterByCompany()  // Adiciona WHERE company_id = current
        .ToList();
}
```

---

### ❌ Guardar company_id em JWT como string simples
```json
{
  "sub": "user-123",
  "company": "company-abc",  // ❌ Cliente pode alterar JWT!
  "iat": 1234567890
}
```

### ✅ Validar company_id sempre no backend
```csharp
// Compara header com database (Memberships)
var company = header["X-Company-Id"];
var user = jwtClaims["sub"];

var membership = db.Memberships
    .Where(m => m.UserId == user && m.CompanyId == company)
    .FirstOrDefault();

if (membership == null)
    return 403;  // Não tem permissão
```

---

## 🚀 Implementação Sprint 1.3

### Fase 1: Middleware
```csharp
// Program.cs
builder.Services.AddScoped<TenantMiddleware>();
app.UseMiddleware<TenantMiddleware>();
```

### Fase 2: Database Schema
```sql
ALTER TABLE products ADD COLUMN company_id UUID NOT NULL;
ALTER TABLE orders ADD COLUMN company_id UUID NOT NULL;
ALTER TABLE subscriptions ADD COLUMN company_id UUID NOT NULL;
ALTER TABLE audit_logs ADD COLUMN company_id UUID NOT NULL;

CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_orders_company ON orders(company_id);
```

### Fase 3: EF Core Configuration
```csharp
modelBuilder.Entity<Product>()
    .HasKey(p => p.Id);
    
modelBuilder.Entity<Product>()
    .Property(p => p.CompanyId)
    .IsRequired();
    
modelBuilder.Entity<Product>()
    .HasIndex(p => p.CompanyId);
```

### Fase 4: Tests
```csharp
[Fact]
public async Task UserA_Cannot_See_UserB_Products()
{
    // Arrange
    var companyA = Guid.NewGuid();
    var companyB = Guid.NewGuid();
    var productB = new Product { CompanyId = companyB, Name = "Produto B" };
    
    // Act
    var request = new HttpRequestMessage(HttpMethod.Get, "/api/products");
    request.Headers.Add("X-Company-Id", companyA.ToString());
    
    var response = await client.SendAsync(request);
    var products = await response.Content.ReadAsAsync<List<Product>>();
    
    // Assert
    Assert.DoesNotContain(products, p => p.CompanyId == companyB);
}
```

---

## 📈 Escalabilidade Futura

### Hoje (Sprint 1.3)
- 1 banco PostgreSQL
- Múltiplas empresas no mesmo schema

### Amanhã (Sprint 3+)
Se crescer muito, podemos:
- **Option A:** PostgreSQL schema-per-tenant (1 schema por empresa)
- **Option B:** Database-per-tenant (1 banco por empresa, mais caro)
- **Option C:** Sharding (empresas distribuídas entre múltiplos bancos)

Mas a arquitetura de código não muda — apenas infraestrutura.

---

## ✅ Checklist Sprint 1.3

- [ ] Middleware TenantMiddleware criado
- [ ] [RequiresCompanyMembership] attribute criado
- [ ] DbContext com FilterByCompany() implementado
- [ ] Todas entities implementam ITenantEntity
- [ ] Database schema atualizado (company_id em todas tabelas)
- [ ] Tests validando isolamento de dados
- [ ] CI/CD passando

---

**Próximo:** `02-PUBLIC_PROFILE.md`
