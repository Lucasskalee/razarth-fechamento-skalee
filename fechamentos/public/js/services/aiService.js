import { brl, num } from "./classificacao.js";
import { getSupabaseClient } from "../config/supabase.js";
import { buildAnalyticsPayload } from "./closingAnalyticsService.js";

function localAnswer(question, payload) {
  const q = String(question || "").toLowerCase();
  const ind = payload.indicadores;
  const topSector = payload.setores[0];
  const topStore = payload.lojas[0];
  const topProduct = payload.produtos[0];
  const direction = ind.variacao_valor >= 0 ? "aumento" : "reducao";

  if (q.includes("setor") && topSector) {
    return `O setor ${topSector.sector} e o principal ponto de atencao: ${brl(topSector.value)}, equivalente a ${num(topSector.percent)}% do recorte. A principal causa registrada nos dados e ${topSector.mainReason}. Recomendo validar classificacoes pendentes, revisar processo operacional do setor e acompanhar os proximos lancamentos antes do fechamento.`;
  }
  if ((q.includes("loja") || q.includes("unidade")) && topStore) {
    return `${topStore.store} lidera o impacto com ${brl(topStore.value)}. O setor mais relevante nessa unidade e ${topStore.mainSector}. Compare procedimento de recebimento, baixa e justificativa com as demais lojas antes de concluir a analise.`;
  }
  if ((q.includes("produto") || q.includes("maior")) && topProduct) {
    return `O produto de maior impacto e ${topProduct.produto}, em ${topProduct.loja}/${topProduct.setor}, com ${brl(topProduct.valor_atual)}. Trate isso como evidencia financeira e valide giro, compra, descarte e classificacao do motivo ${topProduct.motivo_principal}.`;
  }
  return `No periodo ${payload.periodo}, o fechamento analisado soma ${brl(ind.perda_total)} e apresenta ${direction} de ${num(Math.abs(ind.variacao_percentual))}% contra o periodo anterior. Priorize ${topSector?.sector || "setores com maior perda"}, revise ${ind.itens_sem_motivo} item(ns) sem motivo e confirme as hipoteses com a equipe antes de qualquer decisao operacional.`;
}

export async function askAiAssistant(question, filters = {}, items = [], history = []) {
  const payload = buildAnalyticsPayload(items, filters);
  const client = getSupabaseClient();
  const { data } = await client.auth.getSession().catch(() => ({ data: null }));
  const token = data?.session?.access_token;

  if (token) {
    try {
      const response = await fetch("/api/assistente-ia", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...payload, question, history })
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok && body.answer) return { answer: body.answer, payload, source: "server" };
      if (response.status === 401) throw new Error(body.error || "Sessao expirada.");
      console.warn("IA server indisponivel, usando resposta local:", body.error || response.status);
    } catch (error) {
      if (/sess/i.test(error.message)) throw error;
      console.warn("Falha ao chamar IA server, usando resposta local:", error);
    }
  }

  return { answer: localAnswer(question, payload), payload, source: "local" };
}
