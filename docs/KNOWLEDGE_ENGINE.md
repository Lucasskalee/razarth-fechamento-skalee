# KNOWLEDGE ENGINE — Especificação Técnica

> A memória institucional do Razarth.
> Cada mês é uma página da história da empresa — para sempre.

---

## Propósito

O Knowledge Engine resolve um problema que todo supermercado tem mas raramente percebe:
**o conhecimento operacional não sobrevive à troca de equipe.**

Quando um gerente sai, vai junto:
- O motivo do pico de perdas de março.
- Por que o FLV cresceu 40% em junho.
- O que foi decidido na reunião de fechamento.
- Qual fornecedor causou o problema de qualidade.
- O resultado da investigação que foi aberta.

O Knowledge Engine transforma esse conhecimento tácito em **memória estruturada, navegável e auditável**.

---

## Conceito central: a Competência como página

Ao acessar qualquer mês de qualquer loja, o gestor vê **tudo** o que aconteceu:

```
Competência: Julho/2026 — SOL 3

┌─────────────────────────────────────────┐
│ INDICADORES                             │
│ Total Perdas: R$ 48.200 (+21% vs. jun)  │
│ Total Uso/Consumo: R$ 12.400            │
│ Score médio: 74 (Alto)                  │
│ Anomalias detectadas: 3                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ EVENTOS OPERACIONAIS                    │
│ • Câmara fria do Açougue em manutenção  │
│   (01/07 a 08/07) — impacto: +R$ 3.200 │
│ • Troca de fornecedor FLV               │
│   Registrado por: João Silva em 15/07   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ INVESTIGAÇÕES ABERTAS                   │
│ • Pão Francês — Score 87 — Crítico      │
│   Responsável: Maria Souza              │
│   Prazo: 20/07/2026                     │
│   Status: Em andamento                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ PLANOS DE AÇÃO                          │
│ • Reduzir produção diária Padaria em 10%│
│   Resultado: pendente                   │
│ • Auditar notas FLV semana 2            │
│   Resultado: Concluído — desvio         │
│   confirmado e corrigido                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ FECHAMENTO                              │
│ Status: Aprovado                        │
│ Aprovado por: Carlos Diretor            │
│ Data: 25/07/2026                        │
│ Observações: Perdas dentro da meta      │
│ após ajuste de produção                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ANEXOS                                  │
│ • Ata reunião fechamento jul/2026.pdf   │
│ • Foto câmara fria avariada.jpg         │
└─────────────────────────────────────────┘
```

---

## Estrutura do Knowledge Engine

```
Razarth.Knowledge/
  Services/
    CompetenceService.cs       # Gerencia a competência completa
    EventService.cs            # Registra e consulta eventos operacionais
    ActionPlanService.cs       # Planos de ação com acompanhamento
    DecisionService.cs         # Decisões registradas com resultado posterior
    AttachmentService.cs       # Anexos, fotos, documentos

  Models/
    CompetencePage.cs          # Página completa de uma competência
    OperationalEvent.cs        # Evento: o que, quando, quem, impacto
    ActionPlan.cs              # Plano com passos, responsável, prazo, resultado
    Decision.cs                # Decisão + resultado posterior
    Attachment.cs              # Arquivo anexado
    KnowledgeContext.cs        # Contexto para o AI Engine (v3.0)

  Queries/
    CompetenceQuery.cs         # Consultas de competências por período/loja
    EventTimelineQuery.cs      # Linha do tempo de eventos de uma loja/setor
```

---

## Modelos principais

### CompetencePage

```csharp
public record CompetencePage
{
    public int Year { get; init; }
    public int Month { get; init; }
    public string Store { get; init; }

    // Indicadores calculados pelo Analytics Engine
    public ExecutiveKpis Kpis { get; init; }
    public IReadOnlyList<AnomalyResult> Anomalies { get; init; }

    // Conteúdo do Knowledge Engine
    public IReadOnlyList<OperationalEvent> Events { get; init; }
    public IReadOnlyList<ActionPlan> ActionPlans { get; init; }
    public IReadOnlyList<Decision> Decisions { get; init; }
    public IReadOnlyList<Attachment> Attachments { get; init; }

    // Fechamento
    public ClosingRecord Closing { get; init; }

    // Metadados
    public DateTime CreatedAt { get; init; }
    public DateTime LastUpdatedAt { get; init; }
}
```

---

### OperationalEvent

```csharp
public record OperationalEvent
{
    public Guid Id { get; init; }
    public string Store { get; init; }
    public string? Sector { get; init; }
    public int Year { get; init; }
    public int Month { get; init; }
    public DateTime OccurredAt { get; init; }

    public EventType Type { get; init; }
    // Manutenção, TrocaFornecedor, MudancaEstrutura, Furto,
    // Sazonalidade, Treinamento, Outro

    public string Title { get; init; }
    public string Description { get; init; }
    public decimal? FinancialImpact { get; init; }
    public ImpactDirection? ImpactDirection { get; init; }  // Alta, Queda

    public string RegisteredBy { get; init; }
    public DateTime RegisteredAt { get; init; }

    // Vinculação com análise
    public IReadOnlyList<string> LinkedAnomalyIds { get; init; }
    public IReadOnlyList<string> LinkedProducts { get; init; }
}
```

---

### ActionPlan

```csharp
public record ActionPlan
{
    public Guid Id { get; init; }
    public string Store { get; init; }
    public string? Sector { get; init; }
    public int Year { get; init; }
    public int Month { get; init; }

    public string Title { get; init; }
    public string Description { get; init; }
    public string? LinkedAnomalyId { get; init; }

    public IReadOnlyList<ActionStep> Steps { get; init; }

    public string AssignedTo { get; init; }
    public DateTime? DueDate { get; init; }
    public ActionPlanStatus Status { get; init; }
    // Aberto, EmAndamento, Concluido, Cancelado

    public string? Result { get; init; }
    public DateTime? CompletedAt { get; init; }
    public bool Effective { get; init; }   // O plano resolveu o problema?

    public string CreatedBy { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record ActionStep
{
    public int Order { get; init; }
    public string Action { get; init; }
    public string? Responsible { get; init; }
    public bool Done { get; init; }
}
```

---

### Decision

```csharp
public record Decision
{
    public Guid Id { get; init; }
    public string Store { get; init; }
    public int Year { get; init; }
    public int Month { get; init; }

    public string Context { get; init; }       // "Alta de 34% no FLV"
    public string DecisionMade { get; init; }  // "Reduzir pedido semanal de FLV em 20%"
    public string Justification { get; init; }
    public string DecidedBy { get; init; }
    public DateTime DecidedAt { get; init; }

    // Resultado monitorado nos meses seguintes
    public string? Result { get; init; }
    public int? ResultMonthsLater { get; init; }
    public bool? WasEffective { get; init; }

    public string? ReviewedBy { get; init; }
    public DateTime? ReviewedAt { get; init; }
}
```

---

### KnowledgeContext (para AI Engine — v3.0)

```csharp
// Pacote estruturado de contexto enviado ao AI Engine
// Nunca contém dados brutos do banco — apenas contexto analítico
public record KnowledgeContext
{
    public string Store { get; init; }
    public string Period { get; init; }              // "Julho/2026"
    public string AnalysisSummary { get; init; }     // Do AnalyticsReport
    public string AnomaliesSummary { get; init; }
    public string EventsSummary { get; init; }
    public string ActionPlansSummary { get; init; }
    public string HistoricalTrend { get; init; }
    public string CompanyProfile { get; init; }      // Perfil da empresa
    // Pronto para ser serializado e enviado a um LLM
}
```

---

## Casos de uso principais

### 1. Registrar um evento operacional
```
Gestor identifica que câmara fria parou por 8 dias.
→ Acessa Knowledge Engine.
→ Registra evento tipo "Manutenção" no setor Açougue.
→ Sistema vincula automaticamente às anomalias do período.
→ O evento passa a ser contexto para o Investigation Engine.
→ Aparece na Competência daquele mês para sempre.
```

### 2. Criar plano de ação a partir de uma anomalia
```
Sistema detecta Score 87 no Pão Francês — Crítico.
→ Investigation Engine gera dossiê com hipóteses.
→ Gestor cria plano de ação: "Reduzir produção diária em 10%".
→ Define responsável e prazo.
→ Sistema monitora resultado nos próximos 2 meses.
→ Registra se foi efetivo ou não.
→ Esse aprendizado alimenta futuras hipóteses do Investigation Engine.
```

### 3. Navegar na história da empresa
```
Novo gerente quer entender por que o FLV cresceu em 2025.
→ Acessa Knowledge Engine.
→ Navega pelas competências de 2025.
→ Vê eventos, decisões, planos e resultados de cada mês.
→ Entende o contexto sem depender de quem estava lá.
```

### 4. Passagem de conhecimento entre equipes
```
Gestor antigo sai.
Gestor novo entra.
→ Acessa as últimas 6 competências da loja.
→ Lê os eventos, decisões e planos de ação.
→ Sabe exatamente o que foi feito, por quê e com qual resultado.
→ Semanas de treinamento informal reduzidas.
```

---

## Banco — tabelas do Knowledge Engine

```sql
-- Eventos operacionais
operational_events (
  id uuid primary key,
  store text not null,
  sector text,
  year integer not null,
  month_number integer not null,
  occurred_at timestamptz,
  event_type text not null,
  title text not null,
  description text not null,
  financial_impact numeric(14,2),
  impact_direction text,
  registered_by text,
  created_at timestamptz
)

-- Planos de ação
action_plans (
  id uuid primary key,
  store text not null,
  sector text,
  year integer not null,
  month_number integer not null,
  title text not null,
  description text,
  linked_anomaly_id text,
  assigned_to text,
  due_date date,
  status text not null default 'aberto',
  result text,
  completed_at timestamptz,
  effective boolean,
  created_by text,
  created_at timestamptz,
  updated_at timestamptz
)

-- Passos dos planos
action_plan_steps (
  id uuid primary key,
  plan_id uuid references action_plans(id),
  step_order integer not null,
  action text not null,
  responsible text,
  done boolean default false
)

-- Decisões registradas
decisions (
  id uuid primary key,
  store text not null,
  year integer not null,
  month_number integer not null,
  context text not null,
  decision_made text not null,
  justification text,
  decided_by text,
  decided_at timestamptz,
  result text,
  result_months_later integer,
  was_effective boolean,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz
)

-- Anexos
attachments (
  id uuid primary key,
  store text not null,
  year integer not null,
  month_number integer not null,
  file_name text not null,
  file_type text not null,
  storage_path text not null,
  uploaded_by text,
  created_at timestamptz
)
```
