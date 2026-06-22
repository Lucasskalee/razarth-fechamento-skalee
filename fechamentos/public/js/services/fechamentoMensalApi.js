import { getSupabaseClient } from "../config/supabase.js";

export const MONTHLY_CLOSING_VIEW = "v_monthly_closing_grid";
export const MONTHLY_CLOSING_NOTES_VIEW = "v_monthly_closing_notes";
export const MONTHLY_CLOSING_TABLE = "monthly_closing_entries";
export const MONTHLY_CLOSING_NOTES_TABLE = "monthly_closing_notes";
export const MONTHLY_CLOSING_OBSERVATIONS_TABLE = "monthly_closing_observations";

export const CLOSING_MONTHS = [
  { number: 1, shortLabel: "Jan", longLabel: "Janeiro" },
  { number: 2, shortLabel: "Fev", longLabel: "Fevereiro" },
  { number: 3, shortLabel: "Mar", longLabel: "Marco" },
  { number: 4, shortLabel: "Abr", longLabel: "Abril" },
  { number: 5, shortLabel: "Mai", longLabel: "Maio" },
  { number: 6, shortLabel: "Jun", longLabel: "Junho" },
  { number: 7, shortLabel: "Jul", longLabel: "Julho" },
  { number: 8, shortLabel: "Ago", longLabel: "Agosto" },
  { number: 9, shortLabel: "Set", longLabel: "Setembro" },
  { number: 10, shortLabel: "Out", longLabel: "Outubro" },
  { number: 11, shortLabel: "Nov", longLabel: "Novembro" },
  { number: 12, shortLabel: "Dez", longLabel: "Dezembro" }
];

export const CLOSING_STATUS_OPTIONS = [
  { value: "confere", label: "Confere" },
  { value: "pendente", label: "Pendente" },
  { value: "divergente", label: "Divergente" },
  { value: "sem_nota", label: "Sem nota" }
];

const notesCache = new Map();
const itemsCache = new Map();

function selectRange(query, limit, offset = 0) {
  if (!Number.isFinite(limit) || limit <= 0) return query;
  return query.range(offset, offset + limit - 1);
}

export function buildCellCacheKey(cell, filters) {
  return [
    filters.basis || "competence",
    cell.store || "TODAS",
    cell.year || "",
    cell.month || cell.monthNumber || "",
    cell.type || filters.type || "TODOS",
    cell.sector || ""
  ].join("|");
}

export function clearMonthlyClosingCache() {
  notesCache.clear();
  itemsCache.clear();
}

export function invalidateMonthlyClosingCellCache(cell, filters) {
  const prefix = buildCellCacheKey(cell, filters);
  [...notesCache.keys()].forEach((key) => {
    if (key.startsWith(prefix)) notesCache.delete(key);
  });
}

function buildPageKey(baseKey, page, limit) {
  return `${baseKey}::${page}::${limit}`;
}

export async function fetchMonthlyClosingGrid(filters) {
  const client = getSupabaseClient();
  let query = client
    .from(MONTHLY_CLOSING_VIEW)
    .select("*")
    .eq("basis", filters.basis)
    .eq("year", filters.year);

  if (filters.store && filters.store !== "TODAS") query = query.eq("store", filters.store);
  if (filters.type && filters.type !== "TODOS") query = query.eq("type", filters.type);
  if (filters.status && filters.status !== "TODOS") query = query.eq("status", filters.status);

  const { data, error } = await query
    .order("sector", { ascending: true })
    .order("month_number", { ascending: true })
    .order("type", { ascending: true });

  if (error) {
    error.userMessage = "Nao foi possivel carregar a grade do fechamento mensal.";
    throw error;
  }

  return data || [];
}

export async function fetchMonthlyClosingNotes(cell, filters, { page = 0, limit = 30 } = {}) {
  const baseKey = buildCellCacheKey(cell, filters);
  const pageKey = buildPageKey(baseKey, page, limit);
  if (notesCache.has(pageKey)) return notesCache.get(pageKey);

  const client = getSupabaseClient();
  let query = client
    .from(MONTHLY_CLOSING_NOTES_VIEW)
    .select("*", { count: "exact" })
    .eq("basis", filters.basis)
    .eq("year", cell.year)
    .eq("month_number", cell.month)
    .eq("sector", cell.sector);

  if (cell.store && cell.store !== "TODAS") query = query.eq("store", cell.store);

  if (cell.type && cell.type !== "TODOS") query = query.eq("type", cell.type);
  else if (filters.type && filters.type !== "TODOS") query = query.eq("type", filters.type);

  query = selectRange(query.order("emission_date", { ascending: true }).order("invoice", { ascending: true }), limit, page * limit);

  const { data, error, count } = await query;
  if (error) {
    error.userMessage = "Nao foi possivel carregar as notas desta celula.";
    throw error;
  }

  const notes = (data || []).map((row) => ({
    entryId: row.entry_id || null,
    noteKey: row.note_key,
    invoice: row.invoice || "-",
    store: row.store || "Loja nao identificada",
    sector: row.sector || "Nao classificado",
    type: row.type || "Outros",
    totalValue: Number(row.total_value || 0),
    itemCount: Number(row.item_count || 0),
    date: row.emission_date || "",
    status: row.note_status || "pendente",
    observation: row.note_observation || ""
  }));

  const result = {
    notes,
    totalCount: Number(count || 0),
    hasMore: Number(count || 0) > (page + 1) * limit,
    entryId: data?.[0]?.entry_id || cell.entryId || null,
    entryStatus: data?.[0]?.entry_status || cell.status || "pendente",
    entryObservation: data?.[0]?.entry_observation || cell.observation || ""
  };

  notesCache.set(pageKey, result);
  return result;
}

export async function fetchMonthlyClosingNoteItems(noteKey) {
  if (itemsCache.has(noteKey)) return itemsCache.get(noteKey);

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("loss_items")
    .select("id, note_key, item_index, product, quantity, unit_value, value, reason, sector")
    .eq("note_key", noteKey)
    .order("item_index", { ascending: true });

  if (error) {
    error.userMessage = "Nao foi possivel carregar os produtos desta nota.";
    throw error;
  }

  const items = (data || []).map((row) => ({
    id: row.id,
    noteKey: row.note_key,
    itemIndex: Number(row.item_index || 0),
    product: row.product || "Produto",
    quantity: Number(row.quantity || 0),
    unitValue: Number(row.unit_value || 0),
    value: Number(row.value || 0),
    reason: row.reason || "",
    sector: row.sector || "Nao classificado"
  }));

  itemsCache.set(noteKey, items);
  return items;
}

export async function saveMonthlyClosingEntryAudit({
  cell,
  status,
  observation = "",
  expectedTotalValue = null,
  expectedNoteCount = null,
  systemTotalValue = null,
  systemNoteCount = null
}) {
  const client = getSupabaseClient();
  const payload = {
    store: cell.store,
    basis: cell.basis,
    year: cell.year,
    month_number: cell.month,
    month_label: cell.monthLabel,
    type: cell.type,
    sector: cell.sector,
    status,
    observation,
    expected_total_value: expectedTotalValue,
    expected_note_count: expectedNoteCount,
    system_total_value: systemTotalValue ?? cell.totalValue ?? 0,
    system_note_count: systemNoteCount ?? cell.noteCount ?? 0,
    checked_at: new Date().toISOString()
  };

  const { data, error } = await client
    .from(MONTHLY_CLOSING_TABLE)
    .upsert(payload, {
      onConflict: "store,basis,year,month_number,type,sector"
    })
    .select("id, status, observation")
    .single();

  if (error) {
    error.userMessage = "Nao foi possivel salvar a auditoria da celula.";
    throw error;
  }

  if (observation) {
    await client.from(MONTHLY_CLOSING_OBSERVATIONS_TABLE).insert({
      entry_id: data.id,
      scope: "entry",
      message: observation
    });
  }

  return {
    entryId: data.id,
    status: data.status || status,
    observation: data.observation || observation
  };
}

export async function saveMonthlyClosingNoteAudit({
  cell,
  noteKey,
  status,
  observation = ""
}) {
  const entry = await saveMonthlyClosingEntryAudit({
    cell,
    status: cell.status,
    observation: cell.observation || "",
    systemTotalValue: cell.totalValue,
    systemNoteCount: cell.noteCount
  });

  const client = getSupabaseClient();
  const payload = {
    entry_id: entry.entryId,
    note_key: noteKey,
    status,
    observation,
    checked_at: new Date().toISOString()
  };

  const { data, error } = await client
    .from(MONTHLY_CLOSING_NOTES_TABLE)
    .upsert(payload, {
      onConflict: "entry_id,note_key"
    })
    .select("id, entry_id, status, observation")
    .single();

  if (error) {
    error.userMessage = "Nao foi possivel salvar a auditoria da nota.";
    throw error;
  }

  if (observation) {
    await client.from(MONTHLY_CLOSING_OBSERVATIONS_TABLE).insert({
      entry_id: entry.entryId,
      note_key: noteKey,
      scope: "note",
      message: observation
    });
  }

  return {
    entryId: data.entry_id,
    status: data.status || status,
    observation: data.observation || observation
  };
}
