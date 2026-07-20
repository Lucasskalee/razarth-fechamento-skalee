# CAPABILITY_MODEL.md

## Da Hierarquia Antiga para a Nova

A evolução mais importante na arquitetura.

---

## O PROBLEMA DA HIERARQUIA ANTERIOR

```
Antes:

Workspace
    ↓
Company
    ↓
Modules
    ↓
Users
```

O problema: **Company é o centro.**

Isso implica que cada company "ativa módulos".

Mas na verdade, cada company **combina capacidades**.

### Exemplo do Problema

**Cliente A (Barbearia):** Ativa módulos = [Agendamento, Catálogo, Notificações]

**Cliente B (Academia):** Ativa módulos = [Agendamento, Catálogo, Notificações]

Parece que são módulos diferentes.

Na verdade, são a **mesma capacidade utilizada 2 vezes**.

Quando você pensa "módulos", você tende a criar código separado para cada contexto.

Quando você pensa "capacidades", você força reutilizar a mesma implementação.

---

## A HIERARQUIA NOVA

```
Workspace
    ↓
Capability
    ↓
Solution Template
    ↓
Company
    ↓
Users
```

Ou em texto:

```
Plataforma (Razarth)
  ↓
Workspace (seu espaço)
  ↓
Capability (o que você pode fazer)
  ↓
Solution Template (como você combina capacidades)
  ↓
Company (sua operação específica)
  ↓
Users (quem usa)
```

---

## O QUE MUDA

### Antes (Thinking Model)

```
"Qual módulo o cliente quer?"

Modules = {Scheduling, Catalog, Finance, Delivery}

Select modules → Ativar → Pronto
```

### Depois (Thinking Model)

```
"Qual capacidade o cliente precisa?"

Capabilities = {Agendamento, Varejo, Operações Financeiras, Logística}

Combinar capacidades → Definir template → Pronto
```

É uma **mudança fundamental de mindset**.

---

## AS TRÊS CAMADAS

### Camada 1: Capabilities (O Core)

Capacidades são implementações **completamente genéricas**.

Exemplos:

```
Agendamento
  → Permite marcar horários
  → Suporta recursos (pessoas, salas, equipamentos)
  → Suporta durações variáveis
  → Suporta recorrência
  → Usado por: Barbearias, Clínicas, Academias, Cursos, Eventos

Varejo
  → Permite vender itens
  → Suporta categorias
  → Suporta variações (tamanho, cor)
  → Suporta estoque
  → Usado por: Mercados, Pet Shops, Barbearias (vendas de produtos), Restaurantes

Operações Financeiras
  → Permite registrar receitas e despesas
  → Suporta múltiplas contas
  → Suporta categorização
  → Suporta conciliação
  → Usado por: Todas as operações

Comunicação
  → Permite enviar mensagens
  → Suporta canais (WhatsApp, SMS, Email, Push)
  → Suporta templates
  → Suporta tracking
  → Usado por: Todas as operações

Inscrição
  → Permite coletar informações
  → Suporta formulários customizáveis
  → Suporta pagamento
  → Suporta validação
  → Usado por: Eventos, Cursos, Competições

Ranking
  → Permite ordenar participantes
  → Suporta pontuação
  → Suporta categorias
  → Suporta atualização em tempo real
  → Usado por: Competições, Torneios, Gamificações

Galeria
  → Permite armazenar e exibir mídia
  → Suporta álbuns
  → Suporta permissões
  → Usado por: Todos os segmentos
```

**Característica crítica:** Cada capability é **100% agnóstica ao segmento**.

Não existe "Agendamento para Barbearia".

Existe "Agendamento" que barbearias usam.

### Camada 2: Solution Templates (A Composição)

Templates combinam capacidades.

Exemplos:

```
Business Templates

  Barbearia
    = Agendamento
    + Catálogo (Serviços)
    + Portfólio (Fotos)
    + Comunicação (WhatsApp)
    + Avaliações

  Restaurante
    = Cardápio (Varejo com Fotos)
    + Pedidos
    + Delivery
    + Pagamento
    + Comunicação (WhatsApp)

  Academia
    = Agendamento (Aulas)
    + Planos (Subscription)
    + Comunicação
    + Galeria (Fotos/Vídeos)
    + Avaliações

  Clínica
    = Agendamento
    + Comunicação (WhatsApp + SMS)
    + Documentos (Receitas, Atestados)
    + Avaliações
    + Histórico (Paciente)

Event Templates

  Competição de eSports
    = Inscrição
    + Ranking
    + Bracket (Tabela)
    + Comunicação
    + Galeria
    + Transmissão (Vídeo)
    + Documentos (Regulamento)

  Torneio de Futebol
    = Inscrição
    + Agenda (Jogos)
    + Ranking
    + Estatísticas
    + Galeria
    + Comunicação
    + Pagamento

  Curso Online
    = Inscrição
    + Conteúdo (Aulas)
    + Comunicação
    + Avaliação (Testes)
    + Certificado

Organization Templates

  Condomínio
    = Aviso (Comunicação)
    + Documentos (Regulamento)
    + Financeiro
    + Votação (Enquete)
    + Diretório (Moradores)

  Igreja
    = Agenda (Missas)
    + Comunicação (Avisos)
    + Doações (Pagamento)
    + Documentos (Estatuto)
    + Comunidade (Grupos)

  ONG
    = Voluntariado (Inscrição)
    + Comunicação
    + Documentos (Relatórios)
    + Financeiro (Doações)
    + Impacto (Relatórios)
```

**Característica crítica:** Cada template é apenas uma **combinação de capacidades**.

O template não adiciona código novo.

Apenas ativa, configura e combina capacidades existentes.

### Camada 3: Company (A Realização)

Company é a instância específica.

```
Company "Barbearia do João"
  ├─ Template: Barbearia
  ├─ Capabilities Ativas:
  │   ├─ Agendamento (config: 30min slots)
  │   ├─ Catálogo (config: 15 serviços)
  │   ├─ Portfólio (config: 50 fotos)
  │   ├─ Comunicação (config: WhatsApp ativado)
  │   └─ Avaliações (config: público)
  ├─ Customizações:
  │   ├─ Página customizada
  │   ├─ Logo e cores
  │   ├─ Horários especiais
  │   └─ Equipe (3 barbeiros)
  └─ Parceiros/Integrations:
      ├─ Widget de avaliações (Trustpilot)
      └─ Relatório de fluxo (Google Sheets)
```

---

## POR QUE ISSO MUDA TUDO

### 1. Code Organization

**Antes:**
```
src/
  modules/
    scheduling/
    catalog/
    finance/
    delivery/
    (cada um com sua implementação)
```

**Depois:**
```
src/
  capabilities/
    scheduling/ (UMA implementação usada por todos)
    catalog/ (UMA implementação usada por todos)
    finance/ (UMA implementação usada por todos)
    delivery/ (UMA implementação usada por todos)
  templates/
    barbershop/ (configuração + composição)
    restaurant/ (configuração + composição)
    (templates são leves)
```

### 2. Reutilização

**Antes:**
```
"Barbearia precisa de agendamento"
→ Criar AgendamendoModule_Barbershop

"Academia precisa de agendamento"
→ Criar AgendamentoModule_Academia

Resultado: 2 implementações = código duplicado
```

**Depois:**
```
"Barbearia precisa de agendamento"
→ Usar CapabilidadeAgendamento com config X

"Academia precisa de agendamento"
→ Usar CapabilidadeAgendamento com config Y

Resultado: 1 implementação = reutilização 100%
```

### 3. Escalabilidade

**Antes:**
```
10 segmentos = 50 "módulos" específicos
100 segmentos = 500 "módulos" específicos (problema!)
```

**Depois:**
```
10 segmentos = 15 capabilities base + templates que combinam
100 segmentos = mesmas 15 capabilities + novos templates

A complexidade NÃO cresce com segmentos!
```

### 4. Marketplace

**Antes:**
```
"Qual marketplace item você quer?"
- Módulo de SMS? (específico)
- Módulo de email? (específico)
- Módulo de WhatsApp? (específico)
```

**Depois:**
```
"Qual enhancement você quer?"
- SMS Gateway Integration? (estende Comunicação)
- AI Copywriting? (estende Comunicação)
- WhatsApp Automations? (estende Comunicação)

Todos estendem a MESMA capability
```

---

## EXEMPLO PRÁTICO: AGENDAMENTO

### Capability: Scheduling

```typescript
// Core Capability - GENÉRICO
capability SchedulingEngine {
  
  TimeSlot {
    duration: Duration // 15min, 30min, 1h (genérico)
    resource: ResourceId // Pessoa, sala, equipamento (genérico)
    capacity: Int // 1, 2, N (genérico)
    startTime: DateTime
    endTime: DateTime
  }

  RecurrenceRule {
    frequency: "daily" | "weekly" | "monthly"
    until: Date
    exceptions: Date[]
  }

  Booking {
    customer: CustomerId
    slots: TimeSlot[]
    status: "pending" | "confirmed" | "cancelled"
    metadata: Map<String, Any> // Livre para customizações
  }

  // Métodos
  getAvailableSlots(resource, date)
  bookSlot(slot, customer)
  cancelBooking(booking)
  listBookings(resource, date)
}
```

### Template: Barbershop

```yaml
# Barbershop Template - COMBINAÇÃO + CONFIGURAÇÃO
template: barbershop

capabilities:
  - scheduling:
      slot_duration: 30 # Barbearia = slots de 30min
      resources:
        - type: person
          count: 3 # 3 barbeiros
        - type: chair
          count: 3
      auto_confirm: true # Confirma automaticamente
      
  - catalog:
      item_type: service
      items:
        - "Corte Simples"
        - "Corte + Barba"
        - "Pigmentação"
      
  - communication:
      channels: [whatsapp, sms]
      
  - portfolio:
      media_type: image

ui_customizations:
  primary_action: "Agendar Agora"
  color_scheme: "dark"
  
integrations:
  - google_calendar (sync)
  - whatsapp_business (send booking confirmation)
```

### Company: "Barbearia do João"

```yaml
company:
  name: "Barbearia do João"
  template: barbershop
  
  # Capability Instances
  scheduling_instance_1:
    resources:
      - barber_1: João
      - barber_2: Pedro
      - barber_3: Carlos
    operational_hours:
      - day: monday-friday
        open: 08:00
        close: 18:00
      - day: saturday
        open: 08:00
        close: 14:00
      - day: sunday
        closed
        
  catalog_instance_1:
    services:
      - "Corte Simples": R$ 30
      - "Corte + Barba": R$ 45
      - "Pigmentação": R$ 60
      
  communication_instance_1:
    whatsapp_number: "11991234567"
    auto_messages:
      booking_confirmed: "Confirmado! Seu agendamento é {date} às {time}"
      booking_reminder: "Lembrete: seu agendamento é amanhã às {time}"
      
  portfolio_instance_1:
    images:
      - [50 fotos de trabalhos anteriores]
```

**Resultado:** 
- Capability Scheduling é código compartilhado com 100 outras companies
- Template Barbershop é configuração (YAML, não código)
- Company é dados + customizações

---

## TRANSIÇÃO NA IMPLEMENTAÇÃO

### Sprint 1 (Manter Compatibilidade)

```typescript
// Continuar com "Modules" internamente, mas nomear como "Capabilities"
// No backend, migrar gradualmente

Module → Capability (rename)
ModuleInstance → CapabilityInstance (rename)
ModuleConfig → CapabilityConfig (rename)

// Na API publica, usar nova nomenclatura
GET /company/{id}/capabilities
POST /company/{id}/enable-capability/{name}
```

### Sprint 2 (Implementar Hierarchy)

```typescript
// Adicionar Capability concept como entidade first-class
Workspace
  ↓ owns
Company
  ↓ activates
CapabilityInstance
  ↓ configuration of
Capability
```

### Sprint 3 (Template Composition)

```typescript
// Templates como composições de capabilities
SolutionTemplate {
  name: string
  description: string
  capabilities: CapabilityRef[] // Quais capabilities ativa
  defaultConfigs: Map<CapabilityRef, Config> // Config padrão
}
```

---

## NOMENCLATURA: "Capabilities" vs. "Features"

### Capability
- Implementação reutilizável
- Funciona para múltiplos segmentos
- Agnóstica a segmento
- Exemplo: "Agendamento", "Varejo", "Comunicação"

### Feature
- Enhancement de uma capability
- Pode ser específico de marketplace
- Exemplo: "SMS Gateway Integration", "AI Naming Assistant"

### Module (Descontinuado)
- Termo antigo
- Apenas para uso interno (refactor gradualmente)
- Novo: "Capability"

---

## BENEFÍCIOS A LONGO PRAZO

1. **Escalabilidade sem Duplicação**
   - 100 templates, 1 conjunto de capabilities
   - Codebase cresce logaritmicamente, não linearmente

2. **Marketplace Natural**
   - Features estendem capabilities
   - Não "substituem" o core

3. **Validação Arquitetural**
   - Pergunta sempre: "Essa feature é capability-extending?"
   - Se não, é template customization (marketplace)

4. **Mentalidade Correta**
   - Dev pensa "qual capability precisa?" em vez de "qual módulo ativar?"
   - Força pensar em reutilização desde o início

---

## IMPLEMENTAÇÃO CHECKLIST

- [ ] Renomear internamente: Module → Capability
- [ ] Adicionar SolutionTemplate como entidade
- [ ] Migração DB: adicionar capability_id a modules
- [ ] Atualizar API: GET /capabilities, POST /enable-capability
- [ ] Documentação: mudar "Modules" para "Capabilities" em docs públicas
- [ ] Template Engine: capacidade de compor templates a partir de capabilities
- [ ] Testes: validar que mesma capability funciona em N segmentos

---

**Resultado Final:**

Você não pensa em "módulos".

Você pensa em "capacidades".

E quando alguém pede algo novo, a pergunta é:

"É uma capacidade nova ou é template combinando capacidades existentes?"

99% do tempo é a segunda.

Esse é o segredo de plataformas que crescem sem decair.
