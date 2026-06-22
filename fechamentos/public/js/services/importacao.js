import { getSupabaseClient, TABLES } from "../config/supabase.js";
import { clearFechamentoCache, TABLE_MONTHLY_ENTRY, TABLE_MONTHLY_NOTE, TABLE_MONTHLY_OBSERVATION } from "./fechamento.js";
import { clearMonthlyClosingCache } from "./fechamentoMensalApi.js";
import { classifySector, classifyType, competenceKey, detailType, monthKey, normalizeReason, safeStore } from "./classificacao.js";

const STORAGE_KEY = "gestao_perdas_local_db_v2";
const PRIMARY_PERSISTENCE = "remote";

const STORE_PATH_HINTS = [
  { match: "SOL 6 CD", value: "SOL 6 CD" },
  { match: "SOL 7", value: "SOL 7" },
  { match: "SOL 4", value: "SOL 4" },
  { match: "SOL 3", value: "SOL 3" },
  { match: "SOL 2", value: "SOL 2" },
  { match: "SOL 1", value: "SOL 1" }
];

const TYPE_PATH_HINTS = [
  { match: "SAIDA DE UM PARA OUTRO", value: "Saida entre lojas" },
  { match: "USO E CONSUMO", value: "Uso/Consumo" },
  { match: "PERDAS", value: "Perdas" }
];

const persistenceState = {
  mode: "remote",
  detail: ""
};

const RESET_IMPORT_RPC = "reset_import_data";
const SUPABASE_PAGE_SIZE = 1000;

function setPersistence(mode, detail = "") {
  persistenceState.mode = mode;
  persistenceState.detail = detail;
}

export function getPersistenceInfo() {
  return { ...persistenceState, primary: PRIMARY_PERSISTENCE };
}

function buildFriendlyError(message, error) {
  console.error(error);
  const wrapped = new Error(message);
  const details = [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(" ");
  wrapped.userMessage = details ? `${message} Detalhe: ${details}` : message;
  return wrapped;
}

function getText(parent, tag) {
  const nodes = parent.getElementsByTagNameNS("*", tag);
  return nodes && nodes[0] ? nodes[0].textContent.trim() : "";
}

function getAccessKey(xml) {
  const explicit = getText(xml, "chNFe");
  if (explicit) return explicit.replace(/\D/g, "");
  const infNFe = xml.getElementsByTagNameNS("*", "infNFe")[0];
  const infId = infNFe?.getAttribute("Id") || "";
  return infId ? infId.replace(/^NFe/i, "").replace(/\D/g, "") : "";
}

function chunkArray(items, size = 200) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

function normalizeStoreValue(value) {
  return value || "Nao identificada";
}

function normalizeTypeValue(value) {
  return value || "Nao identificado";
}

function normalizeSectorValue(value) {
  return value || "Nao classificado";
}

function normalizeDateValue(value) {
  return value || "";
}

function normalizeMonthValue(value, dateValue, formatter) {
  return value || formatter(dateValue) || "Sem data";
}

function mapRowToItem(row) {
  const dateValue = normalizeDateValue(row.emission_date);
  const storeValue = normalizeStoreValue(row.store);
  const typeValue = normalizeTypeValue(row.type);
  const sectorValue = normalizeSectorValue(row.sector);
  return {
    id: row.id,
    noteKey: row.note_key,
    accessKey: row.access_key || "",
    fileName: row.source_file || "",
    invoice: row.invoice || "-",
    store: storeValue,
    date: dateValue,
    emissionMonth: normalizeMonthValue(row.emission_month, dateValue, monthKey),
    competenceMonth: normalizeMonthValue(row.competence_month, dateValue, competenceKey),
    operation: row.operation || "",
    type: typeValue,
    displayType: row.display_type || detailType(typeValue, sectorValue),
    sector: sectorValue,
    sectorManual: Boolean(row.sector_manual),
    product: row.product || "Produto",
    quantity: Number(row.quantity || 0),
    unitValue: Number(row.unit_value || 0),
    value: Number(row.value || 0),
    reason: normalizeReason(row.reason),
    selected: Boolean(row.selected)
  };
}

function mapRowToNote(row) {
  const dateValue = normalizeDateValue(row.emission_date);
  const storeValue = normalizeStoreValue(row.store);
  const typeValue = normalizeTypeValue(row.type);
  const sectorValue = normalizeSectorValue(row.sector);
  return {
    noteKey: row.note_key,
    accessKey: row.access_key || "",
    fileName: row.source_file || "",
    invoice: row.invoice || "-",
    store: storeValue,
    date: dateValue,
    emissionMonth: normalizeMonthValue(row.emission_month, dateValue, monthKey),
    competenceMonth: normalizeMonthValue(row.competence_month, dateValue, competenceKey),
    operation: row.operation || "",
    type: typeValue,
    displayType: row.display_type || detailType(typeValue, sectorValue),
    sector: sectorValue,
    sectorManual: Boolean(row.sector_manual),
    totalValue: Number(row.total_value || 0),
    itemCount: Number(row.item_count || 0)
  };
}

function localStorageAvailable() {
  try {
    return Boolean(window.localStorage);
  } catch {
    return false;
  }
}

function readLocalDatabase() {
  if (!localStorageAvailable()) return { notes: [], items: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { notes: [], items: [] };
    const parsed = JSON.parse(raw);
    return {
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      items: Array.isArray(parsed.items) ? parsed.items : []
    };
  } catch (error) {
    console.error(error);
    return { notes: [], items: [] };
  }
}

function writeLocalDatabase(database) {
  if (!localStorageAvailable()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
    notes: database.notes || [],
    items: database.items || []
  }));
}

export function clearImportLocalCache() {
  writeLocalDatabase({ notes: [], items: [] });
  clearFechamentoCache();
  clearMonthlyClosingCache();
}

function localDetail() {
  return "Supabase indisponivel; exibindo fallback temporario do navegador.";
}

async function requireRemote(remoteAction) {
  try {
    const result = await remoteAction();
    setPersistence("remote");
    return result;
  } catch (error) {
    setPersistence("remote");
    throw error;
  }
}

async function withLocalFallback(remoteAction, fallbackAction) {
  try {
    const result = await remoteAction();
    setPersistence("remote");
    return result;
  } catch (error) {
    console.error(error);
    const result = await fallbackAction(error);
    setPersistence("local", localDetail());
    return result;
  }
}

async function fetchAllRows(builder, entityLabel) {
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + SUPABASE_PAGE_SIZE - 1;
    const { data, error } = await builder(from, to);
    if (error) throw buildFriendlyError(`Nao foi possivel carregar ${entityLabel} no banco.`, error);
    const pageRows = data || [];
    rows.push(...pageRows);
    if (pageRows.length < SUPABASE_PAGE_SIZE) break;
    from += SUPABASE_PAGE_SIZE;
  }

  return rows;
}

async function loadNotesFromDatabase(client) {
  const rows = await fetchAllRows(
    (from, to) => client
      .from(TABLES.notes)
      .select("*")
      .order("emission_date", { ascending: false, nullsFirst: false })
      .order("invoice", { ascending: true })
      .range(from, to),
    "todas as notas importadas"
  );

  return rows.map(mapRowToNote);
}

async function loadItemsFromDatabase(client) {
  const rows = await fetchAllRows(
    (from, to) => client
      .from(TABLES.items)
      .select("*")
      .order("emission_date", { ascending: false, nullsFirst: false })
      .order("item_index", { ascending: true })
      .range(from, to),
    "todos os itens importados"
  );

  return rows.map(mapRowToItem);
}

function getFileLabel(file) {
  return file.webkitRelativePath || file.relativePath || file.name;
}

function normalizePathValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/]+/g, "/")
    .toUpperCase();
}

function detectStoreFromPath(fileLabel) {
  const normalized = normalizePathValue(fileLabel);
  const match = STORE_PATH_HINTS.find((entry) => normalized.includes(entry.match));
  return match?.value || "";
}

function detectTypeFromPath(fileLabel) {
  const normalized = normalizePathValue(fileLabel);
  const match = TYPE_PATH_HINTS.find((entry) => normalized.includes(entry.match));
  return match?.value || "";
}

function cleanDateValue(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function buildType(operation, fileLabel) {
  return detectTypeFromPath(fileLabel) || classifyType(operation);
}

function buildStore(storeFromXml, fileLabel) {
  return detectStoreFromPath(fileLabel) || safeStore(storeFromXml);
}

function buildDisplayType(type, sector) {
  if (type === "Saida entre lojas") return "Saida entre lojas";
  return detailType(type, sector);
}

function getItemSector(operation, product, type) {
  if (type === "Saida entre lojas") return "Saida de um para outro";
  return classifySector(operation, product);
}

function buildNoteIdentity({ accessKey, invoice, store, date, totalValue }) {
  const normalizedDate = cleanDateValue(date) || "";
  if (accessKey) return accessKey;
  return [invoice || "-", store || "Loja nao identificada", normalizedDate, Number(totalValue || 0).toFixed(2)].join("::");
}

function buildConsoleContext(parsedEntry) {
  return {
    arquivo: parsedEntry.fileLabel,
    loja: parsedEntry.note.store,
    tipo: parsedEntry.note.type,
    nota: parsedEntry.note.invoice,
    itens: parsedEntry.items.length
  };
}

function logImportEvent(status, parsedEntry, extra = {}) {
  const context = buildConsoleContext(parsedEntry);
  console.log("[importacao-xml]", {
    status,
    ...context,
    ...extra
  });
}

function createParserError(fileName) {
  return new Error(`O arquivo ${fileName} nao e um XML valido.`);
}

function createImportSummary(totalSelectedFiles, totalXmlFiles) {
  return {
    totalSelectedFiles,
    totalXmlFiles,
    importedNotes: 0,
    skippedNotes: 0,
    errorCount: 0,
    invalidFiles: [],
    errors: [],
    processedFiles: []
  };
}

function pushImportError(summary, fileLabel, error, parsedEntry = null) {
  const reason = error?.userMessage || error?.message || "Falha desconhecida ao importar o XML.";
  summary.errorCount += 1;
  summary.errors.push({
    file: fileLabel,
    note: parsedEntry?.note?.invoice || "-",
    store: parsedEntry?.note?.store || "Nao identificado",
    type: parsedEntry?.note?.type || "Nao identificado",
    reason
  });
  summary.processedFiles.push({
    file: fileLabel,
    status: "erro",
    note: parsedEntry?.note?.invoice || "-",
    store: parsedEntry?.note?.store || "Nao identificado",
    type: parsedEntry?.note?.type || "Nao identificado",
    itemCount: parsedEntry?.items?.length || 0,
    reason
  });
}

function markDuplicate(summary, parsedEntry, duplicateReason) {
  summary.skippedNotes += 1;
  summary.processedFiles.push({
    file: parsedEntry.fileLabel,
    status: "duplicado",
    note: parsedEntry.note.invoice,
    store: parsedEntry.note.store,
    type: parsedEntry.note.type,
    itemCount: parsedEntry.items.length,
    reason: duplicateReason
  });
}

function markImported(summary, parsedEntry) {
  summary.importedNotes += 1;
  summary.processedFiles.push({
    file: parsedEntry.fileLabel,
    status: "importado",
    note: parsedEntry.note.invoice,
    store: parsedEntry.note.store,
    type: parsedEntry.note.type,
    itemCount: parsedEntry.items.length,
    reason: "Importado com sucesso"
  });
}

export function parseXmlFile(text, fileName) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "text/xml");
  if (xml.querySelector("parsererror")) throw createParserError(fileName);

  const ide = xml.getElementsByTagNameNS("*", "ide")[0] || xml;
  const emit = xml.getElementsByTagNameNS("*", "emit")[0] || xml;
  const operation = getText(ide, "natOp") || "SEM OPERACAO";
  const invoice = getText(ide, "nNF") || "-";
  const date = getText(ide, "dhEmi") || getText(ide, "dEmi") || "";
  const accessKey = getAccessKey(xml);
  const xmlStore = getText(emit, "xFant") || getText(emit, "xNome");
  const store = buildStore(xmlStore, fileName);
  const type = buildType(operation, fileName);
  const dets = [...xml.getElementsByTagNameNS("*", "det")];

  const items = dets.map((det, index) => {
    const productNode = det.getElementsByTagNameNS("*", "prod")[0] || det;
    const product = getText(productNode, "xProd") || "Produto";
    const sector = getItemSector(operation, product, type);
    return {
      item_index: index + 1,
      access_key: accessKey || null,
      source_file: fileName,
      invoice,
      store,
      emission_date: cleanDateValue(date),
      emission_month: monthKey(date),
      competence_month: competenceKey(date),
      operation,
      type,
      display_type: buildDisplayType(type, sector),
      sector,
      sector_manual: false,
      product,
      quantity: Number.parseFloat(getText(productNode, "qCom") || "0") || 0,
      unit_value: Number.parseFloat(getText(productNode, "vUnCom") || "0") || 0,
      value: Number.parseFloat(getText(productNode, "vProd") || "0") || 0,
      reason: "",
      selected: false
    };
  });

  if (!items.length) {
    throw new Error(`O arquivo ${fileName} nao possui itens de produto na nota.`);
  }

  const totalValue = items.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const noteKey = buildNoteIdentity({ accessKey, invoice, store, date, totalValue });

  const finalizedItems = items.map((item) => ({
    ...item,
    id: `${noteKey}::${item.item_index}`,
    note_key: noteKey
  }));

  return {
    fileLabel: fileName,
    note: {
      note_key: noteKey,
      access_key: accessKey || null,
      source_file: fileName,
      invoice,
      store,
      emission_date: cleanDateValue(date),
      emission_month: monthKey(date),
      competence_month: competenceKey(date),
      operation,
      type,
      display_type: buildDisplayType(type, finalizedItems[0]?.sector || "Nao classificado"),
      sector: finalizedItems[0]?.sector || "Nao classificado",
      sector_manual: false,
      total_value: totalValue,
      item_count: finalizedItems.length
    },
    items: finalizedItems
  };
}

export async function loadAllItems() {
  const database = await loadAllData();
  return database.items;
}

export async function loadAllData() {
  try {
    const client = getSupabaseClient();
    const notes = await loadNotesFromDatabase(client);

    try {
      const items = await loadItemsFromDatabase(client);
      setPersistence("remote");
      return { notes, items };
    } catch (error) {
      setPersistence("remote_partial", `Notas oficiais carregadas do Supabase, mas os itens falharam. ${error.userMessage || ""}`.trim());
      return { notes, items: [] };
    }
  } catch (error) {
    console.error(error);
    const database = readLocalDatabase();
    setPersistence("local", `${localDetail()} ${error.userMessage || "Falha ao ler os dados oficiais do Supabase."}`.trim());
    return {
      notes: (database.notes || []).map(mapRowToNote),
      items: (database.items || []).map(mapRowToItem)
    };
  }
}

async function getExistingNoteByKey(client, noteKey) {
  const { data, error } = await client
    .from(TABLES.notes)
    .select("note_key, item_count")
    .eq("note_key", noteKey)
    .limit(1)
    .maybeSingle();

  if (error) throw buildFriendlyError("Falha ao consultar duplicidade da nota.", error);
  return data || null;
}

async function getExistingNoteByAccessKey(client, accessKey) {
  if (!accessKey) return null;
  const { data, error } = await client
    .from(TABLES.notes)
    .select("note_key, item_count")
    .eq("access_key", accessKey)
    .limit(1)
    .maybeSingle();

  if (error) throw buildFriendlyError("Falha ao consultar duplicidade pela chave de acesso.", error);
  return data || null;
}

async function getExistingNoteByComposite(client, note) {
  const { data, error } = await client
    .from(TABLES.notes)
    .select("note_key, item_count")
    .eq("invoice", note.invoice)
    .eq("store", note.store)
    .eq("total_value", note.total_value)
    .eq("emission_date", note.emission_date)
    .limit(1)
    .maybeSingle();

  if (error) throw buildFriendlyError("Falha ao consultar duplicidade pelos dados da nota.", error);
  return data || null;
}

async function getSavedItemCount(client, noteKey) {
  const { count, error } = await client
    .from(TABLES.items)
    .select("id", { count: "exact", head: true })
    .eq("note_key", noteKey);

  if (error) throw buildFriendlyError(`Falha ao conferir os itens salvos da nota ${noteKey}.`, error);
  return Number(count || 0);
}

async function detectDuplicate(client, parsedEntry) {
  const { note, items } = parsedEntry;
  const candidates = [
    { row: await getExistingNoteByKey(client, note.note_key), reason: "Nota ja existe pela chave interna." },
    { row: await getExistingNoteByAccessKey(client, note.access_key), reason: "Nota ja existe pela chave de acesso." },
    { row: await getExistingNoteByComposite(client, note), reason: "Nota ja existe pela combinacao emitente/numero/valor/data." }
  ].filter((candidate) => candidate.row?.note_key);

  if (!candidates.length) return { duplicate: false, existingNoteKey: null, reason: "" };

  const candidate = candidates[0];
  const savedItemCount = await getSavedItemCount(client, candidate.row.note_key);
  if (savedItemCount >= items.length) {
    return {
      duplicate: true,
      existingNoteKey: candidate.row.note_key,
      reason: candidate.reason
    };
  }

  return {
    duplicate: false,
    existingNoteKey: candidate.row.note_key,
    reason: `${candidate.reason} A nota sera reparada porque os itens salvos estao incompletos.`
  };
}

async function saveNote(client, note) {
  const { error } = await client
    .from(TABLES.notes)
    .upsert([note], { onConflict: "note_key" });

  if (error) throw buildFriendlyError(`Falha ao salvar a nota ${note.invoice} no banco.`, error);
}

async function saveItems(client, parsedEntry) {
  for (const chunk of chunkArray(parsedEntry.items, 300)) {
    if (!chunk.length) continue;
    const { error } = await client
      .from(TABLES.items)
      .upsert(chunk, { onConflict: "id" });

    if (error) {
      throw buildFriendlyError(`A nota ${parsedEntry.note.invoice} foi salva, mas os itens falharam ao gravar no banco.`, error);
    }
  }
}

async function verifyImportedEntry(client, parsedEntry) {
  const noteKey = parsedEntry.note.note_key;
  const existingNote = await getExistingNoteByKey(client, noteKey);
  if (!existingNote) {
    throw buildFriendlyError(`A nota ${parsedEntry.note.invoice} nao foi localizada apos a importacao.`, new Error("missing_note_after_import"));
  }

  const savedItemCount = await getSavedItemCount(client, noteKey);
  if (savedItemCount < parsedEntry.items.length) {
    throw buildFriendlyError(`A nota ${parsedEntry.note.invoice} foi salva de forma incompleta.`, new Error("partial_items_after_import"));
  }
}

async function processSingleXml(client, file, summary, index, totalXmlFiles, onProgress) {
  const fileLabel = getFileLabel(file);
  onProgress?.({
    current: index + 1,
    total: totalXmlFiles,
    fileLabel,
    message: `Importando ${index + 1} de ${totalXmlFiles}...`
  });

  let parsedEntry;

  try {
    const text = await file.text();
    parsedEntry = parseXmlFile(text, fileLabel);
    logImportEvent("lido", parsedEntry);
  } catch (error) {
    console.error(error);
    summary.invalidFiles.push(fileLabel);
    pushImportError(summary, fileLabel, error);
    console.error("[importacao-xml]", { status: "erro_parse", arquivo: fileLabel, motivo: error.message });
    return;
  }

  try {
    const duplicateCheck = await detectDuplicate(client, parsedEntry);
    if (duplicateCheck.reason) {
      logImportEvent(duplicateCheck.duplicate ? "duplicado" : "reparando", parsedEntry, { detalhe: duplicateCheck.reason });
    }

    if (duplicateCheck.duplicate) {
      markDuplicate(summary, parsedEntry, duplicateCheck.reason);
      return;
    }

    await saveNote(client, parsedEntry.note);
    await saveItems(client, parsedEntry);
    await verifyImportedEntry(client, parsedEntry);

    logImportEvent("importado", parsedEntry, { detalhe: "Importado com sucesso" });
    markImported(summary, parsedEntry);
  } catch (error) {
    console.error(error);
    logImportEvent("erro", parsedEntry, { motivo: error.userMessage || error.message });
    pushImportError(summary, fileLabel, error, parsedEntry);
  }
}

export async function importXmlFiles(files, options = {}) {
  const fileList = Array.from(files || []);
  const xmlFiles = fileList.filter((file) => /\.xml$/i.test(file.name || ""));
  const summary = createImportSummary(fileList.length, xmlFiles.length);

  if (!xmlFiles.length) return summary;

  return requireRemote(async () => {
    const client = getSupabaseClient();

    for (let index = 0; index < xmlFiles.length; index += 1) {
      await processSingleXml(client, xmlFiles[index], summary, index, xmlFiles.length, options.onProgress);
    }

    return summary;
  });
}

export async function updateItemField(itemId, fields) {
  return withLocalFallback(
    async () => {
      const client = getSupabaseClient();
      const { error } = await client.from(TABLES.items).update(fields).eq("id", itemId);
      if (error) throw error;
    },
    async () => {
      const database = readLocalDatabase();
      database.items = (database.items || []).map((row) => row.id === itemId ? { ...row, ...fields } : row);
      writeLocalDatabase(database);
    }
  );
}

export async function updateReasonForNote(noteKey, reason, onlySelected = false) {
  return withLocalFallback(
    async () => {
      const client = getSupabaseClient();
      let query = client.from(TABLES.items).update({ reason }).eq("note_key", noteKey);
      if (onlySelected) query = query.eq("selected", true);
      const { error } = await query;
      if (error) throw error;
    },
    async () => {
      const database = readLocalDatabase();
      database.items = (database.items || []).map((row) => {
        if (row.note_key !== noteKey) return row;
        if (onlySelected && !row.selected) return row;
        return { ...row, reason };
      });
      writeLocalDatabase(database);
    }
  );
}

export async function updateSectorForNote(noteKey, type, sector) {
  const displayType = detailType(type, sector);
  return withLocalFallback(
    async () => {
      const client = getSupabaseClient();
      const { error: noteError } = await client.from(TABLES.notes).update({ sector, sector_manual: true, display_type: displayType }).eq("note_key", noteKey);
      if (noteError) throw noteError;
      const { error: itemError } = await client.from(TABLES.items).update({ sector, sector_manual: true, display_type: displayType }).eq("note_key", noteKey);
      if (itemError) throw itemError;
    },
    async () => {
      const database = readLocalDatabase();
      database.notes = (database.notes || []).map((row) => row.note_key === noteKey ? { ...row, sector, sector_manual: true, display_type: displayType } : row);
      database.items = (database.items || []).map((row) => row.note_key === noteKey ? { ...row, sector, sector_manual: true, display_type: displayType } : row);
      writeLocalDatabase(database);
    }
  );
}

export async function updateCompetenceMonthForNote(noteKey, competenceMonth) {
  return withLocalFallback(
    async () => {
      const client = getSupabaseClient();
      const { error: noteError } = await client.from(TABLES.notes).update({ competence_month: competenceMonth }).eq("note_key", noteKey);
      if (noteError) throw noteError;
      const { error: itemError } = await client.from(TABLES.items).update({ competence_month: competenceMonth }).eq("note_key", noteKey);
      if (itemError) throw itemError;
    },
    async () => {
      const database = readLocalDatabase();
      database.notes = (database.notes || []).map((row) => row.note_key === noteKey ? { ...row, competence_month: competenceMonth } : row);
      database.items = (database.items || []).map((row) => row.note_key === noteKey ? { ...row, competence_month: competenceMonth } : row);
      writeLocalDatabase(database);
    }
  );
}

export async function deleteNote(noteKey) {
  return withLocalFallback(
    async () => {
      const client = getSupabaseClient();
      const { error } = await client.from(TABLES.notes).delete().eq("note_key", noteKey);
      if (error) throw error;
    },
    async () => {
      const database = readLocalDatabase();
      database.notes = (database.notes || []).filter((row) => row.note_key !== noteKey);
      database.items = (database.items || []).filter((row) => row.note_key !== noteKey);
      writeLocalDatabase(database);
    }
  );
}

async function clearRemoteTable(client, tableName, keyField) {
  const { data, error } = await client.from(tableName).select(keyField);
  if (error) throw error;

  const keys = (data || []).map((row) => row[keyField]).filter(Boolean);
  for (const chunk of chunkArray(keys, 200)) {
    if (!chunk.length) continue;
    const { error: deleteError } = await client.from(tableName).delete().in(keyField, chunk);
    if (deleteError) throw deleteError;
  }
}

async function tryResetImportRpc(client, includeMonthlyClosing) {
  try {
    const { error } = await client.rpc(RESET_IMPORT_RPC, {
      include_monthly_closing: includeMonthlyClosing
    });
    if (error) throw error;
    return true;
  } catch (error) {
    console.warn("[reset-import-data] RPC indisponivel, aplicando fallback com deletes seguros.", error);
    return false;
  }
}

async function clearImportTablesWithFallback(client, includeMonthlyClosing) {
  await clearRemoteTable(client, TABLES.items, "id");
  await clearRemoteTable(client, TABLES.notes, "note_key");

  if (!includeMonthlyClosing) return;

  await clearRemoteTable(client, TABLE_MONTHLY_OBSERVATION, "id");
  await clearRemoteTable(client, TABLE_MONTHLY_NOTE, "id");
  await clearRemoteTable(client, TABLE_MONTHLY_ENTRY, "id");
}

export async function clearDatabase(options = {}) {
  const includeMonthlyClosing = Boolean(options.includeMonthlyClosing);
  return withLocalFallback(
    async () => {
      const client = getSupabaseClient();
      const rpcHandled = await tryResetImportRpc(client, includeMonthlyClosing);
      if (!rpcHandled) await clearImportTablesWithFallback(client, includeMonthlyClosing);
      clearImportLocalCache();
    },
    async () => {
      clearImportLocalCache();
    }
  );
}
