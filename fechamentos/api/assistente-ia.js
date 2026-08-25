const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 10;
const rateBuckets = new Map();

const structuredAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    resumo_executivo: { type: "string" },
    nivel_atencao: { type: "string", enum: ["low", "medium", "high", "critical"] },
    anomalias: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          titulo: { type: "string" },
          evidencia: { type: "string" },
          impacto: { type: "string" }
        },
        required: ["titulo", "evidencia", "impacto"]
      }
    },
    causas_provaveis: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          causa: { type: "string" },
          confianca: { type: "string", enum: ["baixa", "media", "alta"] },
          como_validar: { type: "string" }
        },
        required: ["causa", "confianca", "como_validar"]
      }
    },
    recomendacoes: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          acao: { type: "string" },
          prioridade: { type: "string", enum: ["low", "medium", "high", "critical"] },
          indicador: { type: "string" }
        },
        required: ["acao", "prioridade", "indicador"]
      }
    },
    pontos_conferencia: {
      type: "array",
      maxItems: 6,
      items: { type: "string" }
    },
    limitacoes: {
      type: "array",
      maxItems: 4,
      items: { type: "string" }
    }
  },
  required: [
    "resumo_executivo",
    "nivel_atencao",
    "anomalias",
    "causas_provaveis",
    "recomendacoes",
    "pontos_conferencia"
  ]
};

function sendJson(res, status, data) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

function bearerToken(req) {
  const auth = String(req.headers.authorization || "");
  return auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
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

function sanitizeText(val, max = 200) {
  return String(val ?? "").slice(0, max);
}

function sanitizePayload(raw) {
  const p = raw || {};
  return {
    periodo: sanitizeText(p.periodo, 80),
    filtros: {
      empresa: sanitizeText(p.filtros?.empresa, 80),
      store: sanitizeText(p.filtros?.store, 60),
      sector: sanitizeText(p.filtros?.sector, 60),
      month: Number(p.filtros?.month || 1),
      year: Number(p.filtros?.year || new Date().getFullYear()),
      type: sanitizeText(p.filtros?.type, 40),
      reason: sanitizeText(p.filtros?.reason, 40)
    },
    indicadores: {
      perda_total: Number(p.indicadores?.perda_total || 0),
      perda_mes_anterior: Number(p.indicadores?.perda_mes_anterior || 0),
      variacao_valor: Number(p.indicadores?.variacao_valor || 0),
      variacao_percentual: Number(p.indicadores?.variacao_percentual || 0),
      itens_analisados: Number(p.indicadores?.itens_analisados || 0),
      itens_sem_motivo: Number(p.indicadores?.itens_sem_motivo || 0),
      valor_sem_motivo: Number(p.indicadores?.valor_sem_motivo || 0)
    },
    lojas: (Array.isArray(p.lojas) ? p.lojas : []).slice(0, 10),
    setores: (Array.isArray(p.setores) ? p.setores : []).slice(0, 10),
    motivos: (Array.isArray(p.motivos) ? p.motivos : []).slice(0, 10),
    produtos: (Array.isArray(p.produtos) ? p.produtos : []).slice(0, 12)
  };
}

/**
 * Provedor OpenAI com JSON Schema estruturado
 */
async function callOpenAI(safePayload, question, history) {
  const instructions = [
    "Você é o Assistente IA de Fechamento e Prevenção de Perdas de um supermercado.",
    "Analise os dados consolidados fornecidos no payload de forma objetiva, técnica e acionável.",
    "Siga estritamente a estrutura: Diagnóstico, Evidências, Possíveis Causas (diferenciando Fato, Correlação e Hipótese), Impacto e Ações Recomendadas com prioridade.",
    "Nunca invente notas, lojas ou dados não existentes no contexto.",
    "Responda em Português do Brasil com clareza e foco gerencial."
  ].join(" ");

  const promptInput = `
Contexto Consolidado do Fechamento:
${JSON.stringify(safePayload, null, 2)}

Pergunta do Usuário:
${question || "Faça um diagnóstico completo das perdas deste fechamento mensal."}
  `;

  const messages = [
    { role: "system", content: instructions },
    ...(Array.isArray(history) ? history.slice(-6).map((h) => ({ role: h.role === "assistant" ? "assistant" : "user", content: String(h.content || "").slice(0, 800) })) : []),
    { role: "user", content: promptInput }
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "analise_fechamento",
          strict: true,
          schema: structuredAnalysisSchema
        }
      },
      temperature: 0.2,
      max_tokens: 1500
    })
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody?.error?.message || `OpenAI error ${res.status}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Resposta vazia da OpenAI.");

  return JSON.parse(content);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Método não permitido." });
  }

  const token = bearerToken(req);
  if (!token) {
    return sendJson(res, 401, { error: "Sessão obrigatória." });
  }

  const user = await authenticate(token);
  if (!user?.id) {
    return sendJson(res, 401, { error: "Sessão inválida ou expirada." });
  }

  if (isRateLimited(user.id)) {
    return sendJson(res, 429, { error: "Limite de solicitações atingido. Aguarde um minuto." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const safePayload = sanitizePayload(body);
    const question = sanitizeText(body.question, 800).trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (OPENAI_API_KEY) {
      const analysis = await callOpenAI(safePayload, question, history);
      return sendJson(res, 200, {
        analysis,
        answer: analysis.resumo_executivo,
        provider: "openai",
        generatedAt: new Date().toISOString()
      });
    }

    return sendJson(res, 503, {
      error: "Nenhum provedor de IA configurado no servidor (OPENAI_API_KEY ausente). O assistente utilizará a engine analítica local.",
      code: "NO_AI_KEY"
    });
  } catch (err) {
    console.error("Erro na rota /api/assistente-ia:", err);
    return sendJson(res, 500, {
      error: err.message || "Falha interna ao processar IA.",
      code: "AI_PROCESSING_ERROR"
    });
  }
};
