# Razarth Platform v2.0 — Redirecionamento Estratégico

**Data:** Sprint 1.2 Preview  
**Status:** 🔴 **FROZEN** (Sem mudanças até EOY)  
**Versão:** 2.0

---

## 🎯 A Mudança Fundamental

**De:** Sistema de analytics especializado para supermercados  
**Para:** Plataforma SaaS multi-tenant onde qualquer PME pode ir online

### Por que essa mudança?

1. **Validação de multi-tenancy com cliente real:** Supermercado Sol passa de projeto piloto para primeira empresa na plataforma
2. **Escalabilidade sem reengenharia:** Suportar barbearía, estúdio, restaurante, etc. não requer reescrever o Core
3. **Go-to-market mais rápido:** MVP simples (5 passos) vs. sistema completo
4. **Receita diversificada:** SaaS recorrente (subscription) vs. analytics de nicho

---

## 📊 Avaliação do Status Atual

| Dimensão | Nota | Descrição |
|----------|------|-----------|
| **Arquitetura** | 9.5/10 | Clean Architecture, DDD, multi-tenancy, ADRs, CI/CD, governança — dificilmente vai reescrever |
| **Documentação** | 9/10 | Compreensiva, indexada, governança definida |
| **Produto** | 1/10 | Estrutura (Razarth.sln, 8 projetos), mas nada executável |

---

## 🚀 MVP Congelado (Razarth v1.0)

Não é ERP. Não é analytics. É **vitrine online**.

### 5 Passos para Primeiro Cliente

1. **Signup** — Email + senha
2. **Empresa** — Nome, logo, descrição
3. **Perfil Público** — Slug único, catálogo
4. **Catálogo** — Produtos ou serviços (CRUD)
5. **WhatsApp** — Botão de contato na página

### Critério de Sucesso

Primeira empresa pagando por Razarth (não apenas Supermercado Sol).

---

## 🔒 O Que NÃO Entra em v1

- ❌ Analytics & IA (Sprint 3+)
- ❌ Marketplace (Sprint 3+)
- ❌ Gestão financeira completa
- ❌ Agendamento
- ❌ Delivery
- ❌ Mobile nativo
- ❌ Domínios customizados (slugs apenas; domínios em Sprint 3+)
- ❌ Chat/Chatbot
- ❌ Integrações massivas

---

## 🏗️ Novo Modelo de Domínio

```
Platform (Razarth como um todo)
│
├── Tenant (Isola dados por ambiente administrativo)
│   └── Atributos: id, nome, rascunho_admin
│
├── Company (Empresa dentro de um tenant)
│   └── Atributos: id, tenant_id, nome, slug, logo_url, descrição, ativo
│
├── User (Usuário da plataforma)
│   └── Atributos: id, email, senha_hash, status
│
├── Membership (Conexão usuário ↔ empresa)
│   └── Atributos: id, user_id, company_id, role (owner/editor/viewer)
│
├── Plan (Plano de subscription)
│   └── Atributos: id, nome, preço, módulos_inclusos, limite_produtos
│
├── Subscription (Contrato ativo)
│   └── Atributos: id, company_id, plan_id, data_início, data_vencimento, status
│
├── Module (Capacidade da plataforma)
│   └── Atributos: id, nome, versão, descrição
│
├── CompanyModule (Qual módulo cada empresa usa)
│   └── Atributos: id, company_id, module_id, ativo, data_ativação
│
├── PublicProfile (Página pública da empresa)
│   └── Atributos: id, company_id, description, banner_url, whatsapp_link
│
├── Domain (Domínio customizado — futuro)
│   └── Atributos: id, company_id, domínio, status, data_verificação
│
├── Settings (Configurações por empresa)
│   └── Atributos: id, company_id, chave, valor, tipo
│
└── AuditLog (Rastreabilidade legal)
    └── Atributos: id, tenant_id, user_id, entidade, ação, dados_antes, dados_depois, timestamp
```

---

## 📈 Roadmap Resequenciado

### Sprint 1.2: Banco (Novo Modelo)
- [ ] Criar tabelas: Companies, Users, Memberships, Plans, Subscriptions, Modules, CompanyModules, PublicProfiles, Domains, AuditLogs
- [ ] EF Core DbContext com todas as relações
- [ ] Primeira migração

### Sprint 1.3: Multi-Tenancy
- [ ] TenantResolver (extrai tenant do header ou slug)
- [ ] Middleware de validação
- [ ] Current Company + Current User contexto
- [ ] Row-level security (CompanyA ≠ CompanyB)

### Sprint 1.4: Autenticação
- [ ] JWT + Refresh Token
- [ ] RBAC (owner/editor/viewer)
- [ ] Claims + Policies
- [ ] Logout e token revocation

### Sprint 1.5: Storage
- [ ] Upload de logo
- [ ] Upload de banner
- [ ] Galeria de produtos
- [ ] Validação de arquivo (tipo, tamanho)

### Sprint 1.6: Página Pública
- [ ] Endpoint GET `/{slug}` (sem auth)
- [ ] Renderizar profile + catálogo
- [ ] Botão WhatsApp
- [ ] SEO básico (meta tags)

### Sprint 1.7: Catálogo de Produtos
- [ ] CRUD de produtos por empresa
- [ ] Upload de foto
- [ ] Preço + descrição
- [ ] Ordenação e filtros

### Sprint 1.8: Testes & CI Green
- [ ] Cobertura > 85%
- [ ] Build < 3 min
- [ ] Testes passando
- [ ] Deploy automático em develop

---

## 🛡️ Princípios de Proteção

### 1. **Proteger o Domain a Qualquer Custo**
- Não colocar lógica de tenancy no Domain
- Domain é 100% agnóstico a banco, API, UI, tenant
- Toda orquestração é Application

### 2. **Congelar Escopo**
- Se uma feature não está na lista de 5 passos, vai para backlog
- MVP é produto vendável, não plataforma completa

### 3. **Documentar Decisões**
- Cada sprint começa com ADR/RFC se mudança > 2 dias
- NON_GOALS atualizado a cada sprint

---

## 📋 Checklist de Implementação

- [ ] Criar `docs/10-PLATFORM/PLATFORM_MVP_DEFINITION.md`
- [ ] Criar `docs/10-PLATFORM/TENANCY_ARCHITECTURE.md`
- [ ] Criar `docs/10-PLATFORM/SPRINT_1_2_REVISED.md`
- [ ] Atualizar ERD com novo modelo
- [ ] Atualizar plan.md com Sprints 1.2-1.8
- [ ] Primeiro commit com novo direcionamento
- [ ] Deploy Sprint 1.2 (database + migrations)

---

## 🔗 Documentos Relacionados

- `docs/PRODUCT_VISION.md` — Visão geral (não muda)
- `docs/NON_GOALS.md` — Tudo que NÃO é MVP (atualizado)
- `docs/01-ARCHITECTURE/ARCHITECTURE_DECISIONS.md` — ADRs incluem multi-tenancy
- `CHANGELOG.md` — Histórico de versões

---

**Próximo passo:** Implementar Sprint 1.2 com novo modelo de banco
