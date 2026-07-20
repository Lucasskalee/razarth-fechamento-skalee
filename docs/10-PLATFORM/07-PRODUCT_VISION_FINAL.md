# Product Vision Refinada — Razarth Platform

**Data:** 2026-07-20  
**Status:** ✅ **FINAL - CONGELADA**

---

## 🎯 O Que Razarth REALMENTE É

```
Razarth Platform é uma plataforma operacional SaaS multi-tenant 
que permite que pequenas e médias empresas criem, operem e evoluam 
seu negócio digital através de módulos independentes.

A plataforma fornece infraestrutura, identidade digital, automação, 
inteligência artificial e ferramentas operacionais sem exigir 
conhecimento técnico do cliente.
```

### Por Que Essa Definição Funciona

- ✅ Não é um "site builder" (é mais amplo)
- ✅ Não é um "ERP" (é focado em PMEs, não empresas)
- ✅ Explica por que coexistem: catálogo, agenda, delivery, IA, analytics
- ✅ Posiciona como "operacional" (não apenas visual ou administrativo)
- ✅ Deixa claro que é "plataforma" (ecosistema, não tool singular)

---

## 🏛️ Os 4 Pilares (Invioláveis)

### 1️⃣ Digital Presence
**O cliente é visível.**

```
Página pública
Domínio próprio
SEO
Galeria
Catálogo
Redes sociais
Links de compartilhamento
```

**Pergunta:** Onde a empresa é encontrada?

---

### 2️⃣ Business Operations
**O cliente trabalha.**

```
Pedidos (receber)
Agenda (disponibilidade)
Estoque (controlar)
Financeiro (receber)
CRM (relacionamento)
Delivery (entregar)
```

**Pergunta:** Como o cliente faz negócio?

---

### 3️⃣ Intelligence
**O cliente cresce.**

```
Chatbot (atender 24h)
Marketing (vender mais)
Relatórios (entender)
Insights (recomendações)
Previsões (forecasting)
Automações (eficiência)
```

**Pergunta:** Como o cliente fica mais esperto?

---

### 4️⃣ Platform (Invisible)
**O cliente não vê, mas depende.**

```
Multi-tenancy (isolação)
Billing (cobrar)
Storage (armazenar)
Auth (segurança)
Auditoria (compliance)
Observabilidade (confiabilidade)
Feature Flags (controle)
```

**Pergunta:** Qual é a base que suporta tudo?

---

## 🏗️ Hierarquia de Conceitos (NOVA)

### Antes (Limitado)
```
Platform
  └── Company
      └── Module
          └── User
```

### Depois (Flexível)
```
Platform
  └── Workspace (NOVO - conceito-chave)
      ├── Company A
      ├── Company B
      ├── Company C
      └── Company N
          │
          ├── Users
          ├── Permissions
          ├── Modules
          └── Settings
```

**Por que Workspace muda tudo:**
- ✅ Suporta holding (múltiplas empresas)
- ✅ Suporta franquias (matriz + filiais)
- ✅ Suporta agências (cliente gerencia múltiplos clientes)
- ✅ Suporta crescimento (sem reescrever arquitetura)

---

## 🔌 Classificação Oficial de Módulos

### TIER 1: Core Modules
```
Identity (login, permissões, auditoria)
Companies (dados da empresa)
Users (usuários do workspace)
Permissions (RBAC granular)
Billing (planos, subscriptions, invoices)
Domains (registrar, verificar, redirecionar)
```

### TIER 2: Commerce Modules
```
Catalog (produtos/serviços)
Products (gestão de SKU)
Services (gestão de serviços)
Orders (receber, gerenciar)
Delivery (zonas, taxas, tracking)
Payments (integração de meios)
```

### TIER 3: Operations Modules
```
Scheduling (agenda de agendamentos)
CRM (relacionamento com clientes)
Inventory (estoque em tempo real)
Finance (DRE, fluxo de caixa)
Reports (relatórios operacionais)
```

### TIER 4: Intelligence Modules
```
Analytics (dashboards e métricas)
Knowledge (base de conhecimento)
AI (LLM integration)
Automation (workflows)
Recommendations (sugestões baseadas em IA)
```

### TIER 5: Platform Modules
```
Notifications (email, SMS, push, WhatsApp)
Storage (arquivos, imagens, PDFs)
Audit (logs completos)
Configuration (settings globais)
Telemetry (observabilidade)
```

---

## 🎁 Marketplace Interno (Diferencial)

### O Conceito
Empresas podem criar e vender para outras empresas dentro de Razarth.

```
Marketplace Internal
    │
    ├── Temas (customizar visual)
    ├── Plugins (estender funcionalidade)
    ├── IA Automations (workflows pré-prontos)
    ├── Templates (estruturas iniciais)
    ├── Integrações (conectar ferramentas)
    └── Dados (datasets prontos)
```

### Exemplos

**Empresa A criar tema "Dark Mode para Barbearia"**
```
Tema (nome, descrição, screenshots, preço)
    ↓
Publica no Marketplace
    ↓
Empresa B compra (R$ 19,90)
    ↓
Sistema instala em 1 clique
    ↓
Empresa A recebe 70% (Razarth fica com 30%)
```

**Empresa C criar automação "Email de cancelamento automático"**
```
Workflow pré-pronto
    ↓
Template + lógica
    ↓
Empresa D compra
    ↓
Sistema configura e ativa
    ↓
Empresa C recebe comissão
```

### Por Que Funciona
- ✅ Razarth cresce sem depender só do core team
- ✅ Comunidade pode vender suas soluções
- ✅ Clientes têm mais opções
- ✅ Revshare incentiva inovação

---

## 📦 Template (Evolução de BusinessType)

### Conceito Anterior (BusinessType)
```
Cliente escolhe: "Barbearia"
Sistema ativa: Catalog, Scheduling, Services, WhatsApp
```

### Conceito Novo (Template)
```
Template é um pacote reutilizável que inclui:
├── Modules (quais módulos instalar)
├── Theme (visual pré-configurado)
├── Sample Data (exemplos iniciais)
├── Workflows (automações)
└── Documentation (guia de uso)
```

### Exemplo: Template "Barbearia Moderna"
```
Template
├── Modules
│   ├── Scheduling ✅
│   ├── Catalog (portfolio) ✅
│   ├── CRM ✅
│   ├── Inventory ✅
│   └── AI Assistant ✅
│
├── Theme
│   ├── Primary Color: #000000
│   ├── Font: "Inter"
│   └── Logo Area: [preset]
│
├── Sample Data
│   ├── 5 serviços pré-cadastrados
│   ├── Horário funcionamento
│   └── 3 profissionais
│
└── Workflows
    ├── Email confirmação agendamento
    ├── SMS lembrança 24h antes
    └── Request feedback pós-agendamento
```

**Cliente escolhe Template → Sistema instala TUDO em 2 minutos**

---

## 📅 Roadmap Refinado (Release-Based, Não Sprint-Based)

### Release 1.0: Foundation
**Objetivo:** Infraestrutura pronta  
**Entregáveis:**
- Multi-tenancy
- Auth + Workspace
- Storage
- Billing básico

---

### Release 1.1: Public Profiles
**Objetivo:** Cliente é visível  
**Entregáveis:**
- Página pública
- Catálogo (produtos)
- Galeria
- WhatsApp CTA

---

### Release 1.2: Business Templates
**Objetivo:** Onboarding zero-config  
**Entregáveis:**
- Templates por BusinessType
- Auto-instalação de módulos
- Sample data
- Theme pré-aplicado

---

### Release 1.3: Scheduling
**Objetivo:** Operação básica  
**Entregáveis:**
- Agenda online
- Disponibilidade
- Confirmação automática
- SMS reminder

---

### Release 1.4: Commerce
**Objetivo:** Vender online  
**Entregáveis:**
- Carrinho de compras
- Múltiplos meios de pagamento
- Integração delivery
- Invoice automática

---

### Release 2.0: Razarth AI
**Objetivo:** Inteligência integrada  
**Entregáveis:**
- Chatbot (atendimento)
- AI Assistant (recomendações)
- Smart Reports
- Automation Engine

---

### Release 2.5: Marketplace
**Objetivo:** Comunidade criando  
**Entregáveis:**
- Loja interna
- Sistema de comissão
- Publicação de temas
- Publicação de plugins

---

### Release 3.0: Automation Engine
**Objetivo:** Empresa roda sozinha  
**Entregáveis:**
- Workflows avançados
- API pública
- Webhooks
- Custom code (sandboxed)

---

## ✅ O Novo Objetivo (MUDANÇA CRÍTICA)

### ❌ Objetivo ANTIGO
"Construir todos os módulos"

### ✅ Objetivo NOVO
**"Colocar 10 empresas REAIS usando Razarth"**

**Métrica de Sucesso:**
```
10 empresas diferentes
├── Criando seu perfil
├── Cadastrando produtos/serviços
├── Recebendo contatos pelo WhatsApp
└── SEM sua intervenção técnica
```

**Quando isso acontecer:**
- IA deixa de ser aposta e vira acelerador
- Analytics deixa de ser aposta e vira diferencial
- Marketplace deixa de ser aposta e vira receita
- Você tem validação real, não teórica

---

## 🎓 Mudanças Documentadas

| Conceito | Antes | Depois |
|----------|-------|--------|
| **Posicionamento** | Site builder + ERP | Plataforma operacional |
| **Centro da arquitetura** | Company | **Workspace** |
| **Objetivo** | Construir módulos | Validar com usuários |
| **Roadmap** | Sprint-based | **Release-based** |
| **Crescimento** | Core team | **Comunidade (Marketplace)** |
| **BusinessType** | Categoria | **Template completo** |

---

## 🚀 Próximas Ações

### 1️⃣ Implementar Workspace
```
Platform
  └── Workspace
      ├── Company[]
      ├── User[]
      ├── Permission[]
      └── Settings
```

### 2️⃣ Atualizar Modelo de Dados
```
17 entities → 20+ entities (Workspace, Template, Marketplace)
```

### 3️⃣ Mudar Foco de Desenvolvimento
```
De: "Quantos módulos implementamos?"
Para: "Quantos clientes reais estão usando?"
```

### 4️⃣ Preparar para Marketplace
```
Infrastructure para:
├── Publicar temas
├── Instalar plugins
├── Gerenciar comissões
└── Reviews + ratings
```

---

**Status:** 🟢 **CONGELADO**

Este documento redefine a identidade de Razarth.
Não é site builder. Não é ERP.
É uma plataforma operacional para PMEs crescerem digitalmente.

Próximo: Implementar com foco em validação com usuários reais.
