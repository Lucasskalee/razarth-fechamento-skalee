# Razarth Platform — Empresa de Software
## Fase atual: Documentação completa, iniciando Sprint 1

---

## 🎯 Estratégia: Casa Primeiro, Depois as Cortinas

**Versão anterior:** Razarth Intelligence (produto único)  
**Nova versão:** Razarth Platform (modular) + Razarth Supermarket (Módulo 1)

### A Diferença Crucial

- ❌ Não fazemos dashboard bonito com arquitetura fraca
- ✅ Primeiro construímos fundação sólida (Sprint 1)
- ✅ Depois colocamos os móveis e pintamos (Sprint 2+)

---

## 📋 Roadmap de Sprints

### **Sprint 0** ✅ Completo
Documentação arquitetural de qualidade.

**Docs criados:**
- PRODUCT_VISION.md, CORE_ARCHITECTURE.md, ARCHITECTURE_DECISIONS.md
- MODULE_SYSTEM.md, BUSINESS_DICTIONARY.md
- ANALYTICS_ENGINE.md, KNOWLEDGE_ENGINE.md, KPI_CATALOG.md, FORMULA_BOOK.md
- SPRINT_0_SUMMARY.md

### **Sprint 1** 🚀 Próximo: Foundation
Construir a casa (Core Platform).

**Sem UI, sem lógica de negócio. Apenas infraestrutura.**

Sequência:
1. Core + Clean Architecture
2. Multi-tenancy (Company, User, Membership, Roles)
3. Data Layer (EF Core + Supabase, Soft Delete, Auditoria)
4. Autenticação (JWT, Refresh Token, RBAC)
5. Core Services (Config, Upload, Logging, Notifications, Events)
6. IA Interface (agnóstica, sem implementação)
7. Module SDK (IModule, Discovery automático)
8. API Base (Health checks, Versioning)
9. Testes (>85% coverage)

**Duração:** 4-6 semanas  
**Resultado:** Plataforma rodando, pronta para módulos

### **Sprint 2**: Módulo Supermarket
Primeiro módulo plugável.

**Traz:**
- Razarth.Modules.Supermarket (IModule implementado)
- Domain entities (Product, Store, Sector, Loss, etc)
- Engines puras (Analytics, Knowledge, Investigation)
- Rules Engine (configuração sem código)
- API endpoints
- Dashboard React 19
- Testes >85%

**Duração:** 5-7 semanas  
**Resultado:** Supermercado Sol operacional

### **Sprint 3**: Marketplace + IA
Marketplace de módulos + IA Implementation.

**Traz:**
- Marketplace UI (descoberta, instalação)
- IA com OpenAI/Claude
- Feature flags por módulo

### **Sprint 4**: Segundo Módulo
Prova de conceito: Razarth.Modules.Barbershop.

**Traz:**
- Novo módulo via SDK (sem tocar no Core)
- Validação que arquitetura é extensível

---

## 🏛️ Hierarquia: Core > Módulos > Features

```
Razarth Platform
├── Core (nunca muda para satisfazer 1 módulo)
│   ├── Auth & RBAC
│   ├── Multi-tenancy
│   ├── Data Layer
│   ├── IA Interface
│   └── Module Discovery
│
├── Razarth.Modules.Supermarket
│   ├── Domain (Loss, Product, Store, Sector)
│   ├── Engines (Analytics, Knowledge, Investigation)
│   ├── Rules (Configuração)
│   ├── API
│   └── UI
│
├── Razarth.Modules.Barbershop (Sprint 4)
│   ├── Domain (Appointment, Barber, Service)
│   ├── Engines (Scheduling, Marketing)
│   ├── API
│   └── UI
│
└── ...
```

---

## 🚫 Disciplina de Arquitetura

**Regra de ouro:** 
Se alguém disser "vamos adicionar uma regra específica no Core porque é só essa vez", **a resposta é NÃO**.

**Por quê?**
- Primeira "exceção" = 10% da métrica de pureza
- Décima exceção = 100% corruição, Core virou dumping ground
- Novo módulo herda peso dos anteriores
- Refatoração fica impossível

**Protetor do Core:** Toda PR em Sprint 1 tem checklist:
- Esta mudança está no Core quando deveria estar em um Módulo?
- Esta mudança depende de um módulo específico?
- Esta mudança quebra a interface `IModule`?
- Esta mudança viola DDD?

---

## 📊 Progresso Atual

| Documento | Status |
|-----------|--------|
| PRODUCT_VISION.md | ✅ Completo |
| CORE_ARCHITECTURE.md | ✅ Completo |
| ARCHITECTURE_DECISIONS.md | ✅ Completo (9 decisões) |
| MODULE_SYSTEM.md | ✅ Completo |
| BUSINESS_DICTIONARY.md | ✅ Completo |
| ANALYTICS_ENGINE.md | ✅ Completo |
| KNOWLEDGE_ENGINE.md | ✅ Completo |
| KPI_CATALOG.md | ✅ Completo |
| FORMULA_BOOK.md | ✅ Completo |
| SPRINT_1_FOUNDATION.md | ✅ Completo |
| SPRINT_2_SUPERMARKET_MODULE.md | ✅ Completo |
| **Total** | **11 docs, ~150 KB** |

---

## 🎯 Critério de Sucesso Final

- ✅ Documentação clara e navegável
- ✅ Arquitetura aprovada por review board
- ✅ Sequência de sprints realista
- ✅ Disciplina de Core protegido
- ✅ Pronto para começar Sprint 1

---

**Próximo passo:** Iniciar Sprint 1 — Criar Razarth.sln em Clean Architecture
