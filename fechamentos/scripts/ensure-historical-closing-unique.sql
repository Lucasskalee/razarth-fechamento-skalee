create unique index if not exists historical_closing_entries_unique_import
on public.historical_closing_entries (
  year,
  month_number,
  store_name,
  entry_type,
  sector
);
