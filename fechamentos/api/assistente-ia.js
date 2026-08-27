const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 8;
const rateBuckets = new Map();

function sendJson(response, status, payload) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}

function bearerToken(request) {
  const authorization = String(request.headers.authorization || "");
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

function safeText(value, maxLength = 180) {
  return String(value ?? "").slice(0, maxLength);
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function sanitizeHistory(value) {
  return (Array.isArray(value) ? value : [])
    .slice(-8)
    .filter((message) => message?.role === "user" || message?.role === "assistant")
    .map((message) => ({ role: message.role, content: safeText(message.content, 1000) }));
}

function sanitizePayload(value) {
  const compactRows = (rows, maxItems, textKeys, numberKeys) => (Array.isArray(rows) ? rows : [])
    .slice(0, maxItems)
    .map((row) => Object.fromEntries([
      ...textKeys.map((key) => [key, safeText(row?.[key])]),
      ...numberKeys.map((key) => [key, safeNumber(row?.[key])])
    ]));

  return {
    periodo: safeText(value?.periodo, 80),
    filtros: {
      month: safeText(value?.filtros?.month, 20),
      year: safeNumber(value?.filtros?.year),
      store: safeText(value?.filtros?.store),
      sector: safeText(value?.filtros?.sector),
      type: safeText(value?.filtros?.type),
      reason: safeText(value?.filtros?.reason)
    },
    indicadores: Object.fromEntries(Object.entries(value?.indicadores || {}).slice(0, 10).map(([key, number]) => [safeText(key, 40), safeNumber(number)])),
    lojas: compactRows(value?.lojas, 12, ["store", "mainSector"], ["value", "quantity", "items", "percent"]),
    setores: compactRows(value?.setores, 12, ["sector", "mainReason"], ["value", "quantity", "items", "percent"]),
    motivos: compactRows(value?.motivos, 8, ["reason"], ["value", "quantity", "items", "percent"]),
    produtos: compactRows(value?.produtos, 10, ["produto", "loja", "setor", "motivo_principal"], ["valor_atual", "valor_anterior", "variacao_valor", "variacao_percentual", "quantidade_atual", "preco_medio_atual"])
  };
}

function isRateLimited(userId) {
  const now = Date.now();
  const bucket = rateBuckets.get(userId);
  if (!bucket || now - bucket.startedAt >= RATE_WINDOW_MS) {
    rateBuckets.set(userId, { startedAt: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT;
}

async function authenticate(token) {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return null;
  const result = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_PUBLISHABLE_KEY }
  }).catch(() => null);
  if (!result || !result.ok) return null;
  return result.json().catch(() => null);
}

function extractOutputText(response) {
  return (response.output || [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === "output_text")
    .map((content) => content.text)
    .join("");
}

function openAiFailure(response, openaiResponse, openaiBody) {
  const type = String(openaiBody?.error?.type || "");
  const code = String(openaiBody?.error?.code || "");
  if (code === "insufficient_quota" || type === "insufficient_quota") {
    return sendJson(response, 503, { error: "A conta da OpenAI esta sem credito para usar a IA." });
  }
  if (openaiResponse.status === 401) return sendJson(response, 503, { error: "A chave da OpenAI foi recusada." });
  if (openaiResponse.status === 429) return sendJson(response, 429, { error: "A OpenAI recebeu muitas solicitacoes. Aguarde um minuto." });
  if (openaiResponse.status === 404 || code === "model_not_found") return sendJson(response, 503, { error: "O modelo de IA configurado nao esta disponivel." });
  return sendJson(response, 502, { error: "A OpenAI apresentou uma falha temporaria." });
}

module.exports = async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Metodo nao permitido." });
  }
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !OPENAI_API_KEY) {
    return sendJson(response, 503, { error: "A analise por IA ainda nao foi configurada no servidor." });
  }

  const token = bearerToken(request);
  if (!token) return sendJson(response, 401, { error: "Sessao obrigatoria." });

  try {
    const user = await authenticate(token);
    if (!user?.id) return sendJson(response, 401, { error: "Sessao invalida ou expirada." });
    if (isRateLimited(user.id)) return sendJson(response, 429, { error: "Limite temporario atingido. Aguarde um minuto." });

    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
    const safePayload = sanitizePayload(body);
    const question = safeText(body?.question, 700).trim() || "Faça uma analise gerencial do fechamento.";
    const history = sanitizeHistory(body?.history);

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        store: false,
        max_output_tokens: 1400,
        instructions: [
          "Voce e o assistente gerencial de fechamento de perdas de um supermercado.",
          "Responda em portugues do Brasil, com foco executivo e operacional.",
          "Use somente o contexto consolidado fornecido. Nao invente notas, fornecedores, lojas ou valores.",
          "Estruture a resposta em: resumo, evidencias, causas provaveis, recomendacoes e conferencia humana.",
          "Diferencie fatos observados de hipoteses e nao aprove nem altere fechamentos."
        ].join(" "),
        input: [
          { role: "user", content: `Contexto consolidado do fechamento:\n${JSON.stringify(safePayload)}` },
          ...history,
          { role: "user", content: question }
        ]
      })
    });

    const openaiBody = await openaiResponse.json().catch(() => ({}));
    if (!openaiResponse.ok) return openAiFailure(response, openaiResponse, openaiBody);

    const answer = extractOutputText(openaiBody);
    if (!answer) return sendJson(response, 502, { error: "A IA retornou uma resposta vazia." });
    return sendJson(response, 200, { answer, generatedAt: new Date().toISOString(), model: OPENAI_MODEL });
  } catch (error) {
    console.error("AI assistant failed", error?.message || error);
    return sendJson(response, 500, { error: "Nao foi possivel gerar a analise por IA." });
  }
};
