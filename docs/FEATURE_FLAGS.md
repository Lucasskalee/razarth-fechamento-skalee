# Feature Flags — Flexibilidade desde o Início

> **Ativar/desativar funcionalidades por empresa, plano ou ambiente sem código.**

---

## Convenção de Flags

```
{Module}.{Feature}

Supermarket.AnomalyDetection
Supermarket.MonthlyClosing
Supermarket.ComparativeAnalysis

Restaurant.Delivery
Restaurant.Online Orders

Clinic.DigitalSignature
Clinic.Telemedicine

AI.Enabled
AI.GenerateDescriptions
AI.MarketingSuggestions

Marketplace.Enabled
```

---

## Estrutura no Banco

```sql
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,              -- null = global
    module_name VARCHAR NOT NULL,
    feature_name VARCHAR NOT NULL,
    enabled BOOLEAN DEFAULT false,
    environment VARCHAR DEFAULT 'production',  -- production, staging, development
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Índices
CREATE INDEX idx_company_feature ON feature_flags(company_id, feature_name);
```

---

## Interface

```csharp
namespace Razarth.Application.Features;

public interface IFeatureFlagService
{
    /// <summary>
    /// Verificar se feature está ativada
    /// </summary>
    Task<bool> IsEnabledAsync(string featureName, Guid? companyId = null);
    
    /// <summary>
    /// Ativar feature para empresa
    /// </summary>
    Task EnableAsync(string featureName, Guid? companyId = null);
    
    /// <summary>
    /// Desativar feature para empresa
    /// </summary>
    Task DisableAsync(string featureName, Guid? companyId = null);
}
```

---

## Implementação

```csharp
namespace Razarth.Infrastructure.Features;

public class FeatureFlagService : IFeatureFlagService
{
    private readonly RazarthDbContext _db;
    private readonly IMemoryCache _cache;
    private readonly ITenantResolver _tenantResolver;
    
    public FeatureFlagService(
        RazarthDbContext db,
        IMemoryCache cache,
        ITenantResolver tenantResolver
    )
    {
        _db = db;
        _cache = cache;
        _tenantResolver = tenantResolver;
    }
    
    public async Task<bool> IsEnabledAsync(string featureName, Guid? companyId = null)
    {
        companyId ??= _tenantResolver.GetTenantId();
        
        var cacheKey = $"feature:{featureName}:{companyId}";
        
        if (_cache.TryGetValue(cacheKey, out bool cached))
            return cached;
        
        var flag = await _db.FeatureFlags
            .FirstOrDefaultAsync(f =>
                f.FeatureName == featureName &&
                (f.CompanyId == companyId || f.CompanyId == null)
            );
        
        var enabled = flag?.Enabled ?? false;
        
        // Cache por 5 minutos
        _cache.Set(cacheKey, enabled, TimeSpan.FromMinutes(5));
        
        return enabled;
    }
    
    public async Task EnableAsync(string featureName, Guid? companyId = null)
    {
        companyId ??= _tenantResolver.GetTenantId();
        
        var flag = await _db.FeatureFlags
            .FirstOrDefaultAsync(f =>
                f.FeatureName == featureName &&
                f.CompanyId == companyId
            );
        
        if (flag == null)
        {
            flag = new FeatureFlag
            {
                Id = Guid.NewGuid(),
                FeatureName = featureName,
                CompanyId = companyId,
                Enabled = true,
                CreatedAt = DateTime.UtcNow
            };
            _db.FeatureFlags.Add(flag);
        }
        else
        {
            flag.Enabled = true;
            flag.UpdatedAt = DateTime.UtcNow;
        }
        
        await _db.SaveChangesAsync();
        InvalidateCache(featureName, companyId);
    }
    
    public async Task DisableAsync(string featureName, Guid? companyId = null)
    {
        companyId ??= _tenantResolver.GetTenantId();
        
        var flag = await _db.FeatureFlags
            .FirstOrDefaultAsync(f =>
                f.FeatureName == featureName &&
                f.CompanyId == companyId
            );
        
        if (flag != null)
        {
            flag.Enabled = false;
            flag.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
        
        InvalidateCache(featureName, companyId);
    }
    
    private void InvalidateCache(string featureName, Guid? companyId)
    {
        _cache.Remove($"feature:{featureName}:{companyId}");
    }
}
```

---

## Usar em Código

```csharp
public class AnalyticsController
{
    private readonly IFeatureFlagService _flags;
    private readonly AnalyticsEngine _engine;
    
    [HttpPost("analyze/anomalies")]
    public async Task<IActionResult> AnalyzeAnomalies([FromBody] AnalyzeRequest request)
    {
        if (!await _flags.IsEnabledAsync("Supermarket.AnomalyDetection"))
            return Forbid("Feature not enabled for this company");
        
        // Continuar com lógica
    }
}
```

---

## Casos de Uso

### Ativar Módulo Progressivamente

```csharp
// Ativar Restaurant para Empresa X
await _flags.EnableAsync("Restaurant.Enabled", companyId: restaurantCompanyId);
```

### Canary Deployment

```csharp
// Ativar nova versão de algoritmo apenas para 10% dos usuários
// (implementado com probabilidade ou whitelist)
```

### Ambiente de Desenvolvimento

```
Development: Todas as flags ativadas
Staging: Flags habilitadas conforme plano
Production: Apenas flags validadas
```

---

**Feature Flags: Desacople código de decisões de negócio.**
