# PRODUCT VISION — Razarth Intelligence Platform

> **"Primeiro construímos o cérebro. Depois damos olhos, voz e gráficos a ele."**

---

## Missão

Transformar dados operacionais de supermercados em inteligência estratégica que reduz perdas,
elimina desperdícios e acelera decisões — de forma automática, contínua e auditável.

---

## Visão

Ser a plataforma de inteligência operacional de referência para o varejo alimentar brasileiro,
tornando a análise de dados acessível a gestores de qualquer nível técnico e transformando
cada fechamento mensal em uma fonte de aprendizado institucional.

---

## Propósito

Hoje, supermercados registram. O Razarth explica.

Todo gestor sabe *quanto* perdeu. Poucos sabem *por quê*, *desde quando*, *em qual tendência*
e *o que fazer a respeito*. Menos ainda conseguem comparar esse resultado com outras lojas,
com o histórico da empresa ou com o mesmo período do ano anterior — sem horas de planilha.

O Razarth existe para fechar essa lacuna. Não com dashboards de números, mas com inteligência
que orienta ação e preserva o conhecimento da empresa para sempre.

---

## Público-alvo

### Usuário primário
- Coordenadores e gerentes de operações de redes de supermercados.
- Responsáveis pelo fechamento mensal de perdas e uso/consumo.
- Analistas financeiros e de controladoria do varejo.

### Usuário secundário
- Diretores e donos de redes pequenas e médias.
- Auditores internos e externos.
- Consultores de operações de varejo.

### Usuário avançado (Razarth Desktop)
- Administradores do sistema.
- Responsáveis por importações em massa (XML, Excel, CSV).
- Equipes de TI e auditoria técnica.

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
