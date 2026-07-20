# Platform Principles — Laws That Prevent Decay

**Data:** 2026-07-20  
**Status:** ✅ **INVIOLABLE LAWS**  
**Purpose:** Prevent scope creep, protect architecture

---

## 🎯 Why We Need Platform Principles

As plataformas crescem, há uma tendência natural:

```
Year 1: "Vamos criar engines reutilizáveis"
        ✅ Faz sentido

Year 2: "Este template precisa de customização especial"
        ✅ Faz sentido também

Year 3: "Este template REALMENTE precisa de exceção"
        ✅ Ainda parece razoável

Year 4: "Temos 15 exceções diferentes"
        ❌ Arquitetura virou dumping ground

Year 5: "Cada template é um mundo diferente"
        ❌ Não é mais plataforma, é coleção de verticais
```

**Platform Principles existem para evitar isso.**

---

## 📋 Os Princípios

### PRINCIPLE 01: Reusable Capabilities, Not Segment Modules

```
RULE:
O Razarth NÃO cria módulos para segmentos.
O Razarth cria CAPACIDADES reutilizáveis.
Os segmentos COMBINAM capacidades diferentes.

ENFORCEMENT:
Toda PR precisa responder:
├─ Estou criando exceção para um segmento?
├─ Ou estou criando capacidade genérica?
└─ Quantos segmentos vão usar isso?

FAIL CONDITION:
"Isso é só para barbearia" = NÃO ACEITO
"Isso é genérico, 5 segmentos usam" = ACEITO
```

**Exemplos:**

❌ ERRADO:
```
Módulo: Barbershop Portfolio
Descrição: Galeria de fotos de trabalhos de barbearia
```

✅ CERTO:
```
Engine: Media Gallery
Descrição: Galeria genérica com tags, ordenação, likes
Usada por: Barbershop, Salão de beleza, Fotógrafo, Eventos
```

---

### PRINCIPLE 02: One Source of Truth Per Domain

```
RULE:
Cada conceito core tem UMA implementação.
Não existe "agendamento da barbearia" e "agendamento do evento".
Existe o Schedule Engine. Ponto.

ENFORCEMENT:
Code review deve perguntar:
├─ Você duplicou lógica que existe em outro lugar?
├─ Você ajustou um engine existente?
└─ Por que não reusar?

FAIL CONDITION:
Descobrir 3 implementações diferentes de agendamento = Refator obrigatório
```

**Exemplos:**

❌ ERRADO (Duplicação):
```
Service: BarbershopScheduleService
Service: EventScheduleService
Service: CondominiumScheduleService
```

✅ CERTO (Uma fonte):
```
Engine: ScheduleEngine (core)
├─ BarbershopScheduler extends ScheduleEngine
├─ EventScheduler extends ScheduleEngine
└─ CondominiumScheduler extends ScheduleEngine
```

---

### PRINCIPLE 03: Template-Specific Logic Lives in Templates

```
RULE:
Core Platform = genérico e invariável
Templates = especializações

Se você quer adicionar lógica específica de barbershop ao Core = REJEITO
Se você quer adicionar no Template Barbershop = ACEITO

ENFORCEMENT:
Code review:
├─ Isso é Core ou Template?
├─ Se Core, é realmente genérico?
├─ Se Template, está no diretório certo?

FAIL CONDITION:
Lógica de barbershop no Core = Architecture violation
```

**Estrutura:**

```
Core Platform/
├─ Engines/         ← Genérico, reutilizável
├─ Common/          ← Compartilhado, abstrato
└─ Services/        ← Sem conhecimento de template

Templates/
├─ Barbershop/      ← Lógica específica de barbearia aqui
├─ Restaurant/      ← Lógica específica de restaurante aqui
└─ Event/           ← Lógica específica de evento aqui
```

---

### PRINCIPLE 04: Configuration Over Customization

```
RULE:
Antes de customizar código, use configuração.
Antes de fazer código específico, use feature flags.
Antes de ramificar, reutilize com parâmetros.

ENFORCEMENT:
Product Manager pergunta: "Precisamos dessa exceção?"
Tech Lead responde:
├─ "Já tentou feature flag?"
├─ "E se fosse uma configuração?"
├─ "Ou é realmente um engine novo?"

FAIL CONDITION:
Commit com lógica hardcoded para 1 template = Pedir refator
```

**Hierarquia:**

```
1. Usar default do engine
   (Prioridade 1: Máxima reutilização)

2. Usar feature flag
   (Prioridade 2: Controlável sem deploy)

3. Usar configuração
   (Prioridade 3: Template-specific, mas genérica)

4. Estender engine
   (Prioridade 4: Novo código, mas reutilizável)

5. Template-specific code
   (Prioridade 5: Último recurso)
```

---

### PRINCIPLE 05: No Permission Exceptions

```
RULE:
Sistema de permissões é universal.
Não existe "permissão especial para barbershop".
Role + Claim + Policy é suficiente para todos.

ENFORCEMENT:
Alguém diz: "Barbershop precisa de uma permissão que não existe"

Tech Lead pergunta:
├─ Qual role?
├─ Qual capability?
├─ Qual é o escopo?
└─ Como isso se generaliza?

FAIL CONDITION:
Criar um tipo de permission nova para 1 template = Rejeitar, abstrair
```

**Exemplo:**

❌ ERRADO:
```
Permission: BarberCanApproveSchedule
Permission: EventCanApproveParticipant
Permission: CondoCanApproveResident
```

✅ CERTO:
```
Role: Approver
Claim: approve:schedule (genérico)
Policy: Apply at workspace level
```

---

### PRINCIPLE 06: Marketplace Items Extend, Never Replace

```
RULE:
Marketplace pode adicionar capacidades.
Marketplace NUNCA substitui capacidades core.
Um theme nunca deve remover funcionalidade.

ENFORCEMENT:
Marketplace review:
├─ Isso estende a plataforma?
├─ Ou substitui algo que já existe?
└─ Users conseguem reverter?

FAIL CONDITION:
Theme que desativa core feature = Rejeitar do marketplace
```

---

### PRINCIPLE 07: Data Model is Stable and Evolves Forward

```
RULE:
Core data model nunca muda para trás.
Sempre additive, nunca breaking.
Migrations são sempre "add coluna", nunca "delete coluna".

ENFORCEMENT:
Migration review:
├─ Estou removendo algo?
├─ Ou estou adicionando?
└─ Templates antigos vão quebrar?

FAIL CONDITION:
Migration com DROP TABLE = Não aceito, refatore
```

**Implementação:**

```
❌ ERRADO (Breaking):
ALTER TABLE products DROP COLUMN price;

✅ CERTO (Forward-compatible):
ALTER TABLE products ADD COLUMN price_v2 DECIMAL(10,2);
-- Migrate data
-- Keep price como deprecated
-- Remover em major version (com deprecation notice)
```

---

### PRINCIPLE 08: One Deployment, Multiple Templates

```
RULE:
Razarth é UMA plataforma.
Todos os templates rodam na MESMA instância.
Não é possível ter versão diferente de template por usuário.

ENFORCEMENT:
Deploy:
├─ Todo mundo atualiza junto
├─ Compatibilidade é garantida
└─ Rollback afeta todos

FAIL CONDITION:
"Template A usa versão 1, Template B usa versão 2" = Violação
```

**Implicação:**

Isso significa que versionar é GLOBAL.

```
Release 1.0:
├─ Barbershop template v1.0
├─ Restaurant template v1.0
└─ Event template v1.0

Release 1.1:
├─ Barbershop template v1.1
├─ Restaurant template v1.1
└─ Event template v1.1

Nunca: Barbershop 1.1 + Restaurant 1.0
```

---

### PRINCIPLE 09: Monitoring and Observability Are First-Class

```
RULE:
Toda capacidade reutilizável precisa de observabilidade.
Se não consigo debuggar, é código frágil.

ENFORCEMENT:
Code review:
├─ Tem logs?
├─ Tem métricas?
├─ Tem traces distribuído?
└─ Conseguo debuggar em produção?

FAIL CONDITION:
Código sem observabilidade = Code review rejeita
```

**Padrão:**

```
Toda função crítica precisa de:
├─ Structured logging
├─ Distributed tracing
├─ Performance metrics
├─ Error tracking
└─ Alert conditions
```

---

### PRINCIPLE 10: API Contracts Are Sacred

```
RULE:
Uma vez publicado, um endpoint NUNCA muda de contrato.
Se precisa mudar, é novo endpoint com versão.

ENFORCEMENT:
API review:
├─ Estou mudando um endpoint existente?
├─ Estou adicionando novo endpoint?
├─ Versionar se remover/mudar campos?

FAIL CONDITION:
Mudança de contrato sem versão = Code review rejeita
```

**Versioning:**

```
❌ ERRADO:
GET /api/schedules
└─ Remove campo "price"

✅ CERTO:
GET /api/v1/schedules      ← Original, mantém "price"
GET /api/v2/schedules      ← Nova versão, sem "price"
```

---

## 🛡️ Enforcement

### Code Review Checklist

Toda PR precisa passar por este checklist:

```
☐ Principle 01: É capacidade reutilizável ou exceção?
☐ Principle 02: Tem duplicação de lógica?
☐ Principle 03: Lógica template-específica está no lugar certo?
☐ Principle 04: Tentou configuração antes de customizar?
☐ Principle 05: Sistema de permissões foi estendido?
☐ Principle 06: Marketplace item estende ou substitui?
☐ Principle 07: Data model é forward-compatible?
☐ Principle 08: Compatibilidade com todos os templates?
☐ Principle 09: Observabilidade está implementada?
☐ Principle 10: Contratos de API são versionados?
```

Se falhar em UMA, precisa refaturar.

---

## 📊 Metrics

Para saber se os princípios estão funcionando:

```
Métrica: Code Reuse Ratio
Target: > 80% (modules reused across templates)
Bad: < 60% (indication of duplication)

Métrica: Template-Specific Ratio
Target: 10-15% (only template-specific code where needed)
Bad: > 30% (indication of too many exceptions)

Métrica: Breaking Changes
Target: 0 per release
Bad: > 1 (indication of failing principle 07)

Métrica: Permission Custom Rules
Target: 0
Bad: > 3 (indication of failing principle 05)
```

---

## 🎯 Final Note

Platform Principles não são sugestões.

São **leis que protegem a arquitetura**.

Quando alguém disser "mas neste caso é diferente", a resposta é:

> "Qual princípio você quer violar?"

Se não consegue reutilizar dentro dos princípios, o princípio pode estar errado.

Mas então TODOS precisam discutir e MUDAR O PRINCÍPIO.

Não é um ou outro fazendo exceção.

---

**Status:** 🟢 **PLATFORM PRINCIPLES DEFINED - GUARDRAILS IN PLACE**
