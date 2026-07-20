# 📱 Razarth Platform (Pasta 10)

Documentação específica para a **Razarth Platform v2.0** — um SaaS multi-tenant para PMEs ir online.

---

## 📂 Estrutura

| Arquivo | Descrição |
|---------|-----------|
| **00-STRATEGIC_DIRECTION.md** | Visão congelada da plataforma, modelo de domínio, roadmap revisado |
| **01-MVP_DEFINITION.md** | Os 5 passos do MVP + segurança & isolamento + métricas |
| **02-TENANCY_ARCHITECTURE.md** | Multi-tenancy: 3 camadas (middleware, permissions, database) |
| **03-SPRINT_1_2_DATABASE.md** | DDL completo, EF Core mappings, migrations, seed data |

---

## 🎯 O Que Mudou

### De:
- Sistema de analytics especializado para supermercados
- Complexo, com IA integrada desde o início

### Para:
- Plataforma SaaS onde qualquer PME vai online
- Simples, cinco passos, foco em produto vendável

### Por quê?
- Validação de multi-tenancy com cliente real (Supermercado Sol)
- Go-to-market mais rápido
- Receita recorrente (subscription)
- Sem reengenharia ao adicionar segundo cliente

---

## 🚀 MVP Congelado (v1.0)

1. **Signup** — Email + senha
2. **Criar empresa** — Nome + logo + descrição
3. **Perfil público** — `empresa.razarth.app` + catálogo
4. **Catálogo de produtos** — CRUD simples
5. **WhatsApp** — Botão de contato

**Critério de sucesso:** Primeira empresa pagando.

**O que NÃO entra:** Analytics, IA, Marketplace, Agendamento, Delivery, Domínios customizados.

---

## 📊 Novo Modelo de Domínio

```
Platform (Razarth como um todo)
├── Tenant
├── Company
├── User
├── Membership
├── Plan
├── Subscription
├── Module
├── CompanyModule
├── PublicProfile
├── Domain (futuro)
├── Settings
└── AuditLog (LGPD)
```

---

## 🔐 Isolamento Multi-Tenant

**3 camadas de proteção:**

1. **Middleware** → Valida X-Company-Id header
2. **Authorization** → Verifica Membership (user + company)
3. **Database** → Row-level security (WHERE company_id = current)

Impossível um usuário ver dados de outra empresa.

---

## 📅 Roadmap (Sprints 1.2-1.8)

| Sprint | O Quê | Dias | Status |
|--------|-------|------|--------|
| 1.2 | Banco (novo modelo) | 3-4 | ⏳ Próximo |
| 1.3 | Multi-tenancy | 2-3 | |
| 1.4 | Autenticação (JWT) | 3-4 | |
| 1.5 | Storage (uploads) | 2-3 | |
| 1.6 | Página pública | 3-4 | |
| 1.7 | Catálogo de produtos | 3-4 | |
| 1.8 | Testes & CI green | 3-5 | |

**Total:** 5-6 semanas para MVP vendável

---

## ✅ Princípios de Implementação

1. **Proteger o Domain** — Nunca colocar lógica de tenancy no Domain
2. **Congelar Escopo** — MVP é 5 passos, nada mais
3. **Documentar Decisões** — ADR/RFC para cada mudança > 2 dias
4. **Testar Isolamento** — UserA não pode ver dados de UserB

---

## 🔗 Links

- [docs/PRODUCT_VISION.md](../PRODUCT_VISION.md) — Visão geral (não muda)
- [docs/NON_GOALS.md](../NON_GOALS.md) — Tudo que NÃO é v1
- [docs/01-ARCHITECTURE/](../01-ARCHITECTURE/) — Arquitetura geral
- [CHANGELOG.md](../CHANGELOG.md) — Histórico de versões
- [plan.md](../../plan.md) — Roadmap executivo

---

**Próxima ação:** Implementar Sprint 1.2 (banco)
