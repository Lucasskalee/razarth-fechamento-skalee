# 📊 Razarth Platform — Status de Outubro

**Data:** 2024-01-15  
**Fase:** Sprint 1.2 Planning  
**Status:** ✅ Documentação congelada, pronto para implementação

---

## 🎯 A Mudança Fundamental

### Sprint 0-1.1: Documentação + Arquitetura
- ✅ 22+ documentos arquiteturais
- ✅ 9 ADRs (decisões congeladas)
- ✅ Clean Architecture .NET 9 (8 projetos)
- ✅ CI/CD com GitHub Actions
- ✅ Governança (10 pastas de docs)
- **Resultado:** 9.5/10 arquitetura, 0.1/10 produto

### Sprint 1.2+: Implementação MVP
- 🚀 Novo direcionamento: SaaS multi-tenant (não analytics)
- 📋 MVP congelado: 5 passos (signup → empresa → perfil → catálogo → whatsapp)
- 🔐 Multi-tenancy desde o dia 1
- 📅 6-8 semanas para primeiro cliente

---

## 📈 Avaliação do Status

| Dimensão | Nota | O Que Falta |
|----------|------|-----------|
| **Arquitetura** | 9.5/10 | Nada (congelada) |
| **Documentação** | 9/10 | Leve ajuste pós-Sprint 1.2 |
| **Produto** | 0.1/10 | Database + APIs + Frontend |
| **Governança** | 10/10 | Completa |

---

## 🔄 O Que Mudou de Sprint 0 para Agora

### Sprint 0: Razarth Intelligence
```
Sistema especializado para supermercados
├── Analytics avançada
├── IA integrada
├── Gestão operacional
└── Marketplace de módulos
```

### Sprint 1.2+: Razarth Platform
```
Plataforma SaaS para PMEs
├── Signup + Empresa (5 min)
├── Página pública por slug
├── Catálogo de produtos
├── WhatsApp (CTA)
└── Futuro: Analytics, IA, Integrações
```

---

## 🏗️ Novo Modelo de Domínio

**Congelado em `docs/10-PLATFORM/00-STRATEGIC_DIRECTION.md`:**

```
Platform
│
├── Tenant (isolação administrativa)
├── Company (empresa do cliente)
├── User (usuário da plataforma)
├── Membership (user ↔ company)
├── Plan (plano de subscription)
├── Subscription (contrato ativo)
├── Module (funcionalidade)
├── CompanyModule (qual módulo cada empresa usa)
├── PublicProfile (página pública)
├── Domain (customizado — futuro)
├── Settings (configurações)
└── AuditLog (LGPD compliance)
```

---

## 🔐 Isolamento Multi-Tenant (3 Camadas)

### 1. Middleware
```
GET /api/products
Header: X-Company-Id: <uuid>
```

### 2. Authorization
```
[RequiresCompanyMembership]
↓
Verifica se user tem Membership naquela company
```

### 3. Database
```
SELECT * FROM products WHERE company_id = :current
```

**Resultado:** Impossível um usuário acessar dados de outra empresa.

---

## 📅 Roadmap Confirmado (Sprints 1.2-1.8)

| Sprint | Task | Dias | Dependência |
|--------|------|------|------------|
| **1.2** | Database (novo modelo) | 3-4 | — |
| **1.3** | Multi-tenancy (TenantMiddleware) | 2-3 | 1.2 ✅ |
| **1.4** | Auth (JWT, RBAC) | 3-4 | 1.3 ✅ |
| **1.5** | Storage (uploads) | 2-3 | — |
| **1.6** | Página pública (/{slug}) | 3-4 | 1.2 + 1.3 ✅ |
| **1.7** | Catálogo de produtos | 3-4 | 1.4 + 1.5 ✅ |
| **1.8** | Testes + CI green | 3-5 | 1.7 ✅ |

**Total:** 5-6 semanas para MVP vendável

---

## ✅ Checklist Sprint 1.2 (Próximo)

- [ ] Criar 11 tabelas (Users, Companies, Memberships, Plans, Subscriptions, Modules, CompanyModules, PublicProfiles, Domains, Settings, AuditLogs, Products)
- [ ] EF Core DbContext com 12 entity mappings
- [ ] Índices de performance (company_id, email, etc)
- [ ] Query Filters para soft delete
- [ ] Seed data (Plans, Modules)
- [ ] Primeira migração EF Core
- [ ] Testes de integração (database)
- [ ] CI/CD verde
- [ ] Commit com DDL + migrations

---

## 🎯 MVP Congelado (v1.0)

### 5 Passos:
1. **Signup** — Email + password (30 segundos)
2. **Empresa** — Nome + logo + descrição (2 minutos)
3. **Perfil Público** — Gerado automaticamente em `empresa.razarth.app` (imediato)
4. **Catálogo** — Adicionar produtos/serviços (CRUD simples)
5. **WhatsApp** — Botão `wa.me/` na página pública (zero config)

### First Customer Profile:
- Segmento: Serviços (barbearia, estúdio, restaurante)
- Tamanho: 1-5 funcionários
- Problema: "Não tenho site, não sei fazer"
- Solução: "Deixa comigo, 15 minutos"
- Preço: Gratuito (validação)
- Upgrade: R$ 29-99/mês

### Métricas de Sucesso:
- **Tempo to First Customer:** < 8 semanas
- **Churn (90 dias):** < 20%
- **Cobertura de testes:** > 85%
- **Build time:** < 3 min
- **Page load:** < 2 seg
- **Uptime:** > 99.5%

---

## 🚫 O Que NÃO Entra em v1

- ❌ Analytics (Sprint 3+)
- ❌ IA (Sprint 3+)
- ❌ Marketplace (Sprint 3+)
- ❌ Agendamento (Sprint 2+)
- ❌ Pagamentos (Sprint 2+)
- ❌ Domínios customizados (Sprint 3+)
- ❌ Chat/Suporte (Sprint 2+)
- ❌ Mobile nativo (Sprint 3+)
- ❌ Integrações massivas (Sprint 2+)

**Regra:** Se não está na lista de 5 passos, vai para backlog.

---

## 📚 Documentação Criada

### Nova Pasta: `docs/10-PLATFORM/`
```
10-PLATFORM/
├── README.md
├── 00-STRATEGIC_DIRECTION.md  (Visão congelada)
├── 01-MVP_DEFINITION.md       (5 passos + detalhes)
├── 02-TENANCY_ARCHITECTURE.md (Isolamento 3 camadas)
└── 03-SPRINT_1_2_DATABASE.md  (DDL + EF Core + migrations)
```

### Atualizado:
- `plan.md` — Sprints 1.2-1.8 redefinidos
- `PRODUCT_VISION.md` — v2.0 SaaS focus
- `NON_GOALS.md` — Scope congelado
- `CHANGELOG.md` — v2.0 pivot documentado

---

## 🔒 Princípios de Proteção

1. **Proteger o Domain** — Nenhuma lógica de tenancy lá
2. **Congelar Escopo** — MVP é inegociável
3. **Documentar Decisões** — ADR/RFC para mudanças
4. **Testar Isolamento** — UserA ≠ UserB data
5. **Manter Disciplina** — Mesmas 9 ADRs da Sprint 0

---

## 📊 Governança (Congelada)

### KPIs de Desenvolvimento
- Cobertura de testes: **> 85%**
- ADRs documentados: **100%**
- Código duplicado: **< 3%**
- Tempo de build: **< 3 min**
- Bugs críticos: **0/sprint**

### Níveis de Maturidade (M0-M4)
- **M0 (v1.0):** Fundação (vitrine online)
- **M1 (v2.0):** Analytics
- **M2 (v3.0):** Investigation (scores, anomalias)
- **M3 (v4.0):** Knowledge (eventos, memória)
- **M4 (v5.0):** Intelligence (IA, forecast)

---

## 🚀 Próximas Ações

### Hoje (Sprint 1.2 Planning)
- ✅ Documentação congelada
- ✅ Modelo de domínio aprovado
- ✅ Roadmap confirmado

### Sprint 1.2 (3-4 dias)
1. Criar DDL (11 tabelas)
2. EF Core DbContext (12 entities)
3. Primeira migração
4. Seed data + testes
5. CI/CD verde
6. Primeiro commit executável

### Sprint 1.3 (2-3 dias)
1. TenantMiddleware
2. [RequiresCompanyMembership]
3. Row-level security
4. Testes de isolamento

### Sprint 1.4-1.8
1. Auth (JWT, RBAC)
2. Storage (uploads)
3. Página pública
4. Catálogo
5. Testes + CI green

---

## 🎓 Lições Aprendidas

1. **Documentação não é produto** — 9/10 docs = 0/10 produto
2. **Escopo é inimigo** — Congelar MVP evita scope creep
3. **Multi-tenancy é delicado** — 3 camadas de proteção, não 1
4. **Disciplina paga** — ADRs + governance evitam reengenharia
5. **Simples vence** — 5 passos > sistema completo, sempre

---

## 🔗 Referências

- Sprint 0: [docs/00-VISION/](../docs/00-VISION/)
- Sprint 0.5: [.github/workflows/ci.yml](../.github/workflows/ci.yml)
- Sprint 1.1: [Razarth.sln](../Razarth.sln)
- Sprint 1.2+: [docs/10-PLATFORM/](../docs/10-PLATFORM/)

---

**Status:** 🟢 **Pronto para começar Sprint 1.2**

Data da redireção: 2024-01-15  
Próxima revisão: EOD Sprint 1.2
