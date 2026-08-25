const SUPABASE_URL = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";

function sendJson(response, status, body) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  return response.end(JSON.stringify(body));
}

function readBearerToken(request) {
  const authorization = String(request.headers.authorization || "");
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

async function authenticate(token) {
  const result = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_PUBLISHABLE_KEY
    }
  });
  return result.ok ? result.json() : null;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Metodo nao permitido." });
  }

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return sendJson(response, 503, { error: "Supabase nao configurado na Function." });
  }

  const token = readBearerToken(request);
  if (!token || !(await authenticate(token))) {
    return sendJson(response, 401, { error: "Sessao invalida ou expirada." });
  }

  const noteKey = String(request.body?.noteKey || "").trim();
  if (!/^[A-Za-z0-9:_-]{10,120}$/.test(noteKey)) {
    return sendJson(response, 400, { error: "Identificador da nota invalido." });
  }

  try {
    const deleteResult = await fetch(
      `${SUPABASE_URL}/rest/v1/loss_notes?note_key=eq.${encodeURIComponent(noteKey)}&select=note_key`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Prefer: "return=representation"
        }
      }
    );

    const rawBody = await deleteResult.text();
    const deletedRows = rawBody ? JSON.parse(rawBody) : [];
    if (!deleteResult.ok) {
      console.error("[excluir-nota] Supabase recusou exclusao", { status: deleteResult.status, noteKey });
      return sendJson(response, 502, { error: "O banco recusou a exclusao da nota." });
    }
    if (!Array.isArray(deletedRows) || deletedRows.length !== 1) {
      console.warn("[excluir-nota] Nenhuma nota removida", { noteKey, removed: deletedRows?.length || 0 });
      return sendJson(response, 409, { error: "A nota nao foi removida. Atualize a tela e tente novamente." });
    }

    console.log("[excluir-nota] Nota removida", { noteKey });
    return sendJson(response, 200, { deleted: true, noteKey });
  } catch (error) {
    console.error("[excluir-nota] Falha inesperada", { noteKey, error: String(error) });
    return sendJson(response, 500, { error: "Falha inesperada ao excluir a nota." });
  }
}
