# Razarth Platform v2.0 — 3-Camadas Architecture

**Data:** 2026-07-20  
**Status:** ✅ **FINAL (Congelado)**  
**Visão:** Transformar qualquer empresa em negócio digital em < 5 minutos

---

## 🏗️ Arquitetura em 3 Camadas

```
                    Razarth Platform
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────┴────┐        ┌───┴────┐      ┌────┴──────┐
    │   CORE  │        │ MODULES │      │     AI    │
    │PLATFORM │        │ CATALOG │      │ PLATFORM  │
    └────┬────┘        └───┬────┘      └────┬──────┘
         │                 │                 │
    ┌────┴──────────────────────────────────┴─────┐
    │                                              │
    │        ANY CLIENT CAN SCALE                 │
    │    From simple site to full suite           │
    └──────────────────────────────────────────────┘
```

---

## 🔐 CORE Platform

**Responsabilidade:** Infraestrutura compartilhada de todas empresas

```
Core Platform
├── Auth
│   ├── JWT + Refresh Token
│   ├── Magic Links (futuro)
│   └── 2FA (futuro)
│
├── Companies
│   ├── Company (entidade principal)
│   ├── CompanySettings
│   ├── CompanyTheme
│   └── BusinessType (Barbershop, Restaurant, Market, etc)
│
├── Users
│   ├── User (autenticação)
│   ├── Membership (user ↔ company)
│   └── Permission (granular access)
│
├── Billing
│   ├── Plan (subscription tier)
│   ├── Subscription (contrato ativo)
│   └── Invoice (histórico de pagamentos)
│
├── Modules
│   ├── Module (catálogo de módulos)
│   ├── CompanyModule (ativação por company)
│   └── ModuleVersion (compatibilidade)
│
├── Domains
│   ├── Domain (custom domain: www.minhaempresa.com.br)
│   ├── Subdomain (empresa.razarth.app)
│   ├── DomainVerification (DNS/SSL)
│   └── DomainRedirect (razarth.app/empresa)
│
└── Storage
    ├── Media (logos, banners, fotos, PDFs)
    ├── MediaTag (organização)
    └── MediaAccess (permissões)
```

---

## 📦 Business Modules

**Responsabilidade:** Funcionalidades verticalizadas por tipo de negócio

```
Business Modules

├── 📋 Catalog
│   ├── Product
│   ├── Category
│   ├── Pricing
│   └── Inventory
│
├── 📅 Scheduling
│   ├── Appointment
│   ├── TimeSlot
│   ├── Professional
│   └── CalendarSync
│
├── 🚗 Delivery
│   ├── Order
│   ├── DeliveryZone
│   ├── DeliveryFee
│   └── TrackingLog
│
├── 👥 CRM
│   ├── Customer
│   ├── Interaction
│   ├── Segmentation
│   └── Campaign
│
├── 📦 Inventory
│   ├── Stock
│   ├── Movement
│   ├── Supplier
│   └── ReorderRule
│
├── 💰 Finance
│   ├── Revenue
│   ├── Expense
│   ├── Reconciliation
│   └── Tax
│
├── 📢 Marketing
│   ├── Coupon
│   ├── Email
│   ├── SMS
│   └── SocialMedia
│
└── 📊 Analytics
    ├── Metric
    ├── Report
    ├── Dashboard
    └── Trend
```

---

## 🤖 AI Platform

**Responsabilidade:** Inteligência artificial como módulo da plataforma (não o centro)

```
AI Platform

├── 🤖 AI Assistant
│   ├── Chat (conversa com clientes)
│   ├── Intent (NLU - entender pedidos)
│   └── Response (gerar respostas)
│
├── 💬 AI Chat
│   ├── WhatsApp Integration
│   ├── Telegram Integration
│   └── Website Widget
│
├── 📢 AI Marketing
│   ├── EmailGenerator
│   ├── CopyWriter
│   └── ContentIdea
│
├── 📈 AI Insights
│   ├── Anomaly Detection
│   ├── Trend Analysis
│   └── PredictiveMetrics
│
├── 📋 AI Reports
│   ├── AutoReport
│   ├── NarrativeGeneration
│   └── ExecutiveSummary
│
└── 🔄 AI Automation
    ├── Workflow (rule-based automation)
    ├── TaskScheduler
    └── Event Trigger
```

---

## 🎯 MVP Progression (Congelado)

### MVP 1.0 (Primeiras 2 semanas)
**Único objetivo:** Vitrine online + contato

- ✅ Signup
- ✅ Login
- ✅ Criar empresa
- ✅ Perfil público (logo + banner + descrição)
- ✅ Catálogo (produtos simples)
- ✅ WhatsApp (botão de contato)

**NÃO entra:**
- ❌ Chatbot
- ❌ IA
- ❌ Agenda
- ❌ Delivery
- ❌ Analytics
- ❌ Galeria

**Critério de sucesso:** Primeira empresa não-Supermercado acessando página pública

---

### MVP 1.1 (Semanas 3-4)
**Objetivo:** Melhorar presença online

- ✅ Galeria (múltiplas fotos por produto)
- ✅ Horário de funcionamento
- ✅ Links para redes sociais
- ✅ SEO básico (meta tags, sitemap)
- ✅ Share buttons (WhatsApp, Facebook)

**Critério de sucesso:** Primeira empresa com 10+ produtos

---

### MVP 1.2 (Semanas 5-7)
**Objetivo:** Operações básicas

- ✅ Agendamento (para serviços)
- ✅ Pedidos (simples, sem pagamento)
- ✅ Serviços (diferente de produtos)

**Critério de sucesso:** Primeira agenda reservada

---

### MVP 2.0 (Sprint 3+)
**Objetivo:** Inteligência

- ✅ IA Assistant (chatbot)
- ✅ AI Insights (recomendações)
- ✅ Email automático
- ✅ Analytics básico

**Critério de sucesso:** Cliente usando IA como diferencial

---

## 🎭 BusinessType (Conceito-Chave)

Cada empresa escolhe um tipo de negócio. Isso ativa automaticamente um conjunto de módulos.

### Exemplo: Barbearia
```
User cria empresa
    ↓
Seleciona: "Barbearia"
    ↓
Sistema ativa automaticamente:
  ├── Catalog (portfolio de serviços)
  ├── Scheduling (agenda de agendamentos)
  ├── Services (diferentes serviços)
  └── WhatsApp (CTA)
    ↓
Client vê:
  ├── Galeria de fotos (portfolio)
  ├── Lista de serviços + preços
  ├── Calendário disponível
  └── Botão "Agendar via WhatsApp"
```

### Exemplo: Restaurante
```
User cria empresa
    ↓
Seleciona: "Restaurante"
    ↓
Sistema ativa automaticamente:
  ├── Catalog (cardápio)
  ├── Delivery (zonas de entrega)
  ├── Orders (pedidos simples)
  ├── Coupons (cupons de desconto)
  └── WhatsApp (pedidos pelo WhatsApp)
    ↓
Client vê:
  ├── Cardápio com fotos
  ├── Botão "Pedir agora"
  ├── Cupons ativos
  └── Avaliações (futuro)
```

### BusinessTypes Predefinidos (MVP)
```
Barbershop      → Scheduling, Portfolio, Services
Restaurant      → Catalog, Delivery, Orders
Market          → Catalog, Inventory, Delivery
Tattoo          → Portfolio, Scheduling, Services
Beauty          → Portfolio, Scheduling, Services
Salon           → Portfolio, Scheduling, Services
Clinic          → Portfolio, Scheduling, Services
Retail          → Catalog, Inventory
PetShop         → Catalog, Scheduling, Services
Cafe            → Catalog, Delivery, Orders
```

---

## 📋 Modelo de Dados (Expandido)

```
Core Entities:
├── Platform (singleton)
├── Tenant (isolação administrativa)
├── Company
├── CompanySettings
├── CompanyTheme
├── PublicProfile
├── BusinessType
├── User
├── Membership
├── Permission
├── Plan
├── Subscription
├── Module
├── CompanyModule
├── Domain
├── DomainRedirect
├── Media
└── AuditLog
```

---

## 🌐 Estratégia de Domínio (3 Formatos)

Sistema suporta **todos os três formatos**. Internamente, tudo aponta para a mesma `Company`.

### Formato 1: Razarth Subdomain
```
empresa-prime.razarth.app
    ↓
System lookup: Company.slug = "empresa-prime"
    ↓
Render: PublicProfile for that Company
```

### Formato 2: Razarth Slug
```
razarth.app/empresa-prime
    ↓
System lookup: Domain.slug or Company.slug = "empresa-prime"
    ↓
Render: PublicProfile for that Company
```

### Formato 3: Custom Domain
```
www.minhaempresa.com.br
    ↓
System lookup: Domain.domain = "minhaempresa.com.br"
    ↓
Verify: DNS record points to Razarth
    ↓
Render: PublicProfile for that Company
```

**Benefício:** Cliente começa com slug grátis, pode fazer upgrade para domínio próprio.

---

## 💡 Proposta de Valor (Refinada)

### ❌ Não Vendemos
- Site builder (existe Wix, Squarespace)
- Agenda (existe Calendly, Agendor)
- E-commerce (existe Shopify, Vtex)
- CRM (existe Pipedrive, HubSpot)

### ✅ Vendemos
```
"Transforme sua empresa em um negócio digital em menos de 5 minutos."

Uma solução integrada que oferece:
├── Presença online profissional
├── Gestão básica de operações
├── Inteligência artificial para crescimento
└── Sem código, sem manutenção, sem complicação
```

**Diferencial:**
- Pré-configurado para o tipo de negócio
- Tudo integrado (não precisa de 5 ferramentas)
- IA desde o início (não é add-on caro)
- Escalável (começa simples, cresce com a empresa)

---

## ✅ Checklist Sprint 1.2 (Revisado)

- [ ] Atualizar DDL com: CompanySettings, CompanyTheme, Permission, Media, BusinessType
- [ ] EF Core DbContext (17 entities em vez de 12)
- [ ] Seed data (Plans, BusinessTypes, Modules padrão)
- [ ] Migrations testadas
- [ ] CI/CD verde

---

**Próximo:** Implementar Sprint 1.2 com domínio expandido
