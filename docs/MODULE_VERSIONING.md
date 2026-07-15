# Module Versioning — Cada Módulo Evolui no Seu Ritmo

> **Platform 1.0 mas Supermarket 1.2 e Restaurant 0.9. Independência de versões.**

---

## Estrutura

```
Razarth Platform: 1.0.0
├── Razarth.Modules.Supermarket: 1.2.3
├── Razarth.Modules.Restaurant: 0.9.1
├── Razarth.Modules.Barbershop: 1.0.0
└── Razarth.Modules.Clinic: 0.1.0
```

**Independência total:** Módulo novo não quebra módulo antigo.

---

## Versioning Semântico

Cada módulo segue SemVer:

```
MAJOR.MINOR.PATCH

1.2.3
│ │ └─ Patch: bugfix (1.2.2 → 1.2.3)
│ └──── Minor: feature (1.1.0 → 1.2.0)
└────── Major: breaking change (1.0.0 → 2.0.0)
```

### Exemplo: Supermarket

```
1.0.0 → Initial release
1.1.0 → Add Trend Analysis (feature)
1.1.1 → Fix anomaly calculation bug
1.2.0 → Add Comparative Reports (feature)
1.2.1 → Performance optimization
2.0.0 → Refactor scoring algorithm (breaking change)
```

---

## ModuleManifest.json

```json
{
  "id": "supermarket",
  "name": "Razarth Supermarket",
  "version": "1.2.3",
  "description": "Analytics engine for supermarket operations",
  "author": "Razarth Team",
  
  "platformMinimumVersion": "1.0.0",
  
  "capabilities": {
    "entities": ["Loss", "Product", "Store", "Sector"],
    "engines": ["Analytics", "Knowledge", "Investigation"],
    "featureFlags": ["anomaly_detection", "monthly_closing"]
  },
  
  "maturityLevel": "GA",  // Alpha, Beta, GA, Deprecated, EOL
  
  "changelog": {
    "1.2.3": "Fix null reference in scoring",
    "1.2.2": "Performance: cache anomaly calculations",
    "1.2.1": "Update database indexes",
    "1.2.0": "Add comparative reports feature",
    "1.1.0": "Add trend analysis",
    "1.0.0": "Initial release"
  }
}
```

---

## Versionamento no Banco

```sql
CREATE TABLE module_versions (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL,
    module_name VARCHAR NOT NULL,
    version VARCHAR NOT NULL,          -- 1.2.3
    installed_at TIMESTAMP,
    configuration JSONB,
    status VARCHAR,                    -- active, deprecated, archived
    
    UNIQUE(company_id, module_name, version)
);

-- Rastrear qual versão cada empresa usa
CREATE TABLE company_module_versions (
    company_id UUID NOT NULL,
    module_name VARCHAR NOT NULL,
    current_version VARCHAR NOT NULL,
    previous_version VARCHAR,
    upgraded_at TIMESTAMP,
    
    PRIMARY KEY(company_id, module_name),
    FOREIGN KEY(company_id, module_name, current_version) REFERENCES module_versions
);
```

---

## Algoritmo Versioning (Crítico)

Toda análise (score, anomalia) registra versão de algoritmo:

```csharp
public class Score
{
    public decimal Value { get; set; }
    public string AlgorithmVersion { get; set; }  // "supermarket:scoring:1.2"
    public DateTime CalculatedAt { get; set; }
    public Dictionary<string, object> Parameters { get; set; }  // inputs para reprodução
}
```

### Exemplo

```csharp
public class ScoringEngine
{
    private const string ALGORITHM_VERSION = "supermarket:scoring:1.2.3";
    
    public Score CalculateScore(Loss loss, IReadOnlyList<Loss> history)
    {
        // ... cálculo
        
        return new Score
        {
            Value = result,
            AlgorithmVersion = ALGORITHM_VERSION,
            CalculatedAt = DateTime.UtcNow,
            Parameters = new()
            {
                ["product_id"] = loss.ProductId.ToString(),
                ["history_count"] = history.Count,
                ["z_score_threshold"] = 2.5
            }
        };
    }
}
```

**Por quê?** Quando cliente questiona score de 6 meses atrás, você reexecuta com exata mesma versão e reproduz o resultado.

---

## Atualização de Módulo

### Cenário: Supermarket 1.1.0 → 1.2.0

```
1. Validar compatibilidade
   - Plataforma 1.0.0 suporta Supermarket 1.2.0?
   - Novos campos no banco?
   - Breaking changes?

2. Criar migration
   - 20260120_SupermarketV120.cs
   - Adicionar colunas novas
   - Não deletar antigas

3. Deploy
   - Desativar feature flags de novo recurso
   - Rodar migration
   - Atualizar módulo
   - Ativar feature flags progressivamente

4. Rollback (se necessário)
   - Desativar flags
   - Reverter para 1.1.0
   - Migração down (restaurar estado anterior)
```

---

## Matriz de Compatibilidade

```
Supermarket vs Platform

Supermarket 1.0 → Platform 1.0 ✅
Supermarket 1.1 → Platform 1.0 ✅
Supermarket 2.0 → Platform 1.0 ❌ (requer Platform 2.0+)

Restaurant 1.0 → Platform 1.0 ✅
Restaurant 1.0 → Platform 1.1 ✅ (backwards compatible)
```

Documentar em `ModuleManifest.json`:

```json
{
  "platformMinimumVersion": "1.0.0",
  "compatibilityMatrix": {
    "1.0.0": "Platform >=1.0.0",
    "1.1.0": "Platform >=1.0.0",
    "1.2.0": "Platform >=1.0.0",
    "2.0.0": "Platform >=2.0.0"
  }
}
```

---

## Maturity Levels

```
Alpha       → Feature-complete, known bugs
Beta        → Stable API, comprehensive docs
GA          → Production-ready, SLA support
Deprecated  → Superseded, support window closing
EOL         → Support ended
```

```json
{
  "maturityLevel": "GA",
  "supportUntil": "2028-12-31"
}
```

---

## Usar Versão em Código

```csharp
public class ModuleRegistry
{
    public async Task<ModuleInfo> GetModuleVersionAsync(string moduleName)
    {
        var manifest = await _repo.GetModuleManifestAsync(moduleName);
        return new ModuleInfo
        {
            Name = moduleName,
            Version = manifest.Version,
            AlgorithmVersion = ExtractAlgorithmVersion(manifest)
        };
    }
}

public class AnalyticsController
{
    [HttpGet("version")]
    public async Task<IActionResult> GetModuleVersion()
    {
        var version = await _registry.GetModuleVersionAsync("supermarket");
        return Ok(new { module = "supermarket", version = version.Version });
    }
}
```

---

**Module Versioning: Escalabilidade sem acoplamento.**
