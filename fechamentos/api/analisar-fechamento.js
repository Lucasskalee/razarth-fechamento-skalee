const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 6;
const rateBuckets = new Map();

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    resumo_executivo: { type: "string" },
    nivel_atencao: { type: "string", enum: ["baixo", "medio", "alto", "critico"] },
    anomalias: {
      type: "array",
      maxItems: 5,
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
      maxItems: 5,
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
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          acao: { type: "string" },
          prioridade: { type: "string", enum: ["baixa", "media", "alta"] },
          indicador: { type: "string" }
        },
        required: ["acao", "prioridade", "indicador"]
      }
    },
    pontos_conferencia: { type: "array", maxItems: 5, items: { type: "string" } },
    limitacoes: { type: "array", maxItems: 5, items: { type: "string" } }
  },
  required: ["resumo_executivo", "nivel_atencao", "anomalias", "causas_provaveis", "recomendacoes", "pontos_conferencia", "limitacoes"]
};

function sendJson(response, status, payload) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}

function openAiFailure(response, openaiResponse, openaiBody, context) {
  const type = String(openaiBody?.error?.type || "unknown");
  const code = String(openaiBody?.error?.code || "");
  console.error(`OpenAI ${context} error`, openaiResponse.status, type, code || "no_code");

  if (code === "insufficient_quota" || type === "insufficient_quota") {
    return sendJson(response, 503, {
      error: "A conta da OpenAI esta sem credito para usar a IA. Adicione saldo em platform.openai.com/settings/organization/billing e tente novamente."
    });
  }
  if (openaiResponse.status === 401) {
    return sendJson(response, 503, { error: "A chave da OpenAI foi recusada. Cadastre uma chave valida no servidor." });
  }
  if (openaiResponse.status === 429) {
    return sendJson(response, 429, { error: "A OpenAI recebeu muitas solicitacoes. Aguarde um minuto e tente novamente." });
  }
  if (openaiResponse.status === 404 || code === "model_not_found") {
    return sendJson(response, 503, { error: "O modelo de IA configurado nao esta disponivel para esta conta." });
  }
  return sendJson(response, 502, { error: "A OpenAI apresentou uma falha temporaria. Tente novamente em instantes." });
}

function bearerToken(request) {
  const authorization = String(request.headers.authorization || "");
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
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
  const result = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_PUBLISHABLE_KEY }
  });
  if (!result.ok) return null;
  return result.json();
}

function validPayload(value) {
  return value && typeof value === "object"
    && typeof value.periodo === "string"
    && value.periodo.length <= 80
    && Array.isArray(value.lojas)
    && value.lojas.length <= 15
    && Array.isArray(value.produtos)
    && value.produtos.length <= 12;
}

function safeText(value, maxLength = 160) {
  return String(value ?? "").slice(0, maxLength);
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function sanitizePayload(value) {
  const compactRows = (rows, maxItems, textKeys, numberKeys) => (Array.isArray(rows) ? rows : [])
    .slice(0, maxItems)
    .map((row) => Object.fromEntries([
      ...textKeys.map((key) => [key, safeText(row?.[key])]),
      ...numberKeys.map((key) => [key, safeNumber(row?.[key])])
    ]));

  return {
    periodo: safeText(value.periodo, 80),
    filtros: {
      month: safeText(value.filtros?.month, 20),
      year: safeNumber(value.filtros?.year),
      store: safeText(value.filtros?.store),
      sector: safeText(value.filtros?.sector),
      product: safeText(value.filtros?.product),
      type: safeText(value.filtros?.type),
      reason: safeText(value.filtros?.reason)
    },
    indicadores: Object.fromEntries(Object.entries(value.indicadores || {}).slice(0, 10).map(([key, number]) => [safeText(key, 40), safeNumber(number)])),
    lojas: compactRows(value.lojas, 15, ["store"], ["value", "quantity", "items"]),
    setores: compactRows(value.setores, 15, ["sector"], ["value", "quantity", "items"]),
    produtos: compactRows(value.produtos, 12,
      ["produto", "loja", "setor", "motivo_principal"],
      ["valor_atual", "valor_anterior", "variacao_valor", "variacao_percentual", "quantidade_atual", "preco_medio_atual", "valor_sem_motivo"])
  };
}

function sanitizeHistory(value) {
  return (Array.isArray(value) ? value : [])
    .slice(-8)
    .filter((message) => message?.role === "user" || message?.role === "assistant")
    .map((message) => ({ role: message.role, content: safeText(message.content, 1200) }));
}

function extractOutputText(response) {
  return (response.output || [])
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === "output_text")
    .map((content) => content.text)
    .join("");
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

    const payload = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
    if (!validPayload(payload)) return sendJson(response, 400, { error: "Resumo gerencial invalido." });
    const safePayload = sanitizePayload(payload);
    const question = safeText(payload.question, 600).trim();
    const history = sanitizeHistory(payload.history);

    if (question) {
      const chatResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          store: false,
          max_output_tokens: 900,
          instructions: [
            "Voce e o assistente gerencial do fechamento de perdas de um supermercado.",
            "Responda em portugues do Brasil, de forma direta e clara.",
            "Use somente o contexto consolidado fornecido. Nao invente dados, causas ou valores.",
            "Diferencie fatos observados de hipoteses e sempre indique quando algo exige conferencia humana.",
            "Nao altere nem aprove fechamentos."
          ].join(" "),
          input: [
            { role: "user", content: `Contexto gerencial do recorte atual:\n${JSON.stringify(safePayload)}` },
            ...history,
            { role: "user", content: question }
          ]
        })
      });

      const chatBody = await chatResponse.json().catch(() => ({}));
      if (!chatResponse.ok) {
        return openAiFailure(response, chatResponse, chatBody, "chat");
      }
      const answer = extractOutputText(chatBody);
      if (!answer) return sendJson(response, 502, { error: "A IA retornou uma resposta vazia." });
      return sendJson(response, 200, { answer, generatedAt: new Date().toISOString(), model: OPENAI_MODEL });
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        store: false,
        max_output_tokens: 1800,
        instructions: [
          "Voce e um analista de perdas de supermercado.",
          "Analise somente os dados consolidados fornecidos e responda em portugues do Brasil.",
          "Nao invente fatos, notas, fornecedores ou causas. Diferencie evidencia de hipotese.",
          "Valores e variacoes sao calculados pelo sistema e nunca devem ser recalculados ou alterados.",
          "Sugestoes exigem validacao e aprovacao humana antes de qualquer acao."
        ].join(" "),
        input: JSON.stringify(safePayload),
        text: {
          format: {
            type: "json_schema",
            name: "analise_fechamento",
            strict: true,
            schema: analysisSchema
          }
        }
      })
    });

    const openaiBody = await openaiResponse.json().catch(() => ({}));
    if (!openaiResponse.ok) {
      return openAiFailure(response, openaiResponse, openaiBody, "analysis");
    }

    const text = extractOutputText(openaiBody);
    if (!text) return sendJson(response, 502, { error: "A IA retornou uma resposta vazia." });

    return sendJson(response, 200, {
      analysis: JSON.parse(text),
      generatedAt: new Date().toISOString(),
      model: OPENAI_MODEL
    });
  } catch (error) {
    console.error("AI closing analysis failed", error?.message || error);
    return sendJson(response, 500, { error: "Nao foi possivel gerar a analise por IA." });
  }
};
