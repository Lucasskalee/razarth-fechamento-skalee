# Razarth Platform

> **Plataforma modular para inteligência operacional de negócios.**

Começamos com uma visão: resolver o problema real de supermercados (perdas e gestão).  
Evoluímos para uma estratégia: construir uma plataforma que serve qualquer negócio.  
Agora: Documentação de qualidade, arquitetura aprovada, pronto para implementação.

---

## 🎯 O que é Razarth?

**Produtos diferentes. Uma plataforma.**

```
Razarth Platform

├── Supermercados
├── Barbearias
├── Restaurantes  
├── Clínicas
├── Academias
└── ...
```

Cada um tem seu próprio módulo. Todos compartilham autenticação, multi-tenância, IA, observabilidade.

---

## 📊 Status Atual

- ✅ **Sprint 0 Completo:** Documentação arquitetural (14 docs, ~200 KB)
- ✅ **9 Decisões Arquiteturais** documentadas com rastreabilidade
- ✅ **Roadmap de 4 sprints** definido (6-8 meses)
- 🚀 **Sprint 1 Próximo:** Fundação da Platform (4-6 semanas)

---

## 📁 Começar Aqui

### Novo dev? Leia em ordem:
1. `docs/PRODUCT_VISION.md` — Por que Razarth existe
2. `docs/CORE_ARCHITECTURE.md` — Estrutura técnica
3. `docs/ARCHITECTURE_DECISIONS.md` — Decisões com contexto
4. `docs/MODULE_SYSTEM.md` — Como criar módulos

### Tech Lead? Começa aqui:
1. `docs/ARCHITECTURE_DECISIONS.md` — Entender porquê
2. `docs/CORE_GUARDIAN.md` — Checklist de PR
3. `docs/SPRINT_1_FOUNDATION.md` — Próximo sprint

### Arquiteto? Começa aqui:
1. `docs/FINAL_APPROVAL_SPRINT_0.md` — Status geral
2. `docs/CORE_ARCHITECTURE.md` — Design geral
3. `docs/MODULE_SYSTEM.md` — Extensibilidade

---

## 🏗️ Arquitetura

```
Razarth Platform
├── Core (Compartilhado)
│   ├── Autenticação JWT + RBAC
│   ├── Multi-tenância
│   ├── Data Layer (EF Core + Supabase)
│   ├── Configuration Service
│   ├── File Upload Service
│   ├── Logging & Events
│   ├── Notifications
│   └── Module Discovery
│
├── Razarth.Modules.Supermarket
│   ├── Domain (Loss, Product, Store, Sector)
│   ├── Engines (Analytics, Knowledge, Investigation)
│   ├── Rules (Configuração)
│   ├── API
│   └── Web UI
│
└── Razarth.Modules.{Barbershop,Restaurant,...}
```

**Regra de ouro:** Cada módulo é independente. Core não muda para satisfazer 1 módulo.

---

## 🔑 Decisões Arquiteturais

9 ADRs documentadas em `ARCHITECTURE_DECISIONS.md` com contexto, alternativas e impacto.

---

## 📋 Roadmap

### Sprint 0 ✅ COMPLETO
Documentação arquitectural

### Sprint 1 🚀 4-6 SEMANAS
Fundação da Platform (Core)

### Sprint 2 5-7 SEMANAS
Razarth.Modules.Supermarket

### Sprint 3
Marketplace + IA Implementation

### Sprint 4
Validação: Razarth.Modules.Barbershop

---

## 🛡️ Disciplina de Arquitetura

Leia `docs/CORE_GUARDIAN.md` para entender como protegemos o Core de se virar um dumping ground.

---

## 📚 Documentos

- PRODUCT_VISION.md
- CORE_ARCHITECTURE.md
- ARCHITECTURE_DECISIONS.md
- MODULE_SYSTEM.md
- BUSINESS_DICTIONARY.md
- ANALYTICS_ENGINE.md
- KNOWLEDGE_ENGINE.md
- KPI_CATALOG.md
- FORMULA_BOOK.md
- SPRINT_1_FOUNDATION.md
- SPRINT_2_SUPERMARKET_MODULE.md
- CORE_GUARDIAN.md
- FINAL_APPROVAL_SPRINT_0.md

---

**Sprint 0 Completo. Sprint 1 Começando. Pronto para escalar.**
