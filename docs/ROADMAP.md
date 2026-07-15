# ROADMAP — Razarth Intelligence Platform

> **"Primeiro construímos o cérebro. Depois damos olhos, voz e gráficos a ele."**

---

## Filosofia do roadmap

Cada versão entrega **valor operacional real**. Não existe release de infraestrutura sem valor para o gestor. Cada fase tem um objetivo claro, um conjunto de entregas verificáveis e um critério de sucesso mensurável.

---

## Sprint 0 — Fundação (atual)

**Objetivo:** Definir a identidade do produto e a arquitetura antes de escrever a primeira linha de código.

| Entrega | Status |
|---|---|
| PRODUCT_VISION.md | ✅ |
| CORE_ARCHITECTURE.md | ✅ |
| BUSINESS_DICTIONARY.md | ✅ |
| ANALYTICS_ENGINE.md | ✅ |
| KNOWLEDGE_ENGINE.md | ✅ |
| KPI_CATALOG.md | ✅ |
| FORMULA_BOOK.md | ✅ |
| ROADMAP.md | ✅ |

**Critério de sucesso:** documentação aprovada. Toda a equipe sabe o que estamos construindo e por quê.

---

## v1.0 — Inteligência Operacional

**Objetivo:** Transformar os dados já existentes (loss_items, loss_notes, histórico) em inteligência automática acessível via API e interface web.

**Foco:** supermercados brasileiros de médio porte com múltiplas lojas.

### Sprint 1 — Analytics Engine Core

| Entrega | Descrição |
|---|---|
| Razarth.sln + estrutura de projetos | Solução .NET 9 completa com todos os projetos |
| Razarth.Domain | Entities, ValueObjects, Enums, Interfaces |
| Razarth.Shared | Result<T>, types, extensions compartilhados |
| Statistics.cs | Média, desvio, mediana, Z-Score, IQR |
| Comparison.cs | Comparações temporais e cross-store |
| Trend.cs | Regressão linear, direção, intensidade |
| Ranking.cs | Rankings por qualquer dimensão |
| Anomaly.cs | Radar de anomalias com evidências |
| Score.cs | Score 0-100 com breakdown |

**Critério de sucesso:**
```
analyticsEngine.Analyze(context)
→ retorna AnalyticsReport completo no console
   com score, anomalias, comparações e tendência.
```

### Sprint 2 — Rules Engine + Data Engine

| Entrega | Descrição |
|---|---|
| Razarth.Rules | Tolerâncias, pesos, limites configuráveis |
| Razarth.Data | Repositories, EF Core, Migrations |
| XmlImporter.cs | Importação de NF-e XML com validação |
| ExcelImporter.cs | Importação de planilhas históricas |
| ImportPipeline.cs | Validar → Normalizar → Persistir |

**Critério de sucesso:** importação de XML completa via pipeline com resultado estruturado (itens importados, erros, avisos).

### Sprint 3 — Investigation Engine + API

| Entrega | Descrição |
|---|---|
| Investigation Engine | Hipóteses, dossiê, plano de ação automático |
| Razarth.Application | Commands, Queries, Handlers (CQRS) |
| Razarth.Api | Controllers REST + Middleware |
| Autenticação | JWT + RBAC básico |
| Endpoints principais | /analytics, /anomalies, /investigations, /import |

**Critério de sucesso:** API funcionando localmente, retornando AnalyticsReport via HTTP GET.

### Sprint 4 — Razarth Web

| Entrega | Descrição |
|---|---|
| Setup React 19 + Vite + TypeScript | Scaffolding + estrutura de pastas |
| Dashboard Executivo | KPIs + Radar de Anomalias + Tendências |
| Página de Investigação | Dossiê completo por anomalia |
| Importação Web | Upload de XML via interface |

**Critério de sucesso:** gestor acessa o dashboard e vê KPIs, anomalias e score do período selecionado, com comparações automáticas.

### Sprint 5 — Razarth Desktop

| Entrega | Descrição |
|---|---|
| Setup Avalonia UI | Scaffolding da aplicação desktop |
| Importação em lote | Selecionar pasta → importar todos os XMLs |
| Administração de regras | Configurar tolerâncias e pesos via UI |
| Auditoria de importações | Histórico de importações com detalhes |

---

**v1.0 — Critério de sucesso geral:**

> O gestor abre o sistema, seleciona loja + período, e recebe automaticamente:
> - KPIs comparativos
> - Lista de anomalias rankeadas por score
> - Dossiê de investigação para as anomalias críticas
> - Recomendações de ação
>
> Sem nenhuma intervenção manual de análise.

---

## v1.5 — Knowledge Engine Completo

**Objetivo:** Transformar o Razarth na memória institucional da empresa.

| Entrega | Descrição |
|---|---|
| Knowledge Engine completo | Competências navegáveis com histórico completo |
| Registro de eventos | Gestor registra eventos operacionais com impacto |
| Planos de ação | Criar, acompanhar e avaliar efetividade |
| Histórico de decisões | Decisão + resultado + aprendizado |
| Anexos | Fotos, atas e documentos vinculados a competências |
| Passagem de conhecimento | Interface para onboarding de novos gestores |

**Critério de sucesso:**

> Novo gestor acessa as últimas 6 competências da loja e entende todo o histórico de anomalias, decisões e resultados — sem precisar perguntar a ninguém.

---

## v2.0 — Forecast Engine

**Objetivo:** Antecipar problemas antes do fechamento.

| Entrega | Descrição |
|---|---|
| Forecast Engine | Projeção de perdas para próximos 3 meses |
| Alertas preventivos | Notificação quando projeção ultrapassa tolerância |
| Sazonalidade | Ajuste automático de expectativas por período do ano |
| Simulações | "Se reduzirmos 10% na produção, qual o impacto?" |

**Critério de sucesso:**

> Sistema projeta os valores do mês seguinte com precisão ≥ 80% (dentro de ±20% do valor real).

---

## v3.0 — AI Engine

**Objetivo:** Inteligência generativa integrada com dados reais.

| Entrega | Descrição |
|---|---|
| AI Context Engine | Preparação de contexto para LLMs |
| Análise conversacional | Gestor pergunta, Razarth responde com dados |
| Relatórios narrativos | Texto automático explicando o fechamento |
| Recomendações personalizadas | Baseadas no perfil da loja e histórico de decisões |

**Critério de sucesso:**

> Gestor digita: *"O que aconteceu com a Padaria em julho?"*
> Sistema responde com parágrafo completo, baseado nos dados reais,
> sem inventar nenhuma informação.

---

## Princípios do roadmap

- **Cada versão é standalone.** v1.0 tem valor sem v1.5. v1.5 tem valor sem v2.0.
- **O Core não regride.** Nenhuma versão quebra contratos estabelecidos nas anteriores.
- **Testes antes de features.** Nenhum Engine entra em produção sem cobertura de testes.
- **Documentação junto com código.** Sprint 0 não foi opcional — foi o primeiro passo.
