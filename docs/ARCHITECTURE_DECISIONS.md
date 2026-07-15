# Decisões Arquiteturais — Razarth

> **Este documento registra as decisões de arquitetura que definem Razarth. Cada decisão tem contexto, alternativas consideradas, e impacto.**

---

## AD-001: Razarth Platform, não Razarth Intelligence

**Data:** 2026-01-13 (Sprint 0)  
**Status:** ✅ Aprovada  
**Contexto de Impacto:** Estratégia de produto, arquitetura de software, estrutura de dados

### Problema

Começamos com uma visão clara: um motor analítico especializado em supermercados (Razarth Intelligence). É um mercado real, bem definido, com cliente piloto (Supermercado Sol).

Porém, ao refletir, surgiu uma oportunidade maior: por que não construir uma **plataforma modular** que pudesse servir barbearias, restaurantes, clínicas, academias, etc.?

Duas opções se apresentaram:

1. **Plataforma genérica desde o dia 1**: Construir abstratamente uma base multi-tenant com suporte a N segmentos. Risco: engenharia linda, faturamento nulo. Nunca sabe para quem está construindo.

2. **Intelligence primeiro, Platform depois**: Construir Razarth Intelligence bem, depois refatorar como módulo. Risco: ter que reescrever tudo para suportar multi-tenância.

3. **Platform com Supermarket como Módulo 1** (escolhido): Construir a base da Platform desde o dia 1, mas validar com o módulo que já conhecemos. Melhor dos dois mundos.

### Decisão

**Razarth é uma Platform, não um produto único.**

- **Produto:** Razarth Platform
- **Primeiro módulo:** Razarth Supermarket (o atual Intelligence)
- **Estratégia:** Validar multi-tenância com um cliente real antes de expandir

### Arquitetura Resultante

```
Razarth Platform
├── Core (compartilhado)
│   ├── Autenticação & RBAC
│   ├── Multitenância
│   ├── Assinaturas & Planos
│   ├── Feature Flags
│   ├── IA
│   └── Observabilidade
├── Marketplace de Módulos
└── Módulos
    ├── 📦 Razarth Supermarket (M1 — em uso)
    ├── 💈 Razarth Barbershop (M2)
    ├── 🍔 Razarth Food (M3)
    └── ...
```

### Impacto

| Dimensão | Efeito |
|----------|--------|
| **Arquitetura** | Todas as entidades carregam tenant context desde dia 1 |
| **Banco** | Schema única com `company_id` em toda tabela relevante |
| **API** | Headers incluem contexto de empresa; autorização é multi-tenant-aware |
| **Frontend** | Seletor de empresa; dashboards segregados por tenant |
| **Roadmap** | Sprint 0 → Platform Base; Sprint 1 → Supermarket Module; Sprint 2+ → Novos módulos |
| **Go-to-Market** | Validar com Supermercado Sol; depois replicar para outros segmentos |
| **Escalabilidade** | Terceira empresa não exige novo deploy, só novo subscription |

### Alternativas Rejeitadas

- ❌ Intelligence como produto standalone: Fica preso em supermercados para sempre.
- ❌ Plataforma genérica sem validação: Corre risco de não resolver bem problema nenhum.

### Aprovação

- ✅ CTO reconhecimento: Decisão sólida, evita reengenharia futura.
- ✅ Produto: Abre caminho para expansão sem quebrar base.
- ✅ Engenharia: Motivante—código escrito hoje serve N clientes amanhã.

---

## AD-002: Multi-tenância desde o Dia 1

**Data:** 2026-01-13 (Sprint 0)  
**Status:** ✅ Aprovada  
**Contexto de Impacto:** Banco de dados, segurança, performance, escalabilidade

### Problema

Muitas empresas começam com tenant único (um cliente) e retrofitam multi-tenância depois. Resultado: 6 meses de reengenharia.

### Decisão

**Toda entidade importante carrega `company_id` ou contexto de empresa.**

Exemplos:

```typescript
// ❌ Errado
Loss { id, store_id, product_id, month, ... }

// ✅ Certo
Loss { id, company_id, store_id, product_id, month, ... }
```

Motivo: Quando vem segunda empresa, não há chance de contas se cruzarem.

### Consequências

- Index em `company_id` + chave de negócio em todas as queries.
- Middleware de autorização valida `company_id` antes de qualquer operação.
- Migrations versionadas por empresa.
- Row-level security no banco (se usar PostgreSQL).

---

## AD-003: Domain-Driven Design, não Data-First

**Data:** 2026-01-13 (Sprint 0)  
**Status:** ✅ Aprovada  
**Contexto de Impacto:** Modelagem, desenvolvimento, evolução do produto

### Problema

Fácil cair na tentação: "Vamos criar o banco, depois coisas aparecem". Resultado: domínio emaranhado com schema de banco.

### Decisão

**Domain é prioridade 1. Banco é implementação.**

1. Definir entidades: `Company`, `Store`, `Sector`, `Product`, `Loss`, `OperationalEvent`, `Analysis`, `Score`.
2. Definir comportamentos: Como Loss se comporta? O que Score valida?
3. Depois: Banco, API, Interface.

### Benefício

Se banco mudar de PostgreSQL para MongoDB em 2028, domain continua igual. Se mudar API de REST para GraphQL, domain continua igual. Domain é o coração que resiste a mudanças.

---

## AD-004: Engines são Bibliotecas Puras, não Serviços HTTP

**Data:** 2026-01-13 (Sprint 0)  
**Status:** ✅ Aprovada  
**Contexto de Impacto:** Arquitetura, testabilidade, reusabilidade

### Problema

Se Analytics Engine for um serviço HTTP, não pode ser usado em Desktop. Se estiver acoplado ao banco, não pode ser testado sem banco.

### Decisão

**Engines são bibliotecas .NET puras.**

```csharp
// ✅ Correto
public class AnalyticsEngine
{
    public AnomalyDetectionResult DetectAnomalies(
        List<MonthlyLoss> history,
        AnomalyRules rules
    ) { ... }
}

// ❌ Errado
public async Task<AnomalyDetectionResult> DetectAnomalies(
    int productId, 
    string month
) 
{ 
    var data = await _db.GetProductHistory(productId);
    ...
}
```

Motivo: Mesma engine roda em Web API, Desktop client, batch jobs, testes, documentação.

---

## AD-005: Rules Engine para Configuração, não Código

**Data:** 2026-01-13 (Sprint 0)  
**Status:** ✅ Aprovada  
**Contexto de Impacto:** Flexibilidade, configuração, tempo de deploy

### Problema

Cada cliente quer ajustar tolerâncias de anomalia, pesos de score, alertas. Se estiverem no código, é deploy a cada mudança.

### Decisão

**Variáveis de negócio vivem em Rules Engine, não em const de código.**

```csharp
// ❌ Errado
const decimal ANOMALY_Z_SCORE_THRESHOLD = 2.5m;

// ✅ Correto
var rules = await rulesEngine.GetRules("anomaly_detection", companyId);
decimal threshold = rules.Get<decimal>("z_score_threshold", defaultValue: 2.5m);
```

Motivo: Cada empresa pode ter tolerâncias diferentes. Sem redeplorar.

---

## AD-006: Result<T> Pattern Everywhere

**Data:** 2026-01-13 (Sprint 0)  
**Status:** ✅ Aprovada  
**Contexto de Impacto:** Tratamento de erro, previsibilidade, UX

### Problema

Exceptions são surpresas. Se engine joga exception, quem chama não sabe se é erro esperado ou bug.

### Decisão

**Nenhuma função joga exception em caminho normal. Tudo retorna Result<T>.**

```csharp
public Result<Score> CalculateScore(Loss loss)
{
    if (loss == null)
        return Result<Score>.Failure("Loss não pode ser nulo");
    
    if (loss.IsDuplicate)
        return Result<Score>.Failure("Loss duplicado não é analisável");
    
    var score = /* cálculo */;
    return Result<Score>.Success(score);
}
```

Benefício: Erro é dado estruturado, não string aleatória. UI sabe como renderizar. Frontend não desaba.

---

## AD-007: Documentação Antes de Código

**Data:** 2026-01-13 (Sprint 0)  
**Status:** ✅ Aprovada  
**Contexto de Impacto:** Alinhamento, qualidade, risco de reescrita

### Problema

Começar a codificar antes de ter visão e arquitetura claras é a forma clássica de reescrever 3 vezes.

### Decisão

**Sprint 0 é documentação:**
- Visão de produto
- Arquitetura técnica
- Dicionário de domínio
- Engines especificadas
- KPIs definidos
- Roadmap mapeado

Só depois Sprint 1 começa código.

### Benefício

Time inteiro começa na mesma página. Mudanças de design são discussão, não reescrita. Onboarding de novo dev é ler documentos.

---

## AD-008: Versioning de Algoritmos

**Data:** 2026-01-13 (Sprint 0)  
**Status:** 🔵 Aprovada (Implementação Sprint 2)  
**Contexto de Impacto:** Analytics, auditoria, reprodutibilidade

### Problema

Score calculado em janeiro pode ser diferente de score em março se algoritmo mudou. Como auditar qual versão foi usada?

### Decisão

**Toda análise registra versão de algoritmo.**

```csharp
public class Score
{
    public decimal Value { get; set; }
    public int AlgorithmVersion { get; set; }  // v1, v2, v3...
    public DateTime CalculatedAt { get; set; }
}
```

Motivo: Reprodutibilidade. Se cliente questiona um score de 6 meses atrás, você pode reexecutar com exata mesma versão.

---

## AD-009: Módulos Declarativos, não Imperativos

**Data:** 2026-01-13 (Sprint 0)  
**Status:** 🔵 Aprovada (Design Sprint 1, Impl Sprint 2)  
**Contexto de Impacto:** Extensibilidade, marketplace, terceiros

### Problema

Se cada novo módulo exigir customização no core, não escala.

### Decisão

**Módulos declaram suas capacidades; Core as aplica.**

```csharp
[RazarthModule("supermarket")]
public class SupermarketModule : IRazarthModule
{
    public ModuleCapabilities GetCapabilities() => new()
    {
        Engines = new[] { AnalyticsEngine, KnowledgeEngine },
        Entities = new[] { Loss, OperationalEvent, Score },
        Rules = new[] { AnomalyRules, ScoringRules },
        FeatureFlags = new[] { "monthly_reports", "alerts" }
    };
}
```

Motivo: Core não muda. Novo módulo = nova biblioteca com atributo `[RazarthModule]`.

---

## Sumário de Decisões Arquiteturais

| AD | Título | Status | Impacto |
|-----|--------|--------|--------|
| 001 | Platform com Supermarket como M1 | ✅ | Estratégia, produto |
| 002 | Multi-tenância desde dia 1 | ✅ | Banco, segurança |
| 003 | DDD, não Data-First | ✅ | Modelagem, qualidade |
| 004 | Engines como bibliotecas | ✅ | Arquitetura, teste |
| 005 | Rules Engine para config | ✅ | Flexibilidade |
| 006 | Result<T> everywhere | ✅ | Tratamento de erro |
| 007 | Docs antes de código | ✅ | Processo |
| 008 | Versioning de algoritmos | 🔵 | Auditoria |
| 009 | Módulos declarativos | 🔵 | Extensibilidade |

---

**Próximas Decisions a Documentar:**
- AD-010: Autenticação: JWT vs. Session
- AD-011: Frontend: React 19 vs. alternativas
- AD-012: Cache strategy
- AD-013: Async processing: Queues vs. Background Jobs
