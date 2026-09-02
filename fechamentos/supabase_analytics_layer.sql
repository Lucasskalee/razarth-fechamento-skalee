-- Agregados mensais para consultas históricas sem transferir loss_items bruto.
-- Aplicar após supabase_schema.sql e revisar as policies conforme o tenant model.
create or replace view public.v_loss_dashboard_summary as
with item_metrics as (
  select
    note_key,
    coalesce(sum(quantity), 0)::numeric as total_quantity,
    count(*)::integer as actual_items,
    count(*) filter (where nullif(reason, '') is not null)::integer as classified_items
  from public.loss_items
  group by note_key
)
select
  coalesce(nullif(n.store, ''), 'Nao identificada') as store,
  extract(year from coalesce(n.emission_date, n.created_at))::integer as year,
  extract(month from coalesce(n.emission_date, n.created_at))::integer as month_number,
  coalesce(nullif(n.type, ''), 'Outros') as type,
  coalesce(nullif(n.sector, ''), 'Nao classificado') as sector,
  sum(n.total_value)::numeric as total_value,
  sum(coalesce(m.total_quantity, 0))::numeric as total_quantity,
  sum(coalesce(m.actual_items, n.item_count))::integer as total_items,
  count(*)::integer as total_notes,
  sum(coalesce(m.classified_items, 0))::integer as classified_items,
  sum(greatest(coalesce(m.actual_items, n.item_count) - coalesce(m.classified_items, 0), 0))::integer as unclassified_items
from public.loss_notes n
left join item_metrics m on m.note_key = n.note_key
group by
  coalesce(nullif(n.store, ''), 'Nao identificada'),
  extract(year from coalesce(n.emission_date, n.created_at)),
  extract(month from coalesce(n.emission_date, n.created_at)),
  coalesce(nullif(n.type, ''), 'Outros'),
  coalesce(nullif(n.sector, ''), 'Nao classificado');

-- Índice concreto para a view e consultas de detalhe por nota.
create index if not exists idx_loss_notes_dashboard_period
  on public.loss_notes (emission_date, store, type, sector);
create table if not exists public.loss_monthly_summary (
  store text not null,
  year integer not null,
  month_number integer not null check (month_number between 1 and 12),
  type text not null,
  total_value numeric(14,2) not null default 0,
  total_quantity numeric(14,3) not null default 0,
  total_notes integer not null default 0,
  total_items integer not null default 0,
  classified_items integer not null default 0,
  unclassified_items integer not null default 0,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (store, year, month_number, type)
);

create index if not exists idx_loss_monthly_summary_period
  on public.loss_monthly_summary (year, month_number, store, type);

alter table public.loss_monthly_summary enable row level security;

-- A manutenção deste agregado deve ocorrer por job/RPC autenticado; não há
-- permissões de leitura ou escrita abertas no frontend. A policy de leitura
-- deve ser criada junto com o modelo de workspace/loja vigente no ambiente.
