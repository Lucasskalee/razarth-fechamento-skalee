# FINAL: Razarth Platform v2.0 — Proposta de Valor Congelada

**Data:** 2026-07-20  
**Status:** ✅ **FINAL E INEGOCIÁVEL**

---

## 🎯 Proposta de Valor

### Não Vendemos
- ❌ Website builder (Wix, Squarespace fazem melhor)
- ❌ Agenda online (Calendly, Agendor fazem melhor)
- ❌ E-commerce (Shopify, Vtex fazem melhor)
- ❌ CRM (Pipedrive, HubSpot fazem melhor)
- ❌ IA separada (ChatGPT, Claude fazem melhor)

### Vendemos ISTO

```
"Transforme sua empresa em um negócio digital em menos de 5 minutos."

Uma solução integrada que combina:
├── Presença online profissional (site)
├── Gestão básica de operações (agenda, catálogo, pedidos)
├── Inteligência artificial para crescimento (chatbot, insights)
└── Sem código, sem manutenção, sem complicação

Pronto para usar. Automático. Escalável.
```

### Por Que Razarth é Diferente

| Aspecto | Wix | Shopify | Calendly | Razarth |
|---------|-----|---------|----------|---------|
| **Setup** | 1-2 dias | 1-2 dias | 30 min | **5 min** |
| **Multi-module** | Não | Parcial | Não | **Sim** |
| **IA integrada** | Não | Não | Não | **Sim** |
| **Prédefinido** | Genérico | E-commerce only | Agenda only | **Por tipo** |
| **Preço inicial** | $14/mês | $29/mês | $12/mês | **Grátis** |

---

## 🎬 Fluxo de Criação (Inegociável)

### Passo 1: Signup (1 min)
```
Email + Password
```

### Passo 2: Empresa (1 min)
```
Nome + Logo + Descrição
```

### Passo 3: Tipo de Negócio (30 seg)
```
[ ] Barbearia
[ ] Restaurante
[ ] Mercado
[ ] Clínica
[ ] Loja
[ ] Outro
```

### Passo 4: Produtos/Serviços (2 min)
```
Adicione 3 itens:
├── Nome + Preço
├── Foto
└── Descrição
```

### Passo 5: Ao Vivo (Imediato)
```
empresa.razarth.app

✅ Página pública
✅ Agenda funcionando (ou catálogo)
✅ WhatsApp ligado
✅ Pronto para primeiro cliente
```

**Total: 5 minutos. Fim.**

---

## 📦 MVP 1.0 — CONGELADO

### O Que Entra
```
✅ Signup + Login (email + password)
✅ Criar empresa (nome + logo + desc)
✅ Selecionar BusinessType
✅ Perfil público (empresa.razarth.app)
✅ Catálogo (produtos ou serviços)
✅ WhatsApp (botão direto para wa.me/)
✅ Página de erro 404 (mínimo)
```

### O Que NÃO Entra
```
❌ Chatbot (MVP 2.0)
❌ IA (MVP 2.0)
❌ Analytics (MVP 2.0)
❌ Delivery (MVP 1.2)
❌ Agenda (MVP 1.2)
❌ Pagamento (MVP 2.0)
❌ Galeria (MVP 1.1)
❌ Email automático (MVP 2.0)
❌ Domínio customizado (MVP 1.5)
❌ Dark mode, temas, customização (MVP 1.1)
```

**Razão:** Cada "coisinha" vira 2 semanas. Congelamos para ser viável.

---

## 📈 MVP Progression Congelada

### **MVP 1.0** (Sprints 1.2-1.8)
**Semanas 1-2: Vitrine Online**

```
┌─────────────────────────────┐
│   EMPRESA PRIME             │
│   [Logo] [Banner]           │
├─────────────────────────────┤
│ Sobre: Descrição            │
│ Horário: Seg-Sex 9h-20h     │
├─────────────────────────────┤
│ SERVIÇOS / PRODUTOS         │
│ [Item1] [Item2] [Item3]     │
├─────────────────────────────┤
│ [Botão WhatsApp]            │
└─────────────────────────────┘
```

**Objetivo:** Primeira empresa pública e recebendo contatos via WhatsApp

---

### **MVP 1.1** (Sprint 2)
**Semanas 3-4: Presença Melhorada**

- ✅ Galeria (múltiplas fotos por item)
- ✅ Horário de funcionamento (customizável)
- ✅ Links para redes sociais (Instagram, Facebook)
- ✅ SEO básico (meta tags, Open Graph)
- ✅ Share buttons (compartilhar no WhatsApp, Facebook)

**Objetivo:** Cliente com presença online profissional

---

### **MVP 1.2** (Sprint 2.5)
**Semanas 5-7: Operações Básicas**

- ✅ Agendamento (para serviços tipo barbearia, clínica)
- ✅ Pedidos (simples, sem pagamento integrado)
- ✅ Serviços (diferente de produtos)

**Objetivo:** Primeira agenda / primeiro pedido pelo sistema

---

### **MVP 2.0** (Sprint 3+)
**Semana 8+: Inteligência**

- ✅ IA Assistant (chatbot responde perguntas)
- ✅ AI Insights (recomendações para cliente)
- ✅ Email automático (confirmação, lembretes)
- ✅ Analytics básico (quantos acessos, de onde)

**Objetivo:** Cliente usando IA como diferencial competitivo

---

## 💾 Modelo de Dados (Congelado)

**Core Platform (17 entities):**
```
Platform
├── Tenant
├── Company
├── CompanySettings
├── CompanyTheme
├── BusinessType
├── PublicProfile
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

**Relacionamentos Críticos:**
```
Company
  ├── has_one: CompanySettings
  ├── has_one: CompanyTheme
  ├── has_one: PublicProfile
  ├── has_one: BusinessType
  ├── has_many: CompanyModule
  ├── has_many: Domain
  ├── has_many: User (via Membership)
  ├── has_many: Product
  └── has_many: AuditLog

BusinessType
  ├── has_many: Company
  ├── has_many: Module (default_modules)
  └── has_one: CompanyTheme (default)
```

---

## 🌐 Estratégia de Domínio (3 Formatos)

### Formato 1: Razarth Subdomain
```
barbearia-prime.razarth.app
↓
GET /barbearia-prime
↓
Lookup Company where slug = "barbearia-prime"
↓
Render PublicProfile
```

### Formato 2: Razarth Slug Path
```
razarth.app/barbearia-prime
↓
GET /barbearia-prime
↓
Lookup Company where slug = "barbearia-prime"
↓
Render PublicProfile
```

### Formato 3: Custom Domain (Futuro, MVP 1.5+)
```
www.barbearia-prime.com.br
↓
DNS CNAME → barbearia-prime.razarth.app
↓
GET (request host)
↓
Lookup Domain where domain = "barbearia-prime.com.br"
↓
Render PublicProfile
```

**MVP 1.0 suporta:** Formatos 1 e 2  
**MVP 1.5 suporta:** Todos os 3

---

## 📊 Estimativas (Congeladas)

| Fase | O Quê | Sprint | Dias | Resultado |
|------|-------|--------|------|-----------|
| **Setup** | Db + Auth + Multi-tenancy | 1.2-1.3 | 5-7 | Backend pronto |
| **MVP 1.0** | Perfil público | 1.4-1.8 | 8-10 | Página ao vivo |
| **MVP 1.1** | Galeria + SEO | 2 | 5-7 | Presença profissional |
| **MVP 1.2** | Agenda + Pedidos | 2.5 | 10-12 | Operações básicas |
| **MVP 2.0** | IA | 3+ | 14+ | Inteligência |

**Total até MVP 2.0:** 8-10 semanas

---

## 🎓 Normas de Escopo (Invioláveis)

### ✅ Pode Fazer
- Otimizar o que existe
- Melhorar performance
- Adicionar testes
- Refatorar código

### ❌ Não Pode Fazer
- Adicionar feature nova ao MVP 1.0
- Complexificar fluxo de usuário
- Deletar requirements congelados
- Comprometer prazo por "melhorias"

### 🟡 Precisa de Aprovação
- Mudança em:
  - Modelo de dados
  - API contracts
  - Fluxo de criação
- Budget:
  - > 1 dia de trabalho
  - Depender de third-party

---

## 🎯 Métricas de Sucesso

### Para MVP 1.0
```
✅ Build compila em < 3 min
✅ Testes > 85% coverage
✅ Primeira página pública ao vivo
✅ Botão WhatsApp funciona
✅ Primeiro cliente não-Supermercado acessando
```

### Para MVP 2.0
```
✅ 10+ clientes ativos
✅ Churn < 20% (primeiros 90 dias)
✅ NPS > 40
✅ IA Assistant respondendo 80% das perguntas
```

---

## 🚀 Próximas Ações (Prioritizadas)

### 1️⃣ **HOJE: Congelar Documentação**
- ✅ Arquitetura 3-camadas
- ✅ MVP progression
- ✅ BusinessType
- ✅ Proposta de valor

### 2️⃣ **AMANHÃ: Sprint 1.2**
- [ ] Database (17 entities)
- [ ] EF Core DbContext
- [ ] Migrations
- [ ] Seed data
- [ ] CI/CD verde

### 3️⃣ **SEMANA 1: Sprint 1.3**
- [ ] Multi-tenancy middleware
- [ ] TenantResolver
- [ ] Authorization attribute
- [ ] Isolation tests

### 4️⃣ **SEMANA 2: Sprint 1.4-1.8**
- [ ] Auth (JWT, Refresh)
- [ ] Storage (uploads)
- [ ] Página pública
- [ ] Catálogo CRUD
- [ ] Tests > 85%

### 5️⃣ **SEMANA 3-4: MVP 1.0**
- [ ] Deploy
- [ ] First user signup
- [ ] Supermercado Sol como Tenant 1
- [ ] Beta customer (Barbershop)

---

## 💎 Conclusão

Razarth Platform v2.0 é:

```
┌────────────────────────────────────────────────┐
│  Uma plataforma integrada que permite que      │
│  qualquer PME (barbearia, restaurante, loja)   │
│  tenha presença online profissional, receba    │
│  clientes, gerencie operações básicas e cresça │
│  com inteligência artificial integrada.        │
│                                                │
│  Tudo em menos de 5 minutos.                  │
│  Tudo integrado.                              │
│  Tudo escalável.                              │
└────────────────────────────────────────────────┘
```

**Status:** 🟢 **PRONTO PARA CODAR**

**Próximo commit:** Sprint 1.2 com modelo de dados expandido

---

*Este documento congela a visão estratégica. Não mude sem aprovação explícita.*
