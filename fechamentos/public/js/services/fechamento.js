import { competenceKey, monthKey } from "./classificacao.js?v=20260428-2";
import { getSupabaseClient } from "../config/supabase.js";

export const VIEW_MONTHLY_GRID = "v_monthly_closing_grid";
export const VIEW_MONTHLY_NOTES = "v_monthly_closing_notes";
export const VIEW_HISTORICAL_GRID = "v_historical_closing_grid";
export const TABLE_MONTHLY_ENTRY = "monthly_closing_entries";
export const TABLE_MONTHLY_NOTE = "monthly_closing_notes";
export const TABLE_MONTHLY_OBSERVATION = "monthly_closing_observations";
export const TABLE_HISTORICAL_ENTRY = "historical_closing_entries";

export const MONTHS = [
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

export const STATUS_META = {
  confere: { label: "Confere", tone: "success" },
  pendente: { label: "Pendente", tone: "warning" },
  divergente: { label: "Divergente", tone: "danger" },
  sem_nota: { label: "Sem nota", tone: "neutral" },
  historico: { label: "Historico", tone: "info" }
};

function textKey(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

export function classifyClosingType(value = "") {
  const key = textKey(value);
  if (/\b(PERDA|PERDAS|SAIDA|SAIDAS|TROCA|TRANSFERENCIA)\b/.test(key) || key.includes("SAIDA DE UM PARA OUTRO")) return "perdasSaidas";
  if (/\b(CONSUMO|USO)\b/.test(key) || key.includes("MATERIAL USO") || key.includes("MATERIAL DE USO")) return "consumo";
  return "perdasSaidas";
}

export function normalizeClosingSector(value = "", typeGroup = "") {
  const key = textKey(value);
  if (!key) return "Nao classificado";
  if (key.includes("SAIDA DE UM PARA OUTRO")) return "Sa\u00edda de um para outro";
  if (key.includes("FRIOS")) return "Frios e Congelados";
  if (key.includes("LOJA") && key.includes("DEPOSITO")) return typeGroup === "consumo" || key.includes("CONSUMO") ? "Loja / Dep\u00f3sito" : "Loja e Dep\u00f3sito";
  if (key.includes("PRODUCAO") && key.includes("PADARIA")) return "Produ\u00e7\u00e3o Padaria";
  if (key === "PRODUCAO" || key.includes("CONSUMO SETOR PRODUCAO")) return "Produ\u00e7\u00e3o";
  if (key.includes("FRENTE") && key.includes("CAIXA")) return "Frente de Caixa";
  if (key.includes("ADMINISTRATIVO")) return "Administrativo";
  if (key.includes("FATIACAO")) return "Fatia\u00e7\u00e3o";
  if (key.includes("ACOUGUE")) return "A\u00e7ougue";
  if (key.includes("PADARIA")) return "Padaria";
  if (key.includes("FLV")) return "FLV";
  if (key.includes("PAGAS")) return "Pagas";
  if (key.includes("FURTOS")) return "Furtos";
  if (key.includes("BEBIDAS")) return "Bebidas";
  return value || "Nao classificado";
}

export const notesCache = new Map();
export const itemsCache = new Map();
const SUPABASE_PAGE_SIZE = 1000;
const LOCAL_AUDIT_PREFIX = "fechamento_auditoria_local_v1";

function pageKey(baseKey, page, limit) {
  return `${baseKey}::${page}::${limit}`;
}

export function buildCellKey(cell, filters) {
  return [
    filters.store || cell.store || "TODAS",
    filters.year || cell.year || "",
    filters.type || cell.type || "TODOS",
    cell.typeGroup || "",
    cell.sector || "",
    cell.month || cell.monthNumber || ""
  ].join("|");
}

export function clearFechamentoCache() {
  notesCache.clear();
  itemsCache.clear();
}

export function invalidateCellCache(cell, filters) {
  const prefix = buildCellKey(cell, filters);
  [...notesCache.keys()].forEach((key) => {
    if (key.startsWith(prefix)) notesCache.delete(key);
  });
}

function applyGridFilters(query, filters) {
  let nextQuery = query.eq("year", filters.year);
  if (filters.store && filters.store !== "TODAS") nextQuery = nextQuery.eq("store", filters.store);
  if (filters.type && filters.type !== "TODOS") nextQuery = nextQuery.eq("type", filters.type);
  if (filters.status && filters.status !== "TODOS") nextQuery = nextQuery.eq("status", filters.status);
  return nextQuery;
}

function isMissingBackendObject(error) {
  return error?.code === "PGRST205" || /schema cache|Could not find the table/i.test(error?.message || "");
}

function isMissingColumn(error, column) {
  return error?.code === "42703" || new RegExp(`\\b${column}\\b.*(does not exist|not found)|Could not find.*\\b${column}\\b`, "i").test(error?.message || "");
}

function localEntryKey(cell) {
  return [
    LOCAL_AUDIT_PREFIX,
    "entry",
    cell.store || "TODAS",
    cell.year || "",
    cell.month || cell.month_number || "",
    cell.type || "TODOS",
    cell.sector || ""
  ].join("|");
}

function localNoteKey(cell, noteKey) {
  return [
    LOCAL_AUDIT_PREFIX,
    "note",
    cell.store || "TODAS",
    cell.year || "",
    cell.month || cell.month_number || "",
    cell.type || "TODOS",
    cell.sector || "",
    noteKey || ""
  ].join("|");
}

function entryAuditKey(row) {
  return [
    row.store || "Loja nao identificada",
    Number(row.year || 0),
    Number(row.month_number || row.month || 0),
    row.type || "Outros",
    row.sector || "Nao classificado"
  ].join("|");
}

function readLocalAudit(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function writeLocalAudit(key, payload) {
  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Local audit is best-effort only when the monthly backend schema is absent.
  }
}

function monthLabelFromNumber(monthNumber) {
  return MONTHS.find((month) => month.number === Number(monthNumber))?.longLabel || "Mes";
}

function competenceMonthValue(year, monthNumber) {
  const labels = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${labels[Number(monthNumber) - 1] || "jan"}/${year}`;
}

function periodFromCompetenceMonth(value, fallbackYear) {
  const labels = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const [label, year] = String(value || "").toLowerCase().split("/");
  const month = labels.indexOf(label) + 1;
  if (!month || !year) return null;
  return {
    year: Number(year || fallbackYear),
    month
  };
}

function noteCompetencePeriod(row) {
  const explicitPeriod = periodFromCompetenceMonth(row.competence_month, null);
  if (explicitPeriod) return explicitPeriod;
  const date = new Date(row.emission_date || "");
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCMonth(date.getUTCMonth() - 1);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1
  };
}

function competenceEmissionRange(year, month) {
  const start = new Date(Date.UTC(Number(year), Number(month), 1));
  const end = new Date(Date.UTC(Number(year), Number(month) + 1, 1));
  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

function applyLossNotesFilters(query, filters) {
  const year = Number(filters.year || new Date().getFullYear());
  let nextQuery = query.like("competence_month", `%/${year}`);

  if (filters.store && filters.store !== "TODAS") nextQuery = nextQuery.eq("store", filters.store);
  if (filters.type && filters.type !== "TODOS") nextQuery = nextQuery.eq("type", filters.type);
  return nextQuery;
}

function historicalTypeLabel(entryType = "") {
  return entryType === "uso_consumo" ? "Uso/Consumo" : "Perdas";
}

function historicalMonthLabel(monthNumber) {
  return MONTHS.find((month) => month.number === Number(monthNumber))?.longLabel || "Mes";
}

async function fetchAllLossNotes(client, filters) {
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + SUPABASE_PAGE_SIZE - 1;
    const { data, error } = await applyLossNotesFilters(
      client
        .from("loss_notes")
        .select("note_key, invoice, store, emission_date, emission_month, competence_month, type, sector, total_value, item_count"),
      filters
    )
      .order("sector", { ascending: true })
      .order("emission_date", { ascending: true })
      .range(from, to);

    if (error) {
      error.userMessage = "Nao foi possivel carregar as notas base do fechamento mensal.";
      throw error;
    }

    const pageRows = data || [];
    rows.push(...pageRows);
    if (pageRows.length < SUPABASE_PAGE_SIZE) break;
    from += SUPABASE_PAGE_SIZE;
  }

  return rows;
}

async function fetchGridFromLossNotes(filters) {
  const client = getSupabaseClient();
  const notes = await fetchAllLossNotes(client, filters);
  let entryByKey = new Map();

  try {
    let entryQuery = client
      .from(TABLE_MONTHLY_ENTRY)
      .select("id, store, year, month_number, type, sector, status, observation")
      .eq("year", Number(filters.year));

    if (filters.store && filters.store !== "TODAS") entryQuery = entryQuery.eq("store", filters.store);
    if (filters.type && filters.type !== "TODOS") entryQuery = entryQuery.eq("type", filters.type);

    const { data: entries, error } = await entryQuery;
    if (error && !isMissingBackendObject(error)) throw error;
    (entries || []).forEach((entry) => entryByKey.set(entryAuditKey(entry), entry));
  } catch {
    entryByKey = new Map();
  }

  return notes.map((note) => {
    const period = noteCompetencePeriod(note) || { year: Number(filters.year), month: 1 };
    const cell = {
      store: note.store || "Loja nao identificada",
      year: period.year,
      month: period.month,
      type: note.type || "Outros",
      sector: note.sector || "Nao classificado"
    };
    const audit = readLocalAudit(localEntryKey(cell));
    const savedEntry = entryByKey.get(entryAuditKey({
      store: cell.store,
      year: period.year,
      month_number: period.month,
      type: cell.type,
      sector: cell.sector
    }));

    return {
      entry_id: savedEntry?.id || audit?.entryId || null,
      store: cell.store,
      year: period.year,
      month_number: period.month,
      month_label: monthLabelFromNumber(period.month),
      type: cell.type,
      sector: cell.sector,
      note_count: 1,
      total_value: Number(note.total_value || 0),
      status: savedEntry?.status || audit?.status || "pendente",
      observation: savedEntry?.observation || audit?.observation || ""
    };
  }).filter((row) => !filters.status || filters.status === "TODOS" || row.status === filters.status);
}

async function fetchGridFromHistoricalEntries(filters) {
  const client = getSupabaseClient();
  let query = client
    .from(VIEW_HISTORICAL_GRID)
    .select("*")
    .eq("year", Number(filters.year));

  if (filters.store && filters.store !== "TODAS") query = query.eq("store_name", filters.store);
  if (filters.type && filters.type !== "TODOS") {
    const typeGroup = classifyClosingType(filters.type);
    query = query.eq("entry_type", typeGroup === "consumo" ? "uso_consumo" : "perdas_saidas");
  }

  const { data, error } = await query
    .order("store_name", { ascending: true })
    .order("entry_type", { ascending: true })
    .order("sector", { ascending: true })
    .order("month_number", { ascending: true });

  if (error) {
    if (isMissingBackendObject(error)) return [];
    error.userMessage = "Nao foi possivel carregar o historico consolidado.";
    throw error;
  }

  return (data || []).map((row) => ({
    entry_id: row.id || null,
    store: row.store_name || "Loja nao identificada",
    year: Number(row.year),
    month_number: Number(row.month_number),
    month_label: historicalMonthLabel(row.month_number),
    type: historicalTypeLabel(row.entry_type),
    entry_type: row.entry_type,
    sector: row.sector || "Nao classificado",
    note_count: 0,
    total_value: Number(row.total_amount || 0),
    status: "historico",
    observation: row.notes || "",
    source: row.source || "planilha_historica",
    detail_level: row.detail_level || "consolidado_mensal",
    is_historical: true
  }));
}

async function fetchAllGridRows(builder) {
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + SUPABASE_PAGE_SIZE - 1;
    const { data, error } = await builder(from, to);
    if (error) {
      error.userMessage = "Nao foi possivel carregar a grade do fechamento mensal.";
      throw error;
    }
    const pageRows = data || [];
    rows.push(...pageRows);
    if (pageRows.length < SUPABASE_PAGE_SIZE) break;
    from += SUPABASE_PAGE_SIZE;
  }

  return rows;
}

async function fetchMonthlyAuditRows(client, rows, year, month) {
  if (!rows.length) return { entryByKey: new Map(), noteByEntryAndKey: new Map() };

  const stores = [...new Set(rows.map((row) => row.store).filter(Boolean))];
  const types = [...new Set(rows.map((row) => row.type).filter(Boolean))];
  const sectors = [...new Set(rows.map((row) => row.sector).filter(Boolean))];

  let entryQuery = client
    .from(TABLE_MONTHLY_ENTRY)
    .select("id, store, year, month_number, type, sector, status, observation")
    .eq("year", year)
    .eq("month_number", month);

  if (stores.length) entryQuery = entryQuery.in("store", stores);
  if (types.length) entryQuery = entryQuery.in("type", types);
  if (sectors.length) entryQuery = entryQuery.in("sector", sectors);

  const { data: entries, error: entryError } = await entryQuery;
  if (entryError) {
    if (isMissingBackendObject(entryError)) return { entryByKey: new Map(), noteByEntryAndKey: new Map() };
    entryError.userMessage = "Nao foi possivel carregar a auditoria salva das notas.";
    throw entryError;
  }

  const entryByKey = new Map();
  (entries || []).forEach((entry) => entryByKey.set(entryAuditKey(entry), entry));

  const entryIds = (entries || []).map((entry) => entry.id).filter(Boolean);
  const noteKeys = [...new Set(rows.map((row) => row.note_key).filter(Boolean))];
  if (!entryIds.length || !noteKeys.length) return { entryByKey, noteByEntryAndKey: new Map() };

  const { data: notes, error: noteError } = await client
    .from(TABLE_MONTHLY_NOTE)
    .select("entry_id, note_key, status, observation, classification")
    .in("entry_id", entryIds)
    .in("note_key", noteKeys);

  if (noteError) {
    if (isMissingColumn(noteError, "classification")) {
      const { data: notesWithoutClassification, error: fallbackError } = await client
        .from(TABLE_MONTHLY_NOTE)
        .select("entry_id, note_key, status, observation")
        .in("entry_id", entryIds)
        .in("note_key", noteKeys);

      if (fallbackError) {
        fallbackError.userMessage = "Nao foi possivel carregar a auditoria salva das notas.";
        throw fallbackError;
      }

      const noteByEntryAndKey = new Map();
      (notesWithoutClassification || []).forEach((note) => noteByEntryAndKey.set(`${note.entry_id}::${note.note_key}`, note));
      return { entryByKey, noteByEntryAndKey };
    }

    noteError.userMessage = "Nao foi possivel carregar a auditoria salva das notas.";
    throw noteError;
  }

  const noteByEntryAndKey = new Map();
  (notes || []).forEach((note) => noteByEntryAndKey.set(`${note.entry_id}::${note.note_key}`, note));
  return { entryByKey, noteByEntryAndKey };
}

export async function fetchGrid(filters) {
  const detailedRows = await fetchGridFromLossNotes(filters);
  if (detailedRows.length) return detailedRows;
  return fetchGridFromHistoricalEntries(filters);
}

/**
 * Estrutura retornada pela view v_monthly_closing_grid:
 * {
 *   entry_id: string | null,
 *   store: string,
 *   year: number,
 *   month_number: number,
 *   month_label: string,
 *   type: string,
 *   sector: string,
 *   note_count: number,
 *   total_value: number,
 *   status: 'confere' | 'pendente' | 'divergente' | 'sem_nota',
 *   observation: string
 * }
 */
export async function fetchCellNotes(cell, filters, { page = 0, limit = 30 } = {}) {
  const baseKey = buildCellKey(cell, filters);
  const cacheKey = pageKey(baseKey, page, limit);
  if (notesCache.has(cacheKey)) return notesCache.get(cacheKey);

  const client = getSupabaseClient();
  let data = [];
  let count = 0;
  let viewError = null;
  const usesGroupedCell = Boolean(cell.typeGroup);
  const matchesGroupedCell = (row) => {
    if (!usesGroupedCell) return true;
    const requiredType = cell.type && cell.type !== "TODOS" ? cell.type : (filters.type && filters.type !== "TODOS" ? filters.type : "");
    if (requiredType && row.type !== requiredType) return false;
    return classifyClosingType(row.type || "") === cell.typeGroup && normalizeClosingSector(row.sector || "", cell.typeGroup) === cell.sector;
  };
  const sliceGroupedRows = (rows) => {
    const filtered = rows.filter(matchesGroupedCell);
    count = filtered.length;
    return filtered.slice(page * limit, page * limit + limit);
  };
  const useCompetenceSource = true;

  if (!useCompetenceSource) try {
    let query = client
      .from(VIEW_MONTHLY_NOTES)
      .select("*", { count: "exact" })
      .eq("basis", "competence")
      .eq("year", cell.year)
      .eq("month_number", cell.month);

    if (!usesGroupedCell) query = query.eq("sector", cell.sector);

    if (cell.store && cell.store !== "TODAS") query = query.eq("store", cell.store);
    if (!usesGroupedCell && cell.type && cell.type !== "TODOS") query = query.eq("type", cell.type);
    else if (!usesGroupedCell && filters.type && filters.type !== "TODOS") query = query.eq("type", filters.type);

    const response = await query
      .order("emission_date", { ascending: true })
      .order("invoice", { ascending: true })
      .range(usesGroupedCell ? 0 : page * limit, usesGroupedCell ? SUPABASE_PAGE_SIZE - 1 : page * limit + limit - 1);

    if (response.error) throw response.error;
    data = usesGroupedCell ? sliceGroupedRows(response.data || []) : (response.data || []);
    if (!usesGroupedCell) count = Number(response.count || 0);
  } catch (error) {
    viewError = error;
  } else {
    viewError = { code: "PGRST205" };
  }

  if (viewError && !isMissingBackendObject(viewError) && !isMissingColumn(viewError, "basis")) {
    viewError.userMessage = "Nao foi possivel carregar as notas da celula.";
    throw viewError;
  }

  if (viewError) {
    const competenceMonth = competenceMonthValue(cell.year, cell.month);
    let fallbackQuery = client
      .from("loss_notes")
      .select("note_key, invoice, store, emission_date, emission_month, competence_month, type, sector, total_value, item_count", { count: "exact" })
      .eq("competence_month", competenceMonth);

    if (!usesGroupedCell) fallbackQuery = fallbackQuery.eq("sector", cell.sector);

    if (cell.store && cell.store !== "TODAS") fallbackQuery = fallbackQuery.eq("store", cell.store);
    if (!usesGroupedCell && cell.type && cell.type !== "TODOS") fallbackQuery = fallbackQuery.eq("type", cell.type);
    else if (!usesGroupedCell && filters.type && filters.type !== "TODOS") fallbackQuery = fallbackQuery.eq("type", filters.type);

    const response = await fallbackQuery
      .order("emission_date", { ascending: true })
      .order("invoice", { ascending: true })
      .range(usesGroupedCell ? 0 : page * limit, usesGroupedCell ? SUPABASE_PAGE_SIZE - 1 : page * limit + limit - 1);

    if (response.error) {
      response.error.userMessage = "Nao foi possivel carregar as notas base desta celula.";
      throw response.error;
    }

    const fallbackRows = usesGroupedCell ? sliceGroupedRows(response.data || []) : (response.data || []);
    const auditRows = fallbackRows.map((row) => ({
      ...row,
      year: cell.year,
      month_number: cell.month
    }));
    const { entryByKey, noteByEntryAndKey } = await fetchMonthlyAuditRows(client, auditRows, cell.year, cell.month);
    data = fallbackRows.map((row) => {
      const noteAudit = readLocalAudit(localNoteKey(cell, row.note_key));
      const entryAudit = readLocalAudit(localEntryKey(cell));
      const savedEntry = entryByKey.get(entryAuditKey({
        ...row,
        year: cell.year,
        month_number: cell.month
      }));
      const savedNote = savedEntry ? noteByEntryAndKey.get(`${savedEntry.id}::${row.note_key}`) : null;
      return {
        note_key: row.note_key,
        invoice: row.invoice,
        store: row.store,
        type: row.type,
        sector: row.sector,
        emission_date: row.emission_date,
        emission_month: row.emission_month,
        competence_month: row.competence_month,
        total_value: row.total_value,
        item_count: row.item_count,
        note_status: savedNote?.status || noteAudit?.status || "pendente",
        note_observation: savedNote?.observation || noteAudit?.observation || "",
        note_classification: savedNote?.classification || noteAudit?.classification || "",
        entry_id: savedEntry?.id || entryAudit?.entryId || null,
        entry_status: savedEntry?.status || entryAudit?.status || cell.status || "pendente",
        entry_observation: savedEntry?.observation || entryAudit?.observation || cell.observation || ""
      };
    });
    if (!usesGroupedCell) count = Number(response.count || 0);
  }

  const result = {
    entryId: data?.[0]?.entry_id || cell.entryId || null,
    entryStatus: data?.[0]?.entry_status || cell.status || "pendente",
    entryObservation: data?.[0]?.entry_observation || cell.observation || "",
    totalCount: Number(count || 0),
    hasMore: Number(count || 0) > (page + 1) * limit,
    notes: (data || []).map((row) => ({
      entryId: row.entry_id || null,
      noteKey: row.note_key,
      invoice: row.invoice || "-",
      store: row.store || "Loja nao identificada",
      sector: row.sector || "Nao classificado",
      type: row.type || "Outros",
      totalValue: Number(row.total_value || 0),
      itemCount: Number(row.item_count || 0),
      date: row.emission_date || "",
      emissionMonth: row.emission_month || monthKey(row.emission_date || ""),
      competenceMonth: row.competence_month || competenceKey(row.emission_date || ""),
      status: row.note_status || "pendente",
      observation: row.note_observation || "",
      classification: row.note_classification || ""
    }))
  };

  notesCache.set(cacheKey, result);
  return result;
}

export async function fetchNoteItems(noteKey) {
  if (itemsCache.has(noteKey)) return itemsCache.get(noteKey);

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("loss_items")
    .select("id, note_key, item_index, product, quantity, unit_value, value, reason, sector")
    .eq("note_key", noteKey)
    .order("item_index", { ascending: true });

  if (error) {
    error.userMessage = "Nao foi possivel carregar os produtos da nota.";
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

export async function saveItemReason(itemId, reason = "") {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("loss_items")
    .update({ reason })
    .eq("id", itemId)
    .select("id, note_key, reason")
    .single();

  if (error) {
    error.userMessage = "Nao foi possivel salvar o motivo do produto.";
    throw error;
  }

  if (data?.note_key) itemsCache.delete(data.note_key);
  return {
    id: data.id,
    noteKey: data.note_key,
    reason: data.reason || ""
  };
}

export async function saveItemReasons(updates = []) {
  const validUpdates = updates.filter((item) => item?.id);
  if (!validUpdates.length) return [];

  const saved = await Promise.all(validUpdates.map((item) => saveItemReason(item.id, item.reason || "")));
  new Set(saved.map((item) => item.noteKey).filter(Boolean)).forEach((noteKey) => itemsCache.delete(noteKey));
  return saved;
}

function applyManagerialFilters(query, filters = {}) {
  let nextQuery = query;
  if (filters.store && filters.store !== "TODAS") nextQuery = nextQuery.eq("store", filters.store);
  if (filters.sector && filters.sector !== "TODOS") nextQuery = nextQuery.eq("sector", filters.sector);
  if (filters.product && filters.product !== "TODOS") nextQuery = nextQuery.eq("product", filters.product);
  if (filters.type && filters.type !== "TODOS") nextQuery = nextQuery.eq("type", filters.type);
  if (filters.reason && filters.reason !== "TODOS") {
    nextQuery = filters.reason === "Sem motivo" ? nextQuery.eq("reason", "") : nextQuery.eq("reason", filters.reason);
  }
  return nextQuery;
}

export async function fetchManagerialItems(filters = {}) {
  const client = getSupabaseClient();
  const year = Number(filters.year || new Date().getFullYear());
  const fromDate = `${year - 1}-01-01T00:00:00.000Z`;
  const toDate = `${year + 1}-01-01T00:00:00.000Z`;
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + SUPABASE_PAGE_SIZE - 1;
    const { data, error } = await applyManagerialFilters(
      client
        .from("loss_items")
        .select("id, note_key, invoice, store, emission_date, emission_month, competence_month, operation, type, display_type, sector, product, quantity, unit_value, value, reason")
        .gte("emission_date", fromDate)
        .lt("emission_date", toDate),
      filters
    )
      .order("emission_date", { ascending: true })
      .range(from, to);

    if (error) {
      error.userMessage = "Nao foi possivel carregar a analise gerencial.";
      throw error;
    }

    const pageRows = data || [];
    rows.push(...pageRows);
    if (pageRows.length < SUPABASE_PAGE_SIZE) break;
    from += SUPABASE_PAGE_SIZE;
  }

  return rows.map((row) => ({
    id: row.id,
    noteKey: row.note_key,
    invoice: row.invoice || "-",
    store: row.store || "Loja nao identificada",
    date: row.emission_date || "",
    emissionMonth: row.emission_month || "",
    competenceMonth: row.competence_month || "",
    operation: row.operation || "",
    type: row.type || "Outros",
    displayType: row.display_type || row.type || "Outros",
    sector: row.sector || "Nao classificado",
    product: row.product || "Produto",
    quantity: Number(row.quantity || 0),
    unitValue: Number(row.unit_value || 0),
    value: Number(row.value || 0),
    reason: row.reason || ""
  }));
}

export async function saveEntryAudit({ cell, status, observation = "" }) {
  const client = getSupabaseClient();
  const payload = {
    store: cell.store,
    year: cell.year,
    month_number: cell.month,
    month_label: cell.monthLabel,
    type: cell.type,
    sector: cell.sector,
    status,
    observation,
    system_total_value: cell.totalValue,
    system_note_count: cell.noteCount,
    checked_at: new Date().toISOString()
  };

  const { data, error } = await client
    .from(TABLE_MONTHLY_ENTRY)
    .upsert(payload, {
      onConflict: "store,year,month_number,type,sector"
    })
    .select("id, status, observation")
    .single();

  if (error && isMissingBackendObject(error)) {
    const fallback = {
      entryId: cell.entryId || localEntryKey(cell),
      status,
      observation,
      savedAt: new Date().toISOString()
    };
    writeLocalAudit(localEntryKey(cell), fallback);
    return fallback;
  }

  if (error) {
    error.userMessage = "Nao foi possivel salvar a auditoria da celula.";
    throw error;
  }

  if (observation) {
    await client.from(TABLE_MONTHLY_OBSERVATION).insert({
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

export async function saveNoteAudit({ cell, noteKey, status, observation = "", classification = "" }) {
  const entry = await saveEntryAudit({
    cell,
    status: cell.status,
    observation: cell.observation || ""
  });

  const client = getSupabaseClient();
  const payload = {
    entry_id: entry.entryId,
    note_key: noteKey,
    status,
    observation,
    classification,
    checked_at: new Date().toISOString()
  };

  let { data, error } = await client
    .from(TABLE_MONTHLY_NOTE)
    .upsert(payload, {
      onConflict: "entry_id,note_key"
    })
    .select("entry_id, status, observation, classification")
    .single();

  if (error && isMissingColumn(error, "classification")) {
    error.userMessage = "O campo classification ainda nao existe em monthly_closing_notes. Rode o SQL de atualizacao no Supabase e tente novamente.";
    throw error;
  }

  if (error && isMissingBackendObject(error)) {
    const fallback = {
      entryId: entry.entryId,
      status,
      observation,
      classification,
      savedAt: new Date().toISOString()
    };
    writeLocalAudit(localNoteKey(cell, noteKey), fallback);
    return fallback;
  }

  if (error) {
    error.userMessage = "Nao foi possivel salvar a auditoria da nota.";
    throw error;
  }

  if (observation) {
    await client.from(TABLE_MONTHLY_OBSERVATION).insert({
      entry_id: entry.entryId,
      note_key: noteKey,
      scope: "note",
      message: observation
    });
  }

  return {
    entryId: data.entry_id,
    status: data.status || status,
    observation: data.observation || observation,
    classification: data.classification || classification
  };
}
