# Sprint 1.2 — Database Foundation

**Objetivo:** Criar estrutura de banco com novo modelo de domínio  
**Duração:** 3-4 dias  
**Status:** 📋 Planejado  

---

## 📋 O Que Construir

### Tabelas Principais

```sql
-- Usuários (compartilhado)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(500) NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'banned'
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    deleted_at TIMESTAMP NULL
);

-- Empresas (multi-tenant)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    logo_url VARCHAR(500),
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    deleted_at TIMESTAMP NULL
);

-- Memberships (relação usuário ↔ empresa)
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer', -- 'owner', 'editor', 'viewer'
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE(user_id, company_id)
);

-- Planos de subscription
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10, 2),
    billing_period VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'yearly'
    features JSONB, -- {"max_products": 50, "has_analytics": false}
    created_at TIMESTAMP DEFAULT now()
);

-- Subscriptions ativas
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'cancelled', 'expired'
    started_at TIMESTAMP DEFAULT now(),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Módulos da plataforma
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE, -- 'core', 'supermarket', 'analytics', 'ai'
    version VARCHAR(20) DEFAULT '1.0.0',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now()
);

-- Ativação de módulos por empresa
CREATE TABLE company_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id),
    is_active BOOLEAN DEFAULT false,
    activated_at TIMESTAMP,
    UNIQUE(company_id, module_id)
);

-- Perfil público
CREATE TABLE public_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
    description TEXT,
    banner_url VARCHAR(500),
    whatsapp_number VARCHAR(20),
    facebook_url VARCHAR(500),
    instagram_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Domínios customizados (futuro)
CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'failed'
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now()
);

-- Configurações por empresa
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    type VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    UNIQUE(company_id, key)
);

-- Auditoria (compliant LGPD)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),
    user_id UUID REFERENCES users(id),
    entity_type VARCHAR(100) NOT NULL, -- 'product', 'company', 'user', etc
    entity_id UUID,
    action VARCHAR(20) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
    data_before JSONB,
    data_after JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Produtos
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    photo_url VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    deleted_at TIMESTAMP NULL
);
```

### Índices (Performance)
```sql
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_slug ON companies(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_created_by ON companies(created_by);
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_company_id ON memberships(company_id);
CREATE INDEX idx_subscriptions_company_id ON subscriptions(company_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_products_company_id ON products(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_sort_order ON products(company_id, sort_order) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

---

## 🔧 EF Core DbContext Mapping

```csharp
public class RazarthDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    public DbSet<Company> Companies { get; set; }
    public DbSet<Membership> Memberships { get; set; }
    public DbSet<Plan> Plans { get; set; }
    public DbSet<Subscription> Subscriptions { get; set; }
    public DbSet<Module> Modules { get; set; }
    public DbSet<CompanyModule> CompanyModules { get; set; }
    public DbSet<PublicProfile> PublicProfiles { get; set; }
    public DbSet<Domain> Domains { get; set; }
    public DbSet<Setting> Settings { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<Product> Products { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>()
            .HasKey(u => u.Id);
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();
        modelBuilder.Entity<User>()
            .Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(255);

        // Company
        modelBuilder.Entity<Company>()
            .HasKey(c => c.Id);
        modelBuilder.Entity<Company>()
            .HasIndex(c => c.Slug)
            .IsUnique();
        modelBuilder.Entity<Company>()
            .Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(255);
        modelBuilder.Entity<Company>()
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(c => c.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        // Membership
        modelBuilder.Entity<Membership>()
            .HasKey(m => m.Id);
        modelBuilder.Entity<Membership>()
            .HasIndex(m => new { m.UserId, m.CompanyId })
            .IsUnique();
        modelBuilder.Entity<Membership>()
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Membership>()
            .HasOne<Company>()
            .WithMany()
            .HasForeignKey(m => m.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        // Product (multi-tenant)
        modelBuilder.Entity<Product>()
            .HasKey(p => p.Id);
        modelBuilder.Entity<Product>()
            .HasIndex(p => p.CompanyId);
        modelBuilder.Entity<Product>()
            .HasIndex(p => new { p.CompanyId, p.SortOrder });
        modelBuilder.Entity<Product>()
            .HasOne<Company>()
            .WithMany()
            .HasForeignKey(p => p.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        // AuditLog
        modelBuilder.Entity<AuditLog>()
            .HasKey(a => a.Id);
        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => a.CompanyId);
        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => a.CreatedAt)
            .IsDescending();
    }
}
```

---

## 🔐 Soft Delete Strategy

Toda entidade com `deleted_at` usa **Query Filters**:

```csharp
modelBuilder.Entity<Product>()
    .HasQueryFilter(p => p.DeletedAt == null);

modelBuilder.Entity<Company>()
    .HasQueryFilter(c => c.DeletedAt == null);
```

**Por quê?**
- Compliant LGPD: dados nunca desaparecem antes do prazo legal
- Auditoria: histórico completo mesmo após exclusão lógica
- Recuperação: pode restaurar dados acidentalmente deletados

---

## 📊 Dados Iniciais (Seed)

```csharp
public static void SeedData(RazarthDbContext context)
{
    // Planos padrão
    var freePlan = new Plan
    {
        Id = Guid.NewGuid(),
        Name = "Free",
        Description = "Para testar",
        Price = 0,
        Features = JsonDocument.Parse(JsonSerializer.Serialize(
            new { max_products = 5, has_analytics = false }
        ))
    };

    var proPlan = new Plan
    {
        Id = Guid.NewGuid(),
        Name = "Pro",
        Description = "Para crescer",
        Price = 99.00m,
        Features = JsonDocument.Parse(JsonSerializer.Serialize(
            new { max_products = 100, has_analytics = true }
        ))
    };

    context.Plans.AddRange(freePlan, proPlan);

    // Módulos
    var coreModule = new Module
    {
        Id = Guid.NewGuid(),
        Name = "core",
        Version = "1.0.0",
        IsActive = true
    };

    var supermarketModule = new Module
    {
        Id = Guid.NewGuid(),
        Name = "supermarket",
        Version = "1.0.0",
        IsActive = true
    };

    context.Modules.AddRange(coreModule, supermarketModule);
    context.SaveChanges();
}
```

---

## 🧪 Testes de Integração

```csharp
[Collection("Database")]
public class DatabaseIntegrationTests
{
    private readonly RazarthDbContext _context;

    [Fact]
    public async Task CreateCompany_WithValidData_Succeeds()
    {
        // Arrange
        var user = new User { Email = "owner@test.com", PasswordHash = "hash" };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var company = new Company 
        { 
            Name = "Test Co", 
            Slug = "test-co",
            CreatedBy = user.Id 
        };

        // Act
        _context.Companies.Add(company);
        await _context.SaveChangesAsync();

        // Assert
        Assert.NotEqual(Guid.Empty, company.Id);
        Assert.Single(_context.Companies);
    }

    [Fact]
    public async Task SoftDelete_Product_IsNotReturned()
    {
        // Arrange
        var product = new Product { CompanyId = Guid.NewGuid(), Name = "Test" };
        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        // Act
        product.DeletedAt = DateTime.UtcNow;
        _context.Products.Update(product);
        await _context.SaveChangesAsync();

        // Assert
        var remaining = _context.Products.ToList();
        Assert.Empty(remaining);
    }
}
```

---

## 🚀 Migração EF Core

```bash
# Criar migração
dotnet ef migrations add InitialCreate --project src/Razarth.Core.Infrastructure --startup-project src/Razarth.API

# Aplicar ao banco
dotnet ef database update --project src/Razarth.Core.Infrastructure --startup-project src/Razarth.API
```

---

## ✅ Checklist Sprint 1.2

- [ ] Todas tabelas criadas (DDL)
- [ ] Índices criados (performance)
- [ ] EF Core DbContext com todos os mappings
- [ ] Query Filters para soft delete
- [ ] Seed data (Plans, Modules)
- [ ] Testes de integração passando
- [ ] Migrations testadas em dev + staging
- [ ] CI/CD verde

---

## 📝 Notas Importantes

### Por que Guid e não UUID na string?
```csharp
// Evita erros de parsing
public Guid Id { get; set; }  // ✅ Type-safe
```

### Por que JSONB para features?
```sql
features JSONB, -- {"max_products": 50, "has_analytics": false}
```
Permite queries complexas e evolução sem migração.

### Soft Delete vs. Hard Delete
- **Soft:** `DELETE FROM products WHERE id = X` → `UPDATE products SET deleted_at = now() WHERE id = X`
- **Legal:** LGPD exige retenção por 12-18 meses
- **Auditoria:** Precisamos de histórico completo

---

**Próximo:** Sprint 1.3 - Multi-Tenancy
