# 🔒 Protetor do Core — Checklist de Vigilância Arquitetural

> **Este documento protege o Core de se virar um dumping ground de exceções.**

---

## O Problema Clássico

Muitos projetos começam com arquitetura limpa. Depois:

1. **Sprint 2:** "Vamos adicionar essa regra no Core porque é só essa vez"
2. **Sprint 3:** "Aquele módulo precisa de um serviço no Core"
3. **Sprint 5:** "Todos os módulos precisam desse handler no Core"
4. **Sprint 10:** Core é um spaghetti de "exceções". Novo módulo herda tudo.

**Resultado:** O que era ouro virou chumbo.

---

## Solução: Checklist de PR

**Toda PR que toca em `Razarth.Core`, `Razarth.Application`, `Razarth.Infrastructure` deve passar por este checklist.**

### 1️⃣ Esta mudança está no Core?

**Pergunta:** Por que essa mudança deve estar no Core e não em um módulo?

**Respostas aceitáveis:**
- ✅ "Autenticação é necessária para todos os módulos"
- ✅ "Multi-tenancy é fundação"
- ✅ "Logging estruturado é infraestrutura compartilhada"

**Respostas que indicam problema:**
- ❌ "Porque é mais fácil"
- ❌ "Porque todos os módulos precisam"
- ❌ "Porque vai ser reutilizado um dia"

### 2️⃣ Esta mudança é específica de um módulo?

**Pergunta:** Esta mudança seria útil para ANY módulo, ou apenas para supermercado?

**Respostas aceitáveis:**
- ✅ "Todos os módulos precisam de upload de arquivo"
- ✅ "Todos os módulos precisam de notificação"
- ✅ "É uma interface genérica (ex: `IAIAssistant`)"

**Respostas que indicam problema:**
- ❌ "Supermercado precisa calcular score"
- ❌ "Supermercado precisa de análise de anomalia"
- ❌ "Supermercado precisa de dashboard de perdas"

→ **Se é específico de supermercado, vai em `Razarth.Modules.Supermarket`.**

### 3️⃣ Esta mudança quebra a interface IModule?

**Pergunta:** Um novo módulo (ex: Barbearia) conseguiria compilar e rodar sem conhecer esta mudança?

**Se NÃO, há um problema.**

**Exemplo de problema:**
```csharp
// ❌ ERRADO: Módulo novo precisa conhecer ScoringEngine
public interface IModule
{
    void Register(IServiceCollection services);
    // Mas Program.cs assume que existe ScoringEngine
}

// ✅ CERTO: Módulo novo é independente
public interface IModule
{
    void Register(IServiceCollection services);
    void MapEndpoints(IEndpointRouteBuilder app);
    // Program.cs não assume nada além disso
}
```

### 4️⃣ Esta mudança viola Domain-Driven Design?

**Pergunta:** Você está colocando lógica de negócio no Core?

**Respostas aceitáveis:**
- ✅ "Sou apenas um helper para parsing"
- ✅ "Sou uma interface agnóstica (não sei de negócio)"
- ✅ "Sou infraestrutura (logging, cache, etc)"

**Respostas que indicam problema:**
- ❌ "Estou implementando uma regra de supermercado"
- ❌ "Estou calculando um score ou anomalia"
- ❌ "Estou decidindo se algo é válido ou não (exceto auth/multi-tenancy)"

→ **Regras de negócio vivem em módulos, não em Core.**

### 5️⃣ Esta mudança deixa o Core mais acoplado?

**Pergunta:** Para entender esta mudança, preciso conhecer detalhes de um módulo?

**Se SIM, há acoplamento.**

**Exemplo de acoplamento:**
```csharp
// ❌ ERRADO: Core conhece detalhes de Supermarket
public class AnalysisService
{
    public void Analyze(Loss loss)  // ← Loss é de Supermarket!
    {
        // ...
    }
}

// ✅ CERTO: Core trabalha com abstrações
public class AnalysisService
{
    public void Analyze(IAnalyzable item)  // ← Interface genérica
    {
        // ...
    }
}
```

---

## Exemplos Práticos

### ✅ PR Aprovada: TenantMiddleware

**Mudança:** Adicionar middleware que resolve tenant do header HTTP.

**Checklist:**
- ✅ "Esta mudança está no Core?" → SIM, porque multi-tenancy é fundação.
- ✅ "Esta mudança é específica de um módulo?" → NÃO, todos precisam.
- ✅ "Esta mudança quebra IModule?" → NÃO, IModule não conhece isso.
- ✅ "Esta mudança viola DDD?" → NÃO, é infraestrutura.
- ✅ "Esta mudança deixa Core mais acoplado?" → NÃO, é agnóstico.

**Resultado:** APROVED ✅

---

### ❌ PR Rejeitada: ScoringEngine no Core

**Mudança:** Mover ScoringEngine de `Razarth.Modules.Supermarket.Application` para `Razarth.Application`.

**Checklist:**
- ❌ "Esta mudança está no Core?" → POR QUÊ? É específico de Supermercado!
- ❌ "Esta mudança é específica de um módulo?" → SIM! Score é de Supermercado.
- ❌ "Esta mudança quebra IModule?" → SIM! Módulo Barbearia não tem Score.
- ❌ "Esta mudança viola DDD?" → SIM! Score é lógica de domínio de Supermercado.
- ✅ "Esta mudança deixa Core mais acoplado?" → SIM, Core conheceria detalhes de Supermercado.

**Resultado:** REJECTED ❌

**Feedback:** "ScoringEngine é uma abstração de Supermercado. Deixa em `Razarth.Modules.Supermarket.Application`. Se outros módulos precisarem, criamos uma interface genérica."

---

### ✅ PR Aprovada: IAnalyticsProvider Interface

**Mudança:** Adicionar interface `IAnalyticsProvider` no Core que cada módulo implementa.

**Checklist:**
- ✅ "Esta mudança está no Core?" → SIM, é um contrato de extensibilidade.
- ✅ "Esta mudança é específica de um módulo?" → NÃO, qualquer módulo pode implementar.
- ✅ "Esta mudança quebra IModule?" → NÃO, é apenas uma interface.
- ✅ "Esta mudança viola DDD?" → NÃO, é abstração pura.
- ✅ "Esta mudança deixa Core mais acoplado?" → NÃO, Core não conhece implementações.

**Resultado:** APPROVED ✅

---

### ❌ PR Rejeitada: "Adicionar suporte a Desconto em Core"

**Mudança:** Core vai ter entidade `Discount` para ser reutilizada.

**Checklist:**
- ❌ "Esta mudança está no Core?" → POR QUÊ? Supermercado precisa, Barbearia tem coupon...
- ❌ "Esta mudança é específica de um módulo?" → CADA MÓDULO TEM CONCEITO DIFERENTE.
- ❌ "Esta mudança quebra IModule?" → Sim, força acoplamento.
- ❌ "Esta mudança viola DDD?" → SIM, Domain é diferente por módulo!
- ✅ "Esta mudança deixa Core mais acoplado?" → SIM.

**Resultado:** REJECTED ❌

**Feedback:** "Cada módulo define seu próprio conceito. `Razarth.Modules.Supermarket` tem `Discount`. `Razarth.Modules.Barbershop` tem `Coupon`. São coisas diferentes. Se quer reutilizar código, cria Helper/Utility no Shared, não entidades no Core."

---

## 🛡️ Regras de Ouro

### Regra 1: Core é Infrastructure, não Domain

```csharp
// ✅ Core (Infrastructure)
public interface ITenantResolver { Guid? GetTenantId(); }
public interface IFileUploadService { Task<string> UploadAsync(...); }
public interface IAIAssistant { Task<AIResponse> AskAsync(...); }

// ❌ Core (seria Domain)
public class Loss { }  // ← Vai em Supermarket Module
public class Score { }  // ← Vai em Supermarket Module
public decimal CalculateAnomalyScore(...) { }  // ← Vai em Supermarket Engine
```

### Regra 2: Interfaces Sim, Implementações Não

```csharp
// ✅ Core pode ter interface
public interface IAnalyticsProvider
{
    Task<AnalysisResult> AnalyzeAsync(AnalysisRequest request);
}

// ❌ Core não deve ter implementação de lógica de negócio
public class ScoringAnalyticsProvider : IAnalyticsProvider { }  // ← Não!
// Isso vai em Supermarket module
```

### Regra 3: "Só Essa Vez" é a Porta para o Caos

Conversa típica que deve ser bloqueada:

```
Dev: "Vamos adicionar essa validação no Core porque é só essa vez"
Protetor: "Não. Se é regra de negócio, vai no módulo."
Dev: "Mas todos os módulos precisam..."
Protetor: "Então cria uma interface genérica em Core, não uma implementação."
Dev: "Tá, mas depois?"
Protetor: "Nada 'depois'. Se novos módulos precisarem, eles implementam."
```

### Regra 4: Core é o Contrato, Módulos são as Implementações

```
Core: "Quero logs estruturados, autenticação, multi-tenancy"
Supermarket: "Eu implemento Loss, Score, Anomaly Detection"
Barbershop: "Eu implemento Appointment, Barber, Schedule"
Restaurant: "Eu implemento Order, Menu, Delivery"

Ninguém toca no contrato porque precisa de exceção.
```

---

## 🔍 Autoavaliação: Está o Core Limpo?

Faça esta checklist regularmente (a cada sprint):

- [ ] Core não tem imports de nenhum `Razarth.Modules.*`
- [ ] Core não tem classes Entity com lógica específica de negócio
- [ ] Core não tem > 3 exceptions customizadas
- [ ] Core tem <20 services (se tem mais, algo está errado)
- [ ] Cada serviço no Core serve "qualquer módulo"
- [ ] Nenhuma tabela no banco é específica de um módulo fora de seu DbContext
- [ ] IModule foi estendida, não modificada (backward compatible)
- [ ] Um novo dev entende Core em <2 horas de leitura

**Se todas estão checked:** Core está saudável ✅

---

## 📋 Processo de Review

**Toda PR que modifica Core:**

1. **Submitter completa o checklist** (5 perguntas acima)
2. **Revisor 1 (Tech Lead) valida o checklist**
3. **Revisor 2 (Architecture) aprova ou rejeita**
4. **Se rejeitada, volta ao submitter com feedback claro**

**Tempo de review:** 15-30 min  
**Bloqueador:** Sim, PRs ao Core exigem 2 approvals

---

## 🎓 Treinamento Novo Dev

Quando novo dev chega:

1. Ler este documento
2. Ler ARCHITECTURE_DECISIONS.md (entender por quê)
3. Ler MODULE_SYSTEM.md (entender como criar módulo)
4. Fazer PR fake: adicionar um service no Core. Time revisa e explica por quê foi aceito/rejeitado.

**Objetivo:** Novo dev entende a disciplina **antes** de quebrar algo.

---

## 🚨 Quando o Core Ficou Sujo?

Se a checklist começar a falhar, é hora de refatorar.

**Sinais de alerta:**

- 🔴 Core tem >50 services
- 🔴 Novo dev quer "adicionar mais uma coisa" no Core
- 🔴 Um módulo importa classes de outro módulo
- 🔴 Não consegue explicar em 1 minuto por que algo está no Core

**Ação:**
1. Pausar novas features
2. Sprint de refatoração: mover lógica de volta para módulos
3. Estabelecer "Core Quarantine" período onde só bugfixes
4. Depois volta o desenvolvimento

**Custo de refatorar cedo:** 1-2 semanas  
**Custo de refatorar tarde:** 2-3 meses

---

## 🏁 Conclusão

Core é sagrado.

**Não por ego arquitetônico, mas porque:**
- Core é o contrato entre todos os módulos
- Se Core muda, todos os módulos sofrem
- Se Core fica sujo, novo módulo herda sujeira
- Se Core é limpo, escalar é gratuito

**Esta vigilância evita um clássico erro de engenharia:**
Começar com visão e terminar com caos.

---

**Status:** 🟢 Ativo — Esta checklist será usada em TODA PR que toca Core.

