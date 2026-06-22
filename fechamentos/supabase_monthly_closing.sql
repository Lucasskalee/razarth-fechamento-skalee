create extension if not exists pgcrypto;

create table if not exists public.monthly_closing_entries (
  id uuid primary key default gen_random_uuid(),
  store text not null,
  basis text not null check (basis in ('competence', 'emission')),
  year integer not null check (year between 2020 and 2100),
  month_number integer not null check (month_number between 1 and 12),
  month_label text not null,
  type text not null,
  sector text not null,
  status text not null default 'pendente' check (status in ('sem_nota', 'pendente', 'confere', 'divergente')),
  observation text not null default '',
  expected_total_value numeric(14,2),
  expected_note_count integer,
  system_total_value numeric(14,2) not null default 0,
  system_note_count integer not null default 0,
  checked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (store, basis, year, month_number, type, sector)
);

create table if not exists public.monthly_closing_notes (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.monthly_closing_entries(id) on delete cascade,
  note_key text not null references public.loss_notes(note_key) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente', 'confere', 'divergente')),
  observation text not null default '',
  checked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (entry_id, note_key)
);

create table if not exists public.monthly_closing_observations (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.monthly_closing_entries(id) on delete cascade,
  note_key text references public.loss_notes(note_key) on delete set null,
  scope text not null default 'entry' check (scope in ('entry', 'note')),
  message text not null,
  created_by text,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_monthly_closing_entries_updated_at on public.monthly_closing_entries;
create trigger trg_monthly_closing_entries_updated_at
before update on public.monthly_closing_entries
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_monthly_closing_notes_updated_at on public.monthly_closing_notes;
create trigger trg_monthly_closing_notes_updated_at
before update on public.monthly_closing_notes
for each row execute procedure public.set_updated_at();

create index if not exists idx_monthly_closing_entries_lookup
  on public.monthly_closing_entries(store, basis, year, month_number, sector, type, status);

create index if not exists idx_monthly_closing_notes_entry
  on public.monthly_closing_notes(entry_id, status);

create index if not exists idx_monthly_closing_notes_note_key
  on public.monthly_closing_notes(note_key);

create index if not exists idx_loss_notes_monthly_emission
  on public.loss_notes(store, type, sector, emission_date);

create index if not exists idx_loss_items_monthly_note
  on public.loss_items(note_key, item_index);

create or replace view public.v_monthly_closing_grid as
with monthly_source as (
  select
    'competence'::text as basis,
    ln.store,
    ln.type,
    ln.sector,
    extract(year from (ln.emission_date - interval '1 month'))::integer as year,
    extract(month from (ln.emission_date - interval '1 month'))::integer as month_number,
    to_char((ln.emission_date - interval '1 month'), 'TMMonth') as month_label,
    ln.note_key,
    ln.total_value
  from public.loss_notes ln
  where ln.emission_date is not null

  union all

  select
    'emission'::text as basis,
    ln.store,
    ln.type,
    ln.sector,
    extract(year from ln.emission_date)::integer as year,
    extract(month from ln.emission_date)::integer as month_number,
    to_char(ln.emission_date, 'TMMonth') as month_label,
    ln.note_key,
    ln.total_value
  from public.loss_notes ln
  where ln.emission_date is not null
)
select
  e.id as entry_id,
  src.store,
  src.basis,
  src.year,
  src.month_number,
  src.month_label,
  src.type,
  src.sector,
  count(distinct src.note_key)::integer as note_count,
  coalesce(sum(src.total_value), 0)::numeric(14,2) as total_value,
  coalesce(e.status, case when count(distinct src.note_key) = 0 then 'sem_nota' else 'pendente' end) as status,
  coalesce(e.observation, '') as observation,
  e.expected_total_value,
  e.expected_note_count,
  e.checked_at
from monthly_source src
left join public.monthly_closing_entries e
  on e.store = src.store
 and e.basis = src.basis
 and e.year = src.year
 and e.month_number = src.month_number
 and e.type = src.type
 and e.sector = src.sector
group by
  e.id,
  src.store,
  src.basis,
  src.year,
  src.month_number,
  src.month_label,
  src.type,
  src.sector,
  e.status,
  e.observation,
  e.expected_total_value,
  e.expected_note_count,
  e.checked_at;

create or replace view public.v_monthly_closing_notes as
with note_source as (
  select
    'competence'::text as basis,
    ln.note_key,
    ln.invoice,
    ln.store,
    ln.type,
    ln.sector,
    extract(year from (ln.emission_date - interval '1 month'))::integer as year,
    extract(month from (ln.emission_date - interval '1 month'))::integer as month_number,
    ln.emission_date,
    ln.total_value,
    ln.item_count
  from public.loss_notes ln
  where ln.emission_date is not null

  union all

  select
    'emission'::text as basis,
    ln.note_key,
    ln.invoice,
    ln.store,
    ln.type,
    ln.sector,
    extract(year from ln.emission_date)::integer as year,
    extract(month from ln.emission_date)::integer as month_number,
    ln.emission_date,
    ln.total_value,
    ln.item_count
  from public.loss_notes ln
  where ln.emission_date is not null
)
select
  e.id as entry_id,
  src.note_key,
  src.invoice,
  src.store,
  src.type,
  src.sector,
  src.basis,
  src.year,
  src.month_number,
  src.emission_date,
  src.total_value,
  src.item_count,
  coalesce(n.status, 'pendente') as note_status,
  coalesce(n.observation, '') as note_observation,
  coalesce(e.status, 'pendente') as entry_status,
  coalesce(e.observation, '') as entry_observation
from note_source src
left join public.monthly_closing_entries e
  on e.store = src.store
 and e.basis = src.basis
 and e.year = src.year
 and e.month_number = src.month_number
 and e.type = src.type
 and e.sector = src.sector
left join public.monthly_closing_notes n
  on n.entry_id = e.id
 and n.note_key = src.note_key;

alter table public.monthly_closing_entries enable row level security;
alter table public.monthly_closing_notes enable row level security;
alter table public.monthly_closing_observations enable row level security;

drop policy if exists "anon_can_read_monthly_closing_entries" on public.monthly_closing_entries;
create policy "anon_can_read_monthly_closing_entries" on public.monthly_closing_entries for select to anon using (true);

drop policy if exists "anon_can_insert_monthly_closing_entries" on public.monthly_closing_entries;
create policy "anon_can_insert_monthly_closing_entries" on public.monthly_closing_entries for insert to anon with check (true);

drop policy if exists "anon_can_update_monthly_closing_entries" on public.monthly_closing_entries;
create policy "anon_can_update_monthly_closing_entries" on public.monthly_closing_entries for update to anon using (true) with check (true);

drop policy if exists "anon_can_read_monthly_closing_notes" on public.monthly_closing_notes;
create policy "anon_can_read_monthly_closing_notes" on public.monthly_closing_notes for select to anon using (true);

drop policy if exists "anon_can_insert_monthly_closing_notes" on public.monthly_closing_notes;
create policy "anon_can_insert_monthly_closing_notes" on public.monthly_closing_notes for insert to anon with check (true);

drop policy if exists "anon_can_update_monthly_closing_notes" on public.monthly_closing_notes;
create policy "anon_can_update_monthly_closing_notes" on public.monthly_closing_notes for update to anon using (true) with check (true);

drop policy if exists "anon_can_read_monthly_closing_observations" on public.monthly_closing_observations;
create policy "anon_can_read_monthly_closing_observations" on public.monthly_closing_observations for select to anon using (true);

drop policy if exists "anon_can_insert_monthly_closing_observations" on public.monthly_closing_observations;
create policy "anon_can_insert_monthly_closing_observations" on public.monthly_closing_observations for insert to anon with check (true);
