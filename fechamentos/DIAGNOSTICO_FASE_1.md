# Fase 1 — Diagnóstico do fluxo de dados

Data da auditoria estática: 2026-08-25.

## Escopo e método

Este diagnóstico cobre o frontend e os artefatos SQL do módulo `fechamentos`. Nenhum código, dado, policy, índice ou objeto do Supabase foi alterado. As conclusões vêm da leitura estática do repositório; tempos, bytes transferidos, cardinalidades reais e planos `EXPLAIN` ainda não foram medidos em produção e, portanto, não são inventados neste documento.

## Resumo executivo

O maior gargalo está no Dashboard principal (`index.html`): sua inicialização chama `loadAllData()`, que busca **todas as colunas de todas as notas e, em seguida, todas as colunas de todos os itens**. Só depois o navegador associa itens às notas, filtra, soma, agrupa e renderiza todos os indicadores. A paginação de 1.000 registros nessa rotina é apenas paginação técnica de transporte; ela percorre a tabela inteira e não limita o conjunto exibido.

## Atualização da implementação — 2026-09-02

Esta entrega aplica apenas mudanças de baixo risco sobre o diagnóstico:

- a busca de NF não baixa mais os itens das 20 notas retornadas antes da seleção;
- itens consultados na tela de NF permanecem em cache por cinco minutos e são
  invalidados quando o Realtime altera o `note_key` correspondente;
- consultas da busca e do detalhe registram duração e quantidade de linhas
  somente em desenvolvimento/localhost;
- foi adicionada uma tabela opcional de agregados mensais em
  `supabase_analytics_layer.sql`, sem escrita aberta pelo frontend.

O carregamento integral do Dashboard e o reload global disparado pelo Realtime
continuam sendo riscos conhecidos e exigem uma próxima etapa com view/RPC
agregada e uma mudança coordenada no modelo de estado da tela. Não foram
marcados como resolvidos nesta fase.

## Performance Architecture V1 — Dashboard e Realtime

### Fluxo antes

- Dashboard: `loadDashboardSummary()` lia todas as notas e depois
  `loadAllData()` lia novamente as notas e todos os itens, em lotes de 1.000.
- Os KPIs, agrupamentos, pendências, rankings e gráficos eram calculados sobre
  os arrays brutos no navegador.
- Cada evento Realtime agendava `reloadFromDatabase()` no Dashboard.
- Fechamento mensal recarregava grade, análise gerencial e detalhes abertos.

Requests, duração, bytes e cardinalidades reais: **NÃO MEDIDO**.

### Fluxo depois

- Dashboard inicia com uma consulta à view compacta
  `v_loss_dashboard_summary`, retornando linhas agregadas por loja/período/tipo/setor.
- O resumo possui TTL de 60 segundos e telemetria em desenvolvimento.
- Notas e itens brutos só são carregados quando uma aba de detalhe é acessada.
- Eventos Realtime são coalescidos em 500 ms, produzem um mapa de impacto e
  invalidam o resumo/cache de itens relacionado; não executam carga global.
- No fechamento mensal, somente uma célula aberta é atualizada após um evento
  relevante. Sem célula aberta, nenhum refetch é executado.

Requests, duração, bytes e cardinalidades reais: **NÃO MEDIDO**; a redução
estrutural de payload e de cargas integrais foi validada por inspeção estática.

## Validação da Performance V1 — 2026-09-02

### A. Migration

**MIGRATION NÃO APLICADA.** O endpoint REST do projeto
`khevuaohphrwhjasmbsy.supabase.co` respondeu `PGRST205` para
`v_loss_dashboard_summary`, confirmando que a view ainda não existe no schema
publicado. Não há `SUPABASE_ACCESS_TOKEN`, credencial de banco ou permissão de
SQL Editor disponível neste ambiente para aplicar DDL com segurança. Nenhuma
operação destrutiva foi executada.

O SQL foi revisado contra `supabase_schema.sql`: tabelas, colunas e a FK
`loss_items.note_key -> loss_notes.note_key` são compatíveis. A view usa
`security_invoker = true`; não usa `security definer` nem `service_role`.

### B. RLS e isolamento

| Estrutura | Policy/mecanismo | Risco | Status |
|---|---|---|---|
| `loss_notes` | RLS habilitado; policies `anon` com `using (true)` | Qualquer cliente com a chave publicável pode ler todas as lojas | **Risco preexistente; isolamento não comprovado** |
| `loss_items` | RLS habilitado; policies `anon` com `using (true)` | Mesmo risco para itens e notas relacionadas | **Risco preexistente; isolamento não comprovado** |
| `v_loss_dashboard_summary` | `security_invoker`; herda RLS das tabelas-base | Se publicada sobre as policies atuais, agregará dados globalmente | **Não aplicar até corrigir o modelo de autorização** |
| `loss_monthly_summary` | RLS habilitado sem policy | Leitura negada por padrão; não utilizável pelo frontend | **Seguro por negação, não integrado** |

O REST confirmou acesso anônimo às tabelas `loss_notes` e `loss_items`.
Portanto não é possível afirmar que um usuário esteja restrito à sua
loja/workspace. A migration não deve ser publicada como solução de isolamento.

### C. Smoke tests

- `index.html`: HTTP 200 local.
- `fechamento.html`: HTTP 200 local.
- `assistente-ia.html`: HTTP 200 local.
- Sintaxe dos módulos JavaScript alterados: aprovada.
- Busca server-side e itens sob demanda: preservados por inspeção dos fluxos.
- Realtime seletivo: preservado por inspeção; não foi possível executar uma
  alteração controlada sem credencial de usuário/SQL.
- Console, requests reais do navegador, payload/bytes e tempo até KPI:
  **NÃO MEDIDO**.

### D. Comparativo

| Métrica | Antes | Depois | Status |
|---|---:|---:|---|
| Requests iniciais do Dashboard | NÃO MEDIDO | NÃO MEDIDO | Não instrumentado historicamente |
| Registros iniciais | NÃO MEDIDO | NÃO MEDIDO | View não aplicada |
| Tempo do resumo | NÃO MEDIDO | NÃO MEDIDO | View não aplicada |
| Itens carregados no boot | Todos os itens no fluxo anterior | 0 no fluxo agregado; fallback legado enquanto view ausente | Estruturalmente validado |
| Queries por evento Realtime | NÃO MEDIDO | 1 resumo coalescido no Dashboard; 0 no fechamento sem célula aberta | Inspeção estática |
| Reload global | Existente | Removido do caminho Realtime | Validado por código |
| Cache de itens | Existente, TTL 5 min | Mantido e invalidado por `note_key` | Validado por código |

### E. Regressão corrigida

Como a view ainda não existe no Supabase, `loadDashboardSummary()` agora
detecta `PGRST205` e mantém um fallback compatível para o Dashboard. Esse
fallback é deliberadamente marcado como temporário e mantém a carga pesada
somente até a migration ser aplicada.

### F. Decisão

**PERFORMANCE V1 AINDA NÃO VALIDADA.**

Motivos objetivos: migration não aplicada, isolamento por tenant inexistente
nas policies atuais e métricas reais de navegador/Realtime não coletadas.

Próxima etapa recomendada: corrigir primeiro o modelo de autorização/RLS,
aplicar a view com credencial administrativa controlada e repetir os smoke
tests e medições. Somente após isso considerar
`ANALYTICS V1 — CONTEXTO HISTÓRICO DE 3 MESES`.

O Realtime agrava esse custo: qualquer `INSERT`, `UPDATE` ou `DELETE` em `loss_notes` ou `loss_items` provoca, após debounce de 500 ms, uma nova carga integral do Dashboard.

A página de fechamento mensal está mais próxima do fluxo desejado: a lista de notas tem páginas de 25 e os itens são buscados por `note_key`. Porém, a abertura da tela ainda busca todas as notas do ano para construir a grade e, logo depois, todos os itens do recorte gerencial para calcular a análise no frontend. Ao abrir uma célula, o primeiro item da primeira nota é carregado automaticamente, mesmo sem escolha explícita do usuário.

Já existem views consolidadas (`v_monthly_closing_grid`, `v_historical_closing_grid`) e índices úteis, mas o caminho ativo da grade mensal ignora `v_monthly_closing_grid`. Não foi encontrada materialized view nem RPC de leitura/agregação. A única RPC referenciada no frontend é administrativa, `reset_import_data`.

## Arquitetura atual encontrada

```text
index.html / main.js
  -> loadAllData()
     -> loss_notes: tabela inteira, select(*)
     -> loss_items: tabela inteira, select(*)
  -> groupItemsByNote() + applyFilters()
  -> dashboard.js calcula todos os KPIs, rankings e gráficos no navegador
  -> Realtime global em loss_notes + loss_items
     -> reloadFromDatabase() integral

fechamento.html / fechamento.js
  -> fetchGrid()
     -> loss_notes do ano/loja/tipo, todas as páginas
     -> monthly_closing_entries do ano
     -> fallback histórico somente quando não há notas
  -> fetchManagerialItems() no carregamento inicial
     -> loss_items do recorte, todas as páginas
  -> ao abrir célula: notas paginadas
     -> consultas auxiliares de auditoria
     -> carrega automaticamente itens da primeira nota
```

A separação em `services/` já existe, o que facilita a refatoração incremental. Entretanto, `importacao.js` mistura importação, persistência, leitura integral e rotinas administrativas; `dashboard.js` recebe grandes arrays e concentra agregações e renderização; há ainda duas implementações sobrepostas para fechamento mensal: `fechamento.js` e `fechamentoMensalApi.js`.

## Inventário das consultas de leitura

“Potencial” descreve o limite imposto pelo código, não a cardinalidade real do banco.

| Consulta | Arquivo / função | Quando executa | Dados e potencial | Inicial? | Risco | Melhoria sugerida |
|---|---|---|---|---|---|---|
| `loss_notes.select('*')` paginado em lotes de 1.000 | `services/importacao.js` / `loadNotesFromDatabase` | Inicialização do Dashboard e todo reload | Todas as colunas e todos os registros | Sim | Alto: egress e latência crescem com toda a base | Endpoint/view de resumo; colunas explícitas; filtros de período/loja no banco |
| `loss_items.select('*')` paginado em lotes de 1.000 | `services/importacao.js` / `loadItemsFromDatabase` | Depois das notas, no Dashboard | Todas as colunas e todos os itens | Sim | Crítico: maior tabela e bloqueia toda a UI | Não buscar itens no boot; resumo agregado e itens sob demanda |
| `loss_notes` com 9 colunas e `.range()` até esgotar | `services/fechamento.js` / `fetchAllLossNotes` | Abertura/recarga da grade mensal | Todas as notas do ano, opcionalmente loja/tipo | Sim, em `fechamento.html` | Alto | Ativar a view consolidada ou RPC de resumo por ano/loja/tipo/setor |
| `monthly_closing_entries` com 8 colunas, sem paginação | `services/fechamento.js` / `fetchGridFromLossNotes` | Após carregar as notas da grade | Todas as auditorias do ano/loja/tipo | Sim | Médio | Trazer auditoria já associada no resumo consolidado; filtrar mês quando aplicável |
| `v_historical_closing_grid.select('*')` | `services/fechamento.js` / `fetchGridFromHistoricalEntries` | Apenas se a consulta de notas não retornar linhas | Linhas consolidadas de um ano | Condicional | Baixo/médio | Colunas explícitas; manter por já ser agregado |
| `loss_notes` com `count: exact` | `services/fechamento.js` / `fetchCellNotes` | Ao abrir célula ou carregar mais | 9 colunas; 25 por página em célula simples | Não | Baixo/médio | Manter paginação; considerar `count: planned/estimated` se o total exato não for obrigatório |
| `loss_notes` de até 1.000 linhas e filtro de setor/tipo no JS | mesma função, célula agrupada | Ao abrir célula agrupada | Até 1.000 antes de `filter()`/`slice()` locais | Não | Alto; paginação incorreta acima de 1.000 | Traduzir agrupamento em filtros SQL ou RPC; paginar depois do filtro no banco |
| `monthly_closing_entries` por ano/mês + listas `.in()` | `fetchMonthlyAuditRows` | Após buscar notas da célula | Auditorias das combinações presentes | Não | Médio | Incorporar via view/RPC ou consultar apenas chaves da página atual |
| `monthly_closing_notes` por `entry_id` e `note_key` | `fetchMonthlyAuditRows` | Após consulta anterior | Auditorias das notas da página | Não | Baixo | Manter em lote ou incorporar à consulta resumida de notas |
| fallback da consulta anterior sem `classification` | `fetchMonthlyAuditRows` | Só quando o schema não possui a coluna | Repete a consulta | Não | Baixo hoje; complexidade permanente | Após validar schema real, remover fallback legado em fase segura |
| `loss_items` por `note_key` | `fetchNoteItems` | Primeira nota automática e troca de nota | Todos os itens de uma nota, 9 colunas | Não | Baixo/médio | Manter sob demanda; não abrir automaticamente; cache com TTL/invalidação |
| `loss_items` gerencial, 16 colunas, lotes até esgotar | `fetchManagerialItems` | Inicialização da página mensal e mudança de filtro | Todos os itens do mês/ano/loja/setor/tipo/motivo | Sim | Crítico no fechamento | RPC/view agregada para KPIs; top produtos/motivos limitados; detalhes separados |
| `v_monthly_closing_grid.select('*')` | `services/fechamentoMensalApi.js` / `fetchMonthlyClosingGrid` | Caminho alternativo/legado; não localizado no boot ativo | Linhas consolidadas filtradas | Não no fluxo ativo | Baixo, mas duplicado | Eleger uma única implementação e usar colunas explícitas |
| `v_monthly_closing_notes.select('*', count exact)` | `fechamentoMensalApi.js` / `fetchMonthlyClosingNotes` | Caminho alternativo/legado | Página de notas | Não no fluxo ativo | Médio por duplicidade | Consolidar com `fechamento.js` |
| `loss_items` por nota | `fechamentoMensalApi.js` / `fetchMonthlyClosingNoteItems` | Caminho alternativo/legado | Itens de uma nota | Não no fluxo ativo | Baixo, duplicado | Consolidar implementação/cache |
| busca exata de NF em `loss_notes`, limite 20 | `services/notas.js` / `searchNf` | Ação explícita de busca | 11 campos | Não | Baixo | Manter; validar índices de `invoice` e `access_key` |
| busca alternativa por `access_key`, limite 20 | mesma função | Só se busca exata não acha resultado | 11 campos | Não | Baixo | `access_key` já possui índice único/parcial no SQL |
| itens para todas as notas encontradas | mesma função | Após busca de NF | Todos os itens das até 20 notas | Não | Médio; pode baixar detalhes antes da escolha | Em múltiplos resultados, buscar itens apenas após selecionar uma nota |
| itens por nota | `services/notas.js` / `loadNfItems` | Seleção de NF | Todos os itens da nota | Não | Baixo | Reutilizar um único serviço/cache de itens |
| três verificações sequenciais de duplicidade | `services/importacao.js` / `getExistingNoteByKey`, `getExistingNoteByAccessKey`, `getExistingNoteByComposite` | Para cada XML importado, conforme fallbacks | Até 3 consultas por nota | Não | Alto em importações grandes; padrão N×3 | RPC/constraint/upsert que resolva identidade em uma ida, após validar regra |
| contagem exata de itens salvos | `getSavedItemCount` | Conferência por nota importada | `head`, sem linhas, mas uma consulta por nota | Não | Médio em lote | Retornar/validar contagem no fluxo de persistência em lote |
| leitura de todas as chaves antes de limpar | `clearRemoteTable` | Reset administrativo explícito | Todas as chaves, sem paginação | Não | Alto, além de destrutivo | Não alterar nesta fase; manter protegido e revisar separadamente |
| `reset_import_data` RPC | `tryResetImportRpc` | Reset administrativo explícito | Não determinado no repositório principal | Não | Fora do carregamento | Auditar definição e autorização antes de qualquer mudança |
| `/auth/v1/user` | `api/analisar-fechamento.js` / `authenticate` | Cada solicitação de análise IA | Um usuário autenticado | Não | Baixo | Manter; não é consulta de dados gerenciais |

As operações de escrita (`upsert`, `update`, `insert` e rotinas de exclusão administrativa) foram localizadas, mas não são gargalos do carregamento inicial. Nenhuma delas foi executada durante esta auditoria.

## Consultas redundantes e sobreposição

1. `loadAllData()` carrega notas e itens separadamente; depois `groupItemsByNote()` reconstrói no cliente uma relação que já existe por `note_key`.
2. `fechamento.js` e `fechamentoMensalApi.js` implementam grade, notas, itens, caches e salvamento de auditoria em paralelo. O fluxo ativo importa `fechamento.js`; a segunda camada aumenta risco de divergência.
3. Há três funções diferentes de itens por nota (`fetchNoteItems`, `fetchMonthlyClosingNoteItems`, `loadNfItems`) com seleções muito parecidas e caches separados ou inexistentes.
4. A grade mensal baixa notas detalhadas e agrega no frontend, embora `v_monthly_closing_grid` já exista no SQL.
5. Ao abrir uma célula, a consulta de notas é seguida por consultas de auditoria e pela consulta automática dos itens da primeira nota.
6. Após alterações locais simples, `updateLocalItem()` reconstrói notas, reaplica filtros e renderiza Dashboard, itens e classificação novamente.

## Cálculos executados no frontend

### Dashboard principal

- Associação de todos os itens às notas (`groupItemsByNote`).
- Filtros por base, loja, tipo, setor, motivo, mês e nota.
- Total geral, perdas, uso/consumo e contagem distinta de notas.
- Pendências, percentual concluído e notas sem itens.
- Totais e pendências por loja, setor, nota, mês, tipo e motivo.
- Rankings de produtos; soma de quantidade e valor; loja líder.
- Séries e detalhes dos gráficos, incluindo conjuntos distintos de produtos, notas, lojas e setores.
- Relatório de impressão, que repete várias agregações.

Essas rotinas percorrem o mesmo array muitas vezes com combinações de `filter`, `reduce`, `forEach`, `Set` e ordenações. O custo é proporcional ao total de itens baixados, não apenas ao recorte visível.

### Fechamento mensal / análise gerencial

- Normalização e construção da grade anual por loja/tipo/setor/mês.
- Soma e média mensal, comparação com período anterior e variação percentual.
- Separação de perda real, uso/consumo e saídas.
- Totais, preço médio, quantidade e valor por loja, setor, motivo e produto.
- Rankings, diagnóstico e contexto consolidado para IA.

O payload da IA já é consolidado e limitado; o gargalo ocorre antes, pois o navegador baixa e agrega os itens brutos para construí-lo.

## N+1 e consultas em rajada

- Não foi encontrado o padrão clássico “30 notas → 30 buscas de itens” na listagem mensal: os itens são buscados apenas para uma nota por vez.
- Existe N+1 no salvamento em massa de motivos: `saveItemReasons()` chama `saveItemReason()` via `Promise.all`, produzindo uma requisição `UPDATE ... SELECT` por item.
- A importação pode executar múltiplas consultas de duplicidade e contagem por XML, além dos upserts em lotes.
- A busca de NF evita N+1 usando `.in(note_key, noteKeys)`, mas pode trazer itens de até 20 notas antes de o usuário escolher entre resultados múltiplos.
- Abertura da célula mensal forma uma pequena cadeia sequencial: notas → entries → auditorias de notas → itens da primeira nota.

## Realtime e polling

Existe um canal `gestao-perdas-realtime` inscrito em todos os eventos de `loss_notes` e `loss_items`, sem filtro de loja, período, setor ou tipo. O callback não usa o payload para identificar o recorte afetado: apenas aplica debounce de 500 ms e chama `reloadFromDatabase()`, que baixa novamente as duas tabelas inteiras.

Não foi encontrado polling periódico ao Supabase. O `setInterval` de 1 segundo em `fechamento.js` atualiza somente o relógio. Os demais `setTimeout` observados são de UI, impressão ou debounce do Realtime.

## Cache atual e oportunidades

Já existe:

- cache em memória de páginas de notas e itens por nota em `services/fechamento.js`;
- uma segunda dupla de caches em `fechamentoMensalApi.js`;
- fallback integral em `localStorage` para notas e itens importados;
- invalidação manual após algumas escritas.

Problemas:

- o Dashboard não tem cache de resumo nem stale-while-revalidate;
- os caches em memória não têm TTL, estado de erro compartilhado ou deduplicação explícita de Promises em andamento;
- caches duplicados podem divergir;
- Realtime invalida de fato o Dashboard inteiro;
- o fallback em `localStorage` replica a base bruta e pode aumentar tempo de serialização, memória e risco de dados antigos.

Oportunidade prioritária: cachear respostas consolidadas por chave estável (`basis|year|month|store|sector|type`) e páginas por (`...|page|limit`), deduplicando requisições em andamento e invalidando apenas as chaves atingidas por uma escrita/evento.

## Views, RPCs e agregação PostgreSQL

Objetos encontrados:

- `v_monthly_closing_grid`: agrega notas por loja/ano/mês/tipo/setor e associa auditoria.
- `v_monthly_closing_notes`: lista notas com auditorias da célula.
- `v_historical_closing_grid`: agrega histórico mensal.
- `monthly_closing_entries`, `monthly_closing_notes`, `monthly_closing_observations`.
- nenhuma materialized view encontrada.
- nenhuma RPC de leitura/agregação encontrada.

Oportunidades, ainda sem SQL proposto:

1. Validar e ativar `v_monthly_closing_grid` para a grade, corrigindo previamente a diferença entre base de emissão e competência.
2. Criar uma API SQL estável de resumo do Dashboard (view ou RPC) com filtros de período/loja/setor/tipo e totais consolidados.
3. Separar agregados principais, ranking de produtos e ranking de motivos para permitir carregamento progressivo e limites `top N`.
4. Considerar tabela/materialized view somente após medir frequência de escrita, custo de refresh e necessidade de frescor; a view comum ou RPC é o primeiro passo de menor risco.
5. Reutilizar o formato consolidado já montado para a IA como contrato de leitura, sem enviar itens brutos.

## Índices existentes e lacunas a validar

Índices relevantes declarados no repositório:

- `loss_notes`: PK `note_key`, único/parcial em `access_key`, `store`, `(competence_month, emission_month)` e `(store, type, sector, emission_date)`.
- `loss_items`: `note_key`, `(note_key, item_index)`, `access_key`, `(store, type, sector, reason)` e `(competence_month, store, sector, reason, product)`.
- fechamento: combinações de lookup em entries, entry/status e note_key nas auditorias.
- histórico: índices individuais e composto `(year, month_number, store_name, entry_type, sector)`.

Lacunas candidatas, que exigem `EXPLAIN (ANALYZE, BUFFERS)` e verificação dos índices reais antes de qualquer SQL:

- `loss_notes(invoice)` para a busca exata de NF.
- Índice alinhado ao filtro dominante por competência em `loss_notes`, por exemplo iniciando por `competence_month` e depois loja/tipo/setor; o índice atual da grade começa por `store` e usa `emission_date`.
- Revisar se o índice gerencial de `loss_items` deve incluir `type` e/ou se índices parciais por período/razão compensam o custo de escrita.
- Os índices individuais do histórico podem ser redundantes diante do composto; confirmar com estatísticas de uso antes de remover qualquer um.

## Riscos adicionais observados

- As views SQL não declaram `security_invoker = true`. Antes de ampliar seu uso via Data API, é obrigatório validar a versão do Postgres, grants e comportamento de RLS das tabelas-base.
- Os arquivos SQL versionados concedem leitura e escrita amplas ao papel `anon` usando `using (true)`/`with check (true)`. A aplicação hoje exige autenticação na UI, mas isso não equivale a autorização no banco. Essa é uma preocupação de segurança separada da performance e deve ser auditada sem alterar as policies nesta fase.
- A definição versionada de `monthly_closing_entries` diverge entre dois SQLs: um inclui a coluna `basis` e outro não. O frontend também contém caminhos/fallbacks para schemas diferentes. O schema real deve ser levantado antes da Fase 2.
- A função `clearRemoteTable` e o RPC de reset são destrutivos. Permaneceram intocados e não fazem parte do plano de performance.

## Linha de base disponível

Sem executar uma sessão autenticada contra dados reais, só é possível registrar a linha de base derivada do código:

| Fluxo | Requests derivados do código | Registros | Bytes/tempo |
|---|---:|---|---|
| Dashboard inicial | `ceil(N_notas/1000) + ceil(N_itens/1000)`; consultas sequenciais | Todas as notas + todos os itens | A medir |
| Dashboard após evento Realtime | Mesmo custo do Dashboard inicial por rajada após debounce | Todas as notas + todos os itens | A medir |
| Fechamento inicial | `ceil(N_notas_filtradas/1000) + 1` para grade/auditoria, mais `ceil(N_itens_gerenciais/1000)` | Notas do ano/recorte + todos os itens gerenciais do recorte | A medir |
| Abrir célula simples | Em geral 3 consultas de notas/auditoria + 1 de itens da primeira nota | 25 notas + auditorias + itens da nota | A medir |
| Carregar mais notas | Em geral 3 consultas por página no fallback ativo | 25 notas + auditorias | A medir |

`N_notas`, `N_itens` e os volumes precisam ser coletados no Network/Performance do navegador ou em telemetria instrumentada. A próxima medição deve registrar URL/tabela, status, duração, `content-length` quando disponível e quantidade de linhas retornadas, sem registrar payload sensível.

## Plano incremental ordenado por impacto e risco

1. **Medição e contrato (baixo risco):** instrumentar somente métricas de leitura e congelar contratos de totais atuais com casos de teste/fixtures. Confirmar schema, views, índices e RLS reais.
2. **Resumo do Dashboard (alto impacto, risco médio):** criar serviço de leitura consolidada e fazer os cards principais renderizarem sem baixar `loss_items`. Comparar os totais antigo e novo em paralelo antes de remover o caminho antigo.
3. **Filtro no banco (alto impacto, risco médio):** mover período, loja, setor, tipo e motivo para as consultas; parar de usar `loadAllData()` como fonte universal.
4. **Grade mensal consolidada (alto impacto, risco médio):** corrigir/validar a semântica emissão versus competência e ativar uma única view/RPC de grade. Eliminar leitura anual de notas brutas para montar células.
5. **Notas paginadas (médio impacto, baixo risco):** manter 25/30 por página, substituir `select('*')`, executar agrupamento no SQL e evitar `count exact` quando dispensável.
6. **Itens estritamente sob demanda (alto impacto, baixo risco):** não carregar itens da primeira nota automaticamente; unificar os três serviços de itens e seus caches.
7. **Análise gerencial agregada (alto impacto, risco alto):** mover somas, comparativos e top N para view/RPC validada contra os cálculos atuais; manter consulta detalhada separada.
8. **Cache SWR e deduplicação (médio impacto, risco médio):** chave previsível, TTL, Promise compartilhada, retorno imediato de cache e revalidação silenciosa.
9. **Realtime seletivo (alto impacto, risco médio):** usar o payload para invalidar resumo/página afetados; nunca chamar carga integral por evento genérico.
10. **Importação e writes em lote (médio impacto, risco médio/alto):** reduzir verificações por XML e o `Promise.all` de updates individuais, preservando regras e constraints.
11. **Índices (impacto dependente de medição, risco médio):** executar `EXPLAIN`, verificar `pg_stat_user_indexes` e propor SQL separado, sem aplicação automática.
12. **Comparação final:** repetir exatamente os cenários da linha de base e publicar antes/depois com requests, linhas, bytes e tempos medidos.

## Critério para iniciar a Fase 2

Antes de mudar o Dashboard, devem estar disponíveis: (a) uma captura real da linha de base; (b) confirmação do schema/views em produção; (c) exemplos representativos para validar igualdade dos totais; e (d) decisão explícita sobre base temporal — emissão ou competência — em cada indicador. Até lá, este documento encerra somente a Fase 1.

## Medição inicial realizada em 2026-08-25

Uma consulta somente leitura ao Data API de produção confirmou:

- `loss_notes`: 361 registros;
- `loss_items`: 14.872 registros;
- fluxo inicial derivado do código: 16 requests sequenciais de dados (1 página de notas e 15 páginas de itens), retornando 15.233 registros;
- `v_monthly_closing_grid`: não disponível no schema exposto (HTTP 404);
- `v_dashboard_summary`: ainda não existe (HTTP 404).

O ambiente não autorizou transferir todas as colunas de todos os registros apenas para medir bytes, por risco de exposição desnecessária. Assim, volume e tempo totais permanecem “a medir” no navegador autenticado. Essa limitação não afeta as contagens reais acima.
