create table if not exists public.loss_notes (
  note_key text primary key,
  access_key text unique,
  source_file text,
  invoice text not null,
  store text not null,
  emission_date timestamptz,
  emission_month text not null,
  competence_month text not null,
  operation text not null,
  type text not null,
  display_type text not null,
  sector text not null,
  sector_manual boolean not null default false,
  total_value numeric(14,2) not null default 0,
  item_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.loss_items (
  id text primary key,
  note_key text not null references public.loss_notes(note_key) on delete cascade,
  item_index integer not null,
  access_key text,
  source_file text,
  invoice text not null,
  store text not null,
  emission_date timestamptz,
  emission_month text not null,
  competence_month text not null,
  operation text not null,
  type text not null,
  display_type text not null,
  sector text not null,
  sector_manual boolean not null default false,
  product text not null,
  quantity numeric(14,3) not null default 0,
  unit_value numeric(14,4) not null default 0,
  value numeric(14,2) not null default 0,
  reason text not null default '',
  selected boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists idx_loss_notes_access_key on public.loss_notes(access_key) where access_key is not null;
create index if not exists idx_loss_notes_store on public.loss_notes(store);
create index if not exists idx_loss_notes_month on public.loss_notes(competence_month, emission_month);
create index if not exists idx_loss_items_note_key on public.loss_items(note_key);
create index if not exists idx_loss_items_access_key on public.loss_items(access_key);
create unique index if not exists idx_loss_items_note_item on public.loss_items(note_key, item_index);
create index if not exists idx_loss_items_filters on public.loss_items(store, type, sector, reason);
create index if not exists idx_loss_items_reason_analysis on public.loss_items(competence_month, store, sector, reason, product);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_loss_notes_updated_at on public.loss_notes;
create trigger trg_loss_notes_updated_at
before update on public.loss_notes
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_loss_items_updated_at on public.loss_items;
create trigger trg_loss_items_updated_at
before update on public.loss_items
for each row execute procedure public.set_updated_at();

alter table public.loss_notes enable row level security;
alter table public.loss_items enable row level security;

drop policy if exists "anon_can_read_loss_notes" on public.loss_notes;
create policy "anon_can_read_loss_notes" on public.loss_notes for select to anon using (true);

drop policy if exists "anon_can_insert_loss_notes" on public.loss_notes;
create policy "anon_can_insert_loss_notes" on public.loss_notes for insert to anon with check (true);

drop policy if exists "anon_can_update_loss_notes" on public.loss_notes;
create policy "anon_can_update_loss_notes" on public.loss_notes for update to anon using (true) with check (true);

drop policy if exists "anon_can_delete_loss_notes" on public.loss_notes;
create policy "anon_can_delete_loss_notes" on public.loss_notes for delete to anon using (true);

drop policy if exists "anon_can_read_loss_items" on public.loss_items;
create policy "anon_can_read_loss_items" on public.loss_items for select to anon using (true);

drop policy if exists "anon_can_insert_loss_items" on public.loss_items;
create policy "anon_can_insert_loss_items" on public.loss_items for insert to anon with check (true);

drop policy if exists "anon_can_update_loss_items" on public.loss_items;
create policy "anon_can_update_loss_items" on public.loss_items for update to anon using (true) with check (true);

drop policy if exists "anon_can_delete_loss_items" on public.loss_items;
create policy "anon_can_delete_loss_items" on public.loss_items for delete to anon using (true);
