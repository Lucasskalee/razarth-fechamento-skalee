# PRODUCT VISION v2.0 — Razarth Platform

> **Strategic Pivot: From "Analytics for Supermarkets" to "Multi-tenant SaaS Platform for Small Business Online Presence"**

---

## O Que Mudou

### Antes (Razarth Intelligence)
- Foco: ERP + Analytics especializado em supermercados
- Mercado: Apenas varejo alimentar
- Modelo: Um cliente por deploy
- Complexidade: Alta (múltiplas engines)
- MVP: Analytics + Dashboard + IA

### Agora (Razarth Platform v2.0)
- Foco: **Plataforma SaaS multi-tenant** onde qualquer empresa pequena/média pode ter presença online
- Mercado: Barbearias, restaurantes, estúdios, clínicas, academias, lojas, serviços
- Modelo: Múltiplas empresas no mesmo banco (tenant)
- Complexidade: Começar simples, expandir com módulos
- MVP: Cadastro → Empresa → Página pública → Catálogo → WhatsApp

---

## Missão (Revisada)

Criar uma plataforma acessível onde qualquer pequeno negócio consegue:
1. Se cadastrar em 2 minutos
2. Criar sua empresa/marca
3. Ter página online com produtos/serviços
4. Receber pedidos/contatos via WhatsApp

Sem precisar de programador, sem precisar pagar caro, sem precisar de infraestrutura.

---

## Visão

Ser a plataforma de entrada para PMEs brasileiras irem online.

Quando crescerem, adicionam módulos de IA, agendamento, delivery, analytics.

---

## Públicos-Alvo (Novo)

### v1 MVP
- Barbearias
- Estúdios de beleza (cílios, unhas)
- Restaurantes simples
- Lojas de varejo pequenas
- Consultórios (advogados, psicólogos)
- Prestadores de serviço

### Depois (v1.5+)
- Academias
- Clínicas
- Supermercados (com Analytics module)
- Agências

---

## Razarth Platform Não É

❌ ERP completo  
❌ Solução empresarial complexa  
❌ Concorrente de Shopify/WooCommerce  
❌ Tudo para todo mundo  

---

## Razarth Platform É

✅ Ponto de entrada para PMEs online  
✅ Escalável: começa simples, fica complexo  
✅ Modular: cada negócio usa o que precisa  
✅ Brasileiro: pensado para realidade local  

---

## O Objetivo Real

Você não está construindo um ERP.

Você está construindo **uma casa** onde cada PME coloca seus móveis (módulos).

A plataforma é a fundação que todas compartilham.

Cada um customiza seu espaço.


### Perfil operacional atual (Skalee Sol)
- Rede com múltiplas lojas: SOL 1, SOL 2, SOL 3, SOL 4, SOL 6 CD, SOL 7.
- Setores: Açougue, FLV, Padaria, Produção Padaria, Frios e Congelados,
  Mercearia, Bebidas, Hortifruti, Frente de Caixa, Administrativo, Loja/Depósito.
- Tipos de movimentação: Perdas/Saídas, Uso e Consumo, Saída entre Lojas.
- Processo atual: importação de XML, classificação manual, fechamento mensal por setor.

---

## Problemas que resolve

| Problema real | Como o Razarth resolve |
|---|---|
| Gestor sabe o total perdido, mas não sabe *por quê* | Analytics Engine explica causas prováveis com base no histórico |
| Anomalias passam despercebidas mês a mês | Radar de Anomalias detecta desvios automaticamente com score |
| Comparações feitas manualmente em planilha | Motor de Comparação gera todos os cruzamentos sem intervenção |
| Decisões baseadas em intuição | Score de Criticidade prioriza objetivamente onde agir |
| Histórico da empresa se perde com trocas de equipe | Knowledge Engine registra cada evento, decisão e resultado |
| Auditoria lenta e trabalhosa | Investigation Engine gera dossiê completo com um clique |
| Tolerâncias diferentes por loja/setor são impossíveis de configurar | Rules Engine centraliza todas as regras sem precisar de código |
| Dados sujos ou inconsistentes entram no banco | Data Engine valida, normaliza e versiona antes de persistir |
| Cada mês começa do zero | Tendências e reincidências são rastreadas continuamente |

---

## Diferenciais

### 1. Inteligência, não relatório
O Razarth nunca apenas mostra números. Para qualquer dado exibido, o sistema responde
automaticamente: *o que aconteceu, por que, qual o impacto, o que investigar e o que fazer*.

### 2. Motor analítico independente da interface
O cérebro do Razarth — o Analytics Engine — é uma C# Class Library completamente separada
de qualquer tela. Pode ser consumido pela Web, pelo Desktop, por uma API externa ou por
testes automatizados.

### 3. Memória institucional
O Knowledge Engine transforma cada competência em uma página da história da empresa:
indicadores, eventos, justificativas, planos de ação, resultados e responsáveis —
tudo vinculado e auditável. Cada mês consultável para sempre.

### 4. Rules Engine configurável
Tolerâncias, pesos do score e limites de anomalia são regras de negócio — não constantes
no código. Cada cliente configura suas próprias regras sem intervenção técnica.

### 5. Score de criticidade objetivo
Ao invés de tabelas com dezenas de colunas, o gestor recebe um score de 0 a 100 que
resume a situação e prioriza onde concentrar atenção — com breakdown explicando cada
fator do cálculo.

### 6. Data Engine como guardião da qualidade
Toda importação passa pelo Data Engine antes de chegar ao banco. XML, Excel, CSV —
todos normalizados, validados e versionados pelo mesmo pipeline.

### 7. Arquitetura preparada para IA
O AI Context Engine prepara pacotes de contexto estruturado para modelos de linguagem
sem jamais acessar o banco diretamente. A IA é uma evolução natural, não um add-on.

---

## Filosofia do produto

**ERP registra. Razarth explica.**

Princípios que guiam cada decisão de produto e arquitetura:

- **Nenhuma funcionalidade sem valor operacional.**
  Cada feature deve: reduzir tempo de análise, reduzir perdas, apoiar decisões,
  aumentar rastreabilidade ou facilitar auditoria. Se não gerar um desses resultados,
  a funcionalidade deve ser reavaliada.

- **Complexidade interna, simplicidade externa.**
  O motor pode ser sofisticado; a resposta para o gestor deve ser direta e acionável.

- **Dados reais, nunca inventados.**
  O sistema nunca supõe. Toda conclusão é baseada nos dados do banco e tem sua
  metodologia explicitada ao usuário.

- **O Core é o produto.**
  A interface é a janela. O Analytics Engine é o patrimônio real do Razarth.
  Uma arquitetura bem pensada é o que permite crescer sem virar um emaranhado de código.

- **Configurabilidade sem código.**
  Regras de negócio mudam. Tolerâncias mudam. Pesos mudam. O sistema deve absorver
  essas mudanças via configuração, nunca via código.

- **Auditabilidade total.**
  Cada análise, cada score, cada anomalia detectada deve ter sua origem rastreável.
  O sistema não pode ser uma caixa preta para o gestor.

---

## Roadmap

### v1.0 — Inteligência Operacional (2026)
**Foco: análise de perdas e uso/consumo com inteligência automática.**

- Analytics Engine completo (Statistics, Comparison, Trend, Ranking, Anomaly, Score).
- Rules Engine com configuração de tolerâncias por setor e loja.
- Data Engine para importação de XML, Excel e CSV.
- Investigation Engine com relatório estruturado por anomalia.
- Knowledge Engine básico: registro de eventos e competências.
- Razarth API (ASP.NET Core .NET 9) — endpoints REST completos.
- Razarth Web (React 19 + TypeScript + Vite) — Dashboard executivo.
- Razarth Desktop (C# + Avalonia UI) — Importação e administração.
- Banco PostgreSQL via Supabase.
- Testes automatizados (xUnit) nos Engines.

### v1.5 — Knowledge Engine completo (2026)
**Foco: memória institucional.**

- Competências navegáveis com toda a história do mês.
- Justificativas vinculadas a anomalias.
- Planos de ação rastreáveis com responsável e prazo.
- Histórico de decisões por loja, setor e produto.
- Anexos, fotos e atas vinculados a eventos.
- Passagem de conhecimento entre equipes.

### v2.0 — Forecast Engine (2027)
**Foco: previsão e prevenção.**

- Projeção de perdas para os próximos meses por setor e loja.
- Alertas preventivos antes do fechamento mensal.
- Sazonalidade por produto, setor e loja.
- Simulações de cenários com variação de tolerâncias.

### v3.0 — AI Engine ativo (2027+)
**Foco: inteligência generativa integrada.**

- Análise conversacional com dados reais da empresa.
- Geração automática de relatórios narrativos em linguagem natural.
- Recomendações personalizadas por perfil de gestor.
- AI Context Engine enviando contexto estruturado para LLMs.
- Aprendizado contínuo com base no histórico de decisões e resultados.
