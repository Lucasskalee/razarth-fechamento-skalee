# BusinessType — O Conceito-Chave do Razarth

**Objetivo:** Zero configuração. Cliente escolhe tipo de negócio → Sistema auto-configura

**Data:** 2026-07-20  
**Status:** ✅ Congelado

---

## 🎯 O Problema que Resolve

Hoje:
```
Client cria empresa
    ↓
"O que você precisa?"
    ↓
Client fica confuso:
  • É módulo?
  • É funcionalidade?
  • Preciso pagar extra?
```

Com BusinessType:
```
Client cria empresa
    ↓
"Que tipo de negócio?"
    ↓
[ ] Barbearia
[ ] Restaurante
[ ] Mercado
[ ] Clínica
[ ] Loja
    ↓
Sistema auto-configura tudo
```

---

## 📊 BusinessTypes Predefinidos (MVP)

### Barbearia (Barbershop)
**Tipo:** Serviço + Portfólio

**Módulos Ativados:**
- ✅ Catalog (serviços: corte, barba, etc)
- ✅ Scheduling (agendar horários)
- ✅ Portfolio (fotos do trabalho)
- ✅ Services (lista de serviços)
- ✅ WhatsApp (reservar pelo WhatsApp)

**Página Pública:**
```
┌─────────────────────────────┐
│   BARBEARIA PRIME           │
│   [Logo] [Banner]           │
├─────────────────────────────┤
│ Sobre: Descrição            │
│ Horário: Seg-Sex 9h-20h     │
├─────────────────────────────┤
│ 📸 GALERIA (Portfolio)      │
│ [Foto1] [Foto2] [Foto3]     │
├─────────────────────────────┤
│ ✂️ SERVIÇOS                 │
│ Corte: R$ 35                │
│ Barba: R$ 25                │
│ Progressiva: R$ 80          │
├─────────────────────────────┤
│ 📅 AGENDAR                  │
│ [Calendário]                │
├─────────────────────────────┤
│ 💬 FALE CONOSCO             │
│ [Botão WhatsApp]            │
└─────────────────────────────┘
```

---

### Restaurante (Restaurant)
**Tipo:** Comércio + Delivery

**Módulos Ativados:**
- ✅ Catalog (cardápio)
- ✅ Delivery (cálculo de frete)
- ✅ Orders (pedidos online)
- ✅ Coupons (cupons de desconto)
- ✅ WhatsApp (receber pedidos)

**Página Pública:**
```
┌─────────────────────────────┐
│   RESTAURANTE XYZ           │
│   [Logo] [Banner]           │
├─────────────────────────────┤
│ Sobre: Descrição            │
│ Entrega: 30-45 min          │
│ Taxa: R$ 5                  │
├─────────────────────────────┤
│ 🔍 BUSCAR                   │
│ [Search] [Filtros]          │
├─────────────────────────────┤
│ 🍕 CARDÁPIO                 │
│ Pizza Margherita: R$ 45     │
│ [+] Adicionar ao carrinho   │
├─────────────────────────────┤
│ 🎟️ CUPONS ATIVOS            │
│ Primeira compra: -20%       │
├─────────────────────────────┤
│ 🛒 SEU PEDIDO (R$ 85)       │
│ [Ver carrinho] [Finalizar]  │
└─────────────────────────────┘
```

---

### Mercado (Market)
**Tipo:** Comércio + Inventory

**Módulos Ativados:**
- ✅ Catalog (produtos em estoque)
- ✅ Inventory (controle de estoque)
- ✅ Delivery (zonas e taxas)
- ✅ Orders (compras online)
- ✅ WhatsApp (suporte)

---

### Clínica (Clinic)
**Tipo:** Serviço + Agendamento

**Módulos Ativados:**
- ✅ Scheduling (agenda de pacientes)
- ✅ Services (procedimentos)
- ✅ Portfolio (galeria de antes/depois)
- ✅ WhatsApp (agendar)

---

### Loja (Retail)
**Tipo:** Comércio

**Módulos Ativados:**
- ✅ Catalog (produtos)
- ✅ Inventory (estoque)
- ✅ Delivery (opcional)
- ✅ WhatsApp (suporte)

---

## 🏗️ Modelo de Dados

```sql
-- BusinessType: templates predefinidos
CREATE TABLE business_types (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- "Barbershop", "Restaurant"
    description TEXT,
    icon_url VARCHAR(500),
    default_modules JSONB, -- {"modules": ["catalog", "scheduling", ...]}
    default_theme_id UUID,
    metadata JSONB
);

-- Company: ligado a um BusinessType
CREATE TABLE companies (
    id UUID PRIMARY KEY,
    business_type_id UUID REFERENCES business_types(id),
    name VARCHAR(255),
    slug VARCHAR(100),
    ...
);

-- CompanyModule: ativação de módulos baseada em BusinessType
CREATE TABLE company_modules (
    id UUID PRIMARY KEY,
    company_id UUID,
    module_id UUID,
    is_active BOOLEAN,
    activated_at TIMESTAMP,
    -- Se o módulo foi ativado por BusinessType ou manualmente
    activated_by VARCHAR(20) DEFAULT 'business_type' -- 'business_type' | 'manual'
);
```

---

## 🚀 Flow de Criação (MVP)

### Passo 1: Signup
```
Email + Password
↓
Conta criada
```

### Passo 2: Empresa
```
Nome + Descrição + Logo
↓
Company criada com slug automático
```

### Passo 3: Tipo de Negócio
```
"O que você faz?"
↓
[ ] Barbearia
[ ] Restaurante
[ ] Mercado
[ ] Clínica
[ ] Loja
[ ] Outro
    ↓
BusinessType selecionado
```

### Passo 4: Auto-Configuração
```
Sistema:
├── Ativa módulos padrão
├── Cria CompanyModule com preset defaults
├── Aplica tema padrão (colors, fonts)
└── Popula templates (horário, categorias)
    ↓
"Pronto! Sua página está publicada em: empresa.razarth.app"
```

### Passo 5: Primeiros Produtos/Serviços
```
"Adicione seus 3 primeiros [produtos/serviços]"
↓
Upload de fotos
Preços
Descrições
↓
Page ao vivo
```

---

## 🎨 CompanyTheme (Automático)

BusinessType define tema padrão, mas cliente pode customizar:

```sql
CREATE TABLE company_themes (
    id UUID PRIMARY KEY,
    company_id UUID UNIQUE,
    primary_color VARCHAR(7), -- #FF5733
    secondary_color VARCHAR(7),
    font_family VARCHAR(100), -- 'Inter', 'Roboto'
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    favicon_url VARCHAR(500),
    custom_css TEXT -- para power users
);
```

**Predefinições por BusinessType:**
- Barbershop → Cores escuras (preto + ouro)
- Restaurant → Cores quentes (laranja + branco)
- Clinic → Cores pastel (azul + branco)
- Market → Cores frescas (verde + branco)

---

## 📝 CompanySettings (Flexível)

```sql
CREATE TABLE company_settings (
    id UUID PRIMARY KEY,
    company_id UUID,
    settings_key VARCHAR(100),
    settings_value TEXT,
    settings_type VARCHAR(20), -- 'string', 'number', 'boolean', 'json'
    
    -- Exemplos de keys:
    -- "whatsapp_number" → "+55 11 98765-4321"
    -- "business_hours" → {"mon": "09:00-18:00", "tue": "..."}
    -- "delivery_zones" → {"zone1": {"fee": 5, "min_order": 50}}
    -- "email_notifications" → true
    -- "allow_custom_domain" → false
);
```

---

## 🔄 Evolução: Do Simples ao Complexo

### Cliente Novo (Dia 1)
```
Email: owner@barbearia.com.br
Password: ***
BusinessType: Barbershop
↓
Acesso Imediato:
├── 5 serviços pré-cadastrados
├── Agenda com seus horários
├── Página pública ao vivo
└── WhatsApp ligado
```

### Depois (Semana 1)
```
Cliente adiciona:
├── Fotos reais do salão
├── Descrições detalhadas
├── Horários customizados
└── Redes sociais
```

### Depois (Mês 1)
```
Cliente quer mais:
├── Ativar: Delivery (restaurante)
├── Ativar: Analytics
├── Upgrade para: Plano Pro
└── Customizar: Domínio próprio
```

### Depois (Mês 3)
```
Cliente usa AI:
├── AI Assistant (chatbot agendamento)
├── AI Marketing (email automático)
├── AI Insights (recomendações)
└── Full power user
```

---

## ✅ Benefícios

### Para Cliente
- ✅ Zero decisões técnicas
- ✅ Pré-configurado para seu tipo
- ✅ Cresce com o negócio
- ✅ Sem necessidade de consultoria

### Para Razarth
- ✅ Tempo de onboarding: 5 minutos (não 30)
- ✅ Satisfação inicial maior
- ✅ Churn reduzido
- ✅ Upgrade natural (começa simple, cresce premium)

---

## 🚫 O Que BusinessType NÃO Faz

- ❌ Não força o cliente a usar tudo
- ❌ Não bloqueia desativação de módulos
- ❌ Não impede adicionar módulos extras
- ❌ Não limita customização (poder users)

**Analogia:** É como um template. Você usa como está, ou customiza tudo.

---

## 📋 BusinessTypes para Futuro (Sprint 3+)

```
Gym
Beauty Salon
Pet Grooming
Photographer
Florist
Funeral Home
Car Wash
Laundry
Parking
Coworking
...
```

Cada um com seus módulos padrão.

---

## 🎯 Checklist Sprint 1.2

- [ ] Create BusinessType table + seed 8 tipos padrão
- [ ] Add business_type_id to Company
- [ ] Create CompanyTheme table + seed themes
- [ ] Create CompanySettings table
- [ ] Update Company creation flow para BusinessType selection
- [ ] Auto-activate modules based on BusinessType
- [ ] UI: BusinessType picker (Passo 3)
- [ ] Tests: Verify correct modules auto-activated

---

**Próximo:** Implementar durante Sprint 1.2
