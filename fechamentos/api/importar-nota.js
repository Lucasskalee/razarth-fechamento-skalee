const SUPABASE_URL = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";

const NOTE_FIELDS = ["note_key", "access_key", "source_file", "invoice", "store", "emission_date", "emission_month", "competence_month", "operation", "type", "display_type", "sector", "sector_manual", "total_value", "item_count"];
const ITEM_FIELDS = ["id", "note_key", "item_index", "access_key", "source_file", "invoice", "store", "emission_date", "emission_month", "competence_month", "operation", "type", "display_type", "sector", "sector_manual", "product", "quantity", "unit_value", "value", "reason", "selected"];

function sendJson(response, status, body) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  return response.end(JSON.stringify(body));
}

function readBearerToken(request) {
  const authorization = String(request.headers.authorization || "");
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

function pickFields(source, fields) {
  return Object.fromEntries(fields.filter((field) => source[field] !== undefined).map((field) => [field, source[field]]));
}

function chunks(rows, size = 300) {
  const result = [];
  for (let index = 0; index < rows.length; index += size) result.push(rows.slice(index, index + size));
  return result;
}

async function authenticate(token) {
  const result = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_PUBLISHABLE_KEY }
  });
  return result.ok ? result.json() : null;
}

async function upsert(table, rows, conflictColumn) {
  const result = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${encodeURIComponent(conflictColumn)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      apikey: SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify(rows)
  });
  if (!result.ok) {
    const detail = await result.text();
    throw new Error(`${table}:${result.status}:${detail.slice(0, 300)}`);
  }
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Metodo nao permitido." });
  }
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return sendJson(response, 503, { error: "Supabase nao configurado na Function." });

  const token = readBearerToken(request);
  if (!token || !(await authenticate(token))) return sendJson(response, 401, { error: "Sessao invalida ou expirada." });

  const note = request.body?.note;
  const items = Array.isArray(request.body?.items) ? request.body.items : [];
  const noteKey = String(note?.note_key || "").trim();
  if (!/^[A-Za-z0-9:_-]{10,120}$/.test(noteKey) || !items.length || items.length > 1000) {
    return sendJson(response, 400, { error: "Nota ou quantidade de itens invalida." });
  }
  if (items.some((item) => String(item?.note_key || "") !== noteKey || !String(item?.id || ""))) {
    return sendJson(response, 400, { error: "Existem itens invalidos ou vinculados a outra nota." });
  }

  const safeNote = pickFields(note, NOTE_FIELDS);
  const safeItems = items.map((item) => pickFields(item, ITEM_FIELDS));
  try {
    await upsert("loss_notes", [safeNote], "note_key");
    for (const itemChunk of chunks(safeItems)) await upsert("loss_items", itemChunk, "id");
    console.log("[importar-nota] Importacao concluida", { noteKey, invoice: safeNote.invoice, items: safeItems.length });
    return sendJson(response, 200, { imported: true, noteKey, itemCount: safeItems.length });
  } catch (error) {
    console.error("[importar-nota] Falha na persistencia", { noteKey, error: String(error) });
    return sendJson(response, 502, { error: "O banco recusou a gravacao da nota ou de seus itens." });
  }
}
