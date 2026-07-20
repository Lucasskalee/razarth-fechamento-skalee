# GOLDEN_RULE.md

## A Regra Que Protege a Arquitetura

---

## A REGRA

```
"Toda nova funcionalidade deve tornar a plataforma MAIS GENÉRICA,
nunca mais ESPECÍFICA."
```

Essa regra única protege o Razarth de um dos maiores problemas de plataformas horizontais:

**Decay através de customização.**

---

## POR QUE ESSA REGRA IMPORTA

### O Antipadrão (Plataformas que morrem)

```
Ano 1:  5 clientes, 2 features genéricas (Agendamento, Varejo)
        Codebase: ~50K linhas
        Developers: 3
        Satisfação: 95%

Ano 2:  50 clientes, cada um pede "algo especial"
        Features adicionadas: 50 (uma por cliente)
        Codebase: ~200K linhas (4x)
        Developers: 8 (2.6x)
        Satisfação: 80% (algumas features para alguns clientes, ignoram outros)
        Debt: crescendo rápido

Ano 3:  500 clientes, processo auto-acelera
        Features adicionadas: 200 (customizações de customizações)
        Codebase: ~800K linhas (16x original!)
        Developers: 20 (6.6x)
        Satisfação: 50% (ninguém satisfeito, tudo é half-baked)
        Debt: impossível de gerenciar

Ano 4:  Startup novo surge com clean architecture
        Você perde 30% dos clientes para eles
        Cannot compete anymore
        
Resultado: Morte lenta
```

### O Padrão (Plataformas que prosperam)

```
Ano 1:  5 clientes, 2 features genéricas (Agendamento, Varejo)
        Codebase: ~50K linhas
        Developers: 3
        Satisfação: 95%

Ano 2:  50 clientes, mesmas 2 features
        Features adicionadas: 0 (respeitamos Golden Rule)
        Cliente pede: "Preciso de X"
        Perguntamos: "X é genérico?"
        Se não: "Use template customizado ou marketplace"
        Codebase: ~60K linhas (1.2x)
        Developers: 3
        Satisfação: 90% (+core features, -customizações)
        Debt: mínimo

Ano 3:  500 clientes, padrões emergem
        Pergunta: "Qual é o padrão em 50% das customizações?"
        Resposta: "Comissões de vendedor"
        Ação: Adiciona Distribuição de Receita (genérico)
        Features adicionadas: 2-3 (todas genéricas)
        Codebase: ~80K linhas (1.6x)
        Developers: 4
        Satisfação: 92% (core features melhoradas)
        Debt: baixo

Ano 4:  5000 clientes, padrões aparecem em marketplace
        Marketplace tem 500 items
        Revenue split: 30% Razarth, 70% Creators
        Razarth payout: R$ 5M/year de comissões
        Codebase: ~120K linhas (2.4x from start)
        Developers: 5 (escalada mínima!)
        Satisfação: 95% (core robusto, marketplace customizado)
        Debt: gerenciável

Resultado: Escalabilidade sustentável
```

---

## ONDE ESSA REGRA VIVE

### 1. Code Review

**Responsibility:** Todos reviewers, especialmente arquitetos

```
PR: "Add scheduling with 15min slots for barbershops"

Reviewer: "Does this work for clinics, academies, events?"

Author: "Ah, it's only tested with barbershops..."

Reviewer: "Make it generic. Remove barbershop-specific logic.
           If barbershops need 15min slots, that should work 
           for everyone who needs time-based scheduling."

Author: Refactors. Now it works for everyone.

Result: Generic feature added ✅
```

**Red Flags:**
- Any mention of specific business type in code
- Config keys that say "for_barbershop" or "for_restaurant"
- If/else that branches on "industry"
- Features that only work for 1 template

---

### 2. Feature Requests

**Responsibility:** Product team decides what's Core vs. Marketplace

```
Request 1:
Client: "Need to distribute revenue by commission %"

Team thinks:
  ✅ Generic? Yes (any multi-person operation)
  ✅ Works for 3+ templates? Yes (barbershops, academies, events)
  ✅ Can avoid segment-specific logic? Yes (it's math)
  ✅ Reuses existing code? Yes (Finance + Permissions)

Decision: CORE FEATURE ✅

---

Request 2:
Client: "Need to manage trainer certifications"

Team thinks:
  ❌ Generic? No (only for academies/personal training)
  ❌ Works for 3+ templates? No
  ❌ Can avoid segment-specific logic? No (entire thing is trainer-centric)

Decision: MARKETPLACE TEMPLATE ❌

Suggestion: Build as marketplace item or solution template
```

---

### 3. Architectural Decisions

**Responsibility:** Architecture board reviews quarterly

```
Question: "Should we add a 'Barbershop Module'?"

Answer per Golden Rule: "NO.

Barbershops use:
  - Scheduling capability
  - Catalog capability  
  - Portfolio capability
  - Communication capability
  
These are all generic and reusable.

There is no 'barbershop-specific' code.

A 'Barbershop Module' would be a template that combines those capabilities.
That's not a module, that's configuration.

Decision: Create Barbershop Template in marketplace, not in core."
```

---

### 4. Scope Decisions

**Responsibility:** Executive/product leadership

```
Scenario: 50% of marketplace feature requests are for "industry-specific reports"

Analysis:
  Industry A wants: Revenue by service type
  Industry B wants: Revenue by location
  Industry C wants: Revenue by team member

Temptation: Create "Flexible Report Builder"

Golden Rule check:
  ✅ Generic? YES (all industries want reports)
  ✅ Can be built without industry-specific logic? YES (it's querying + visualization)
  ✅ Reuses code? YES (data layer exists)

Decision: BUILD (as generic Reports capability)

Result: 1 generic feature serves 1000 use cases
        vs. 1000 specific reports in marketplace
```

---

## REAL-WORLD EXAMPLES

### Example 1: Scheduling Slots

**Request:** "Barbershops need 30-minute slots, salons need 60-minute"

**Without Golden Rule:**
```csharp
// ❌ BAD - Segment specific
class SchedulingService_Barbershop : ISchedulingService {
  private int SlotDuration = 30; // hardcoded
}

class SchedulingService_Salon : ISchedulingService {
  private int SlotDuration = 60; // hardcoded
}

Result: 2 implementations, duplicate code, maintenance nightmare
```

**With Golden Rule:**
```csharp
// ✅ GOOD - Generic, configurable
class SchedulingService : ISchedulingService {
  public TimeSlot CreateSlot(int durationMinutes, DateTime start) {
    // Generic logic works for any duration
  }
}

// Configuration:
Template Barbershop → config.slot_duration = 30
Template Salon → config.slot_duration = 60

Result: 1 implementation, N configurations, maintainable
```

---

### Example 2: Communication Channels

**Request:** "Salons want WhatsApp, restaurants want SMS, events want Email"

**Without Golden Rule:**
```csharp
// ❌ BAD - Channel specific
if (business_type == "barbershop") 
  SendViaWhatsapp();
else if (business_type == "restaurant")
  SendViaSMS();

Result: Nested if/else hell, breaks with new segment
```

**With Golden Rule:**
```csharp
// ✅ GOOD - Generic channel abstraction
ICommunicationChannel channel = GetConfiguredChannel(capability);
channel.Send(message, recipient);

// Configuration:
Barbershop template: whatsapp, sms
Restaurant template: sms, email
Event template: email, push notification

Result: 1 abstraction, N channel implementations, extensible
```

---

### Example 3: Payment Processing

**Request:** "Barbershop needs payment splits, restaurant needs recurring billing"

**Without Golden Rule:**
```csharp
// ❌ BAD - Use-case specific
class PaymentProcessor_Barbershop { /* commission logic */ }
class PaymentProcessor_Restaurant { /* subscription logic */ }

Result: 2 implementations, inconsistent
```

**With Golden Rule:**
```csharp
// ✅ GOOD - Generic payment abstraction
class Payment {
  public List<PaymentRecipient> recipients; // split support
  public RecurrenceRule recurrence; // recurring support
}

// Both barbershop and restaurant use same abstraction
Result: 1 implementation, infinite configurations
```

---

## THE FIVE QUESTIONS (Decision Making)

When someone proposes a new feature, ask:

```
1️⃣  Is this capability reusable across 3+ templates?
    If NO → It's marketplace, not core

2️⃣  Can it be built without segment-specific logic?
    If NO → It's customization, not feature

3️⃣  Does it follow existing architectural patterns?
    If NO → Refactor existing patterns first

4️⃣  Could 80%+ of it be configuration instead of code?
    If NO → Too specific, wrong layer

5️⃣  Will adding this make the system more generic or more specific?
    If MORE SPECIFIC → Reject (Golden Rule violation)
    If MORE GENERIC → Accept (Golden Rule fulfilled)
```

**All 5 must be YES to add to core.**

---

## CODE REVIEW CHECKLIST

For reviewers: When reviewing any PR, check:

```
☐ Does this code mention any specific business type/industry?
  If YES: Request refactor to remove industry reference

☐ Are there any if/else branches based on segment/template/industry?
  If YES: Extract to configuration or template-specific code

☐ Could another template benefit from this code?
  If NO: Question if it belongs in core

☐ Does this increase code duplication?
  If YES: Refactor to extract reusable abstraction first

☐ Is this configuration or code?
  If SHOULD BE CONFIGURATION: Move to config layer

☐ Could a developer explain this feature without mentioning a specific business type?
  If NO: It's too specific

☐ Will this feature work in 1 year with 100 new templates?
  If NO: Not ready to merge
```

---

## ENFORCEMENT MECHANISMS

### Automated Checks

```bash
# Lint check: No business-type-specific strings in core
❌ if (company.businessType == "barbershop")
❌ if (template.name.contains("barbershop"))
❌ config["barbershop_special_logic"]

# Every PR must pass: "Generic or Specific" test
git hook pre-commit: runs linter
ci/cd pipeline: blocks merge if violations found
```

### Human Checks

```
Architecture Board Review (monthly):
  - Last month's approved features: did they follow Golden Rule?
  - Are any features trending toward specific-ness?
  - Any debt accumulating?
  
Code Review Focus:
  - Every 5th PR: spot-check for Golden Rule compliance
  - New architects: 1st month = learn Golden Rule via mentorship
```

### Cultural Checks

```
Team Onboarding:
  - "Read RAZARTH_MANIFESTO.md" (mandatory)
  - "Golden Rule determines what you build" (1st architecture lesson)
  - "If you hear 'for barbershops' → refactor to generic" (code review training)

Decision Meetings:
  - Product asks: "Is this generic?"
  - If not, marketplace/partner response
  
Retrospectives:
  - Question: "Did we add specific or generic code this sprint?"
  - If specific: why? Could it be generic?
```

---

## WHAT HAPPENS IF YOU VIOLATE IT

### Scenario: You add barbershop-specific code

**Month 1-2:**
```
Barbershops love it: "Finally! Feature built for us!"
Code review passes: "Looks good"
```

**Month 3-6:**
```
Restaurants ask: "Can we use this?"
Answer: "No, it's barbershop-specific"
Restaurants: "But it's 90% what we need..."
You: "We'd need to refactor"
```

**Month 6-12:**
```
3 more industries want same feature
Codebase has 4 "implementations"
Debt accumulates: + months to maintain
Architecture becomes "mess"
```

**Year 2:**
```
New startup: "We have 1 generic scheduling feature"
They onboard 10 industries in 2 months
You're stuck maintaining 4 half-implementations
You lose competitiveness
```

---

## THE LONG-TERM BENEFIT

### Year 1
```
Codebase size: 50K lines
Developers: 3
Features: 10
Complexity: Simple
```

### Year 5 (WITH Golden Rule)
```
Codebase size: 120K lines (2.4x)
Developers: 5 (1.6x)
Features: 20 (core) + 500 (marketplace)
Complexity: Manageable
Scale: 5000+ customers
Revenue: 40% from marketplace
```

### Year 5 (WITHOUT Golden Rule)
```
Codebase size: 800K lines (16x)
Developers: 20 (6.6x)
Features: 500 (all in core, many half-done)
Complexity: Unmanageable
Scale: 500 customers (lost 90%)
Revenue: Declining (competitors win)
```

---

## FINAL STATEMENT

The Golden Rule is not a suggestion.

It's **the** thing that separates:
- Platforms that last (Shopify, Stripe, Atlassian)
- Platforms that die (100s of failed enterprise software)

Razarth will be tested on this rule every single day.

Every feature request is a decision:

**"Is this generic or specific?"**

If you answer correctly consistently, Razarth wins.

If you don't, it becomes a spaghetti mess in 3 years.

---

**Discipline now = Scale later.**

That's the Golden Rule.
