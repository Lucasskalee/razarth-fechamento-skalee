import { getSupabaseClient } from "../config/supabase.js";
import { brl, num, normalizeReason, SECTOR_OPTIONS } from "./classificacao.js?v=20260428-2";

const SUPABASE_PAGE_SIZE = 1000;

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const MONTH_MAP = {
  "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril",
  "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto",
  "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro"
};

/**
 * Normaliza um texto para busca/comparação simples
 */
function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

/**
 * Busca itens reais de perdas/uso com paginação segura pelo Supabase
 */
export async function fetchClosingItems(filters = {}) {
  const client = getSupabaseClient();
  const year = Number(filters.year || new Date().getFullYear());
  const fromDate = `${year - 1}-01-01T00:00:00.000Z`;
  const toDate = `${year + 1}-01-01T00:00:00.000Z`;

  const rows = [];
  let from = 0;

  while (true) {
    const to = from + SUPABASE_PAGE_SIZE - 1;
    let query = client
      .from("loss_items")
      .select("id, note_key, invoice, store, emission_date, emission_month, competence_month, operation, type, display_type, sector, product, quantity, unit_value, value, reason")
      .gte("emission_date", fromDate)
      .lt("emission_date", toDate);

    if (filters.store && filters.store !== "TODAS") query = query.eq("store", filters.store);
    if (filters.sector && filters.sector !== "TODOS") query = query.eq("sector", filters.sector);
    if (filters.type && filters.type !== "TODOS") query = query.eq("type", filters.type);
    if (filters.reason && filters.reason !== "TODOS") {
      query = filters.reason === "Sem motivo" ? query.eq("reason", "") : query.eq("reason", filters.reason);
    }

    const { data, error } = await query
      .order("emission_date", { ascending: true })
      .range(from, to);

    if (error) {
      console.warn("Falha ao consultar loss_items no Supabase:", error);
      break;
    }

    const pageRows = data || [];
    rows.push(...pageRows);
    if (pageRows.length < SUPABASE_PAGE_SIZE) break;
    from += SUPABASE_PAGE_SIZE;
  }

  return rows.map((row) => {
    const emissionDate = row.emission_date ? new Date(row.emission_date) : null;
    const itemMonth = emissionDate ? emissionDate.getUTCMonth() + 1 : (Number(String(row.emission_month || "").slice(5, 7)) || 1);
    const itemYear = emissionDate ? emissionDate.getUTCFullYear() : (Number(String(row.emission_month || "").slice(0, 4)) || year);

    return {
      id: row.id,
      noteKey: row.note_key,
      invoice: row.invoice || "-",
      store: row.store || "Loja Geral",
      date: row.emission_date || "",
      year: itemYear,
      month: itemMonth,
      monthName: MONTH_NAMES[itemMonth - 1] || "Mês " + itemMonth,
      emissionMonth: row.emission_month || "",
      competenceMonth: row.competence_month || "",
      operation: row.operation || "",
      type: row.type || "perdas_saidas",
      displayType: row.display_type || row.type || "Perdas",
      sector: row.sector || "Não classificado",
      product: row.product || "Produto",
      quantity: Number(row.quantity || 0),
      unitValue: Number(row.unit_value || 0),
      value: Number(row.value || 0),
      reason: normalizeReason(row.reason || "") || "Sem motivo"
    };
  });
}

/**
 * Filtra a lista de itens conforme os filtros ativos em memória
 */
export function filterItems(items = [], filters = {}) {
  const targetYear = Number(filters.year || new Date().getFullYear());
  const targetMonth = filters.month && filters.month !== "TODOS" ? Number(filters.month) : null;

  return items.filter((item) => {
    if (item.year !== targetYear) return false;
    if (targetMonth !== null && item.month !== targetMonth) return false;
    if (filters.store && filters.store !== "TODAS" && item.store !== filters.store) return false;
    if (filters.sector && filters.sector !== "TODOS" && item.sector !== filters.sector) return false;
    if (filters.type && filters.type !== "TODOS" && item.type !== filters.type) return false;
    if (filters.reason && filters.reason !== "TODOS" && item.reason !== filters.reason) return false;
    return true;
  });
}

/**
 * 1. Resumo mensal de perdas e volume
 */
export function getMonthlyLossSummary(items = [], filters = {}) {
  const filtered = filterItems(items, filters);
  const totalValue = filtered.reduce((acc, item) => acc + item.value, 0);
  const totalQuantity = filtered.reduce((acc, item) => acc + item.quantity, 0);
  const totalItems = filtered.length;
  const uniqueNotes = new Set(filtered.map((item) => item.noteKey)).size;

  const unclassified = filtered.filter((item) => item.reason === "Sem motivo");
  const unclassifiedValue = unclassified.reduce((acc, item) => acc + item.value, 0);

  return {
    totalValue,
    totalQuantity,
    totalItems,
    uniqueNotes,
    unclassifiedCount: unclassified.length,
    unclassifiedValue,
    unclassifiedPercent: totalValue > 0 ? (unclassifiedValue / totalValue) * 100 : 0
  };
}

/**
 * 2. Perdas agrupadas por setor
 */
export function getLossBySector(items = [], filters = {}) {
  const filtered = filterItems(items, filters);
  const sectorMap = new Map();

  filtered.forEach((item) => {
    const key = item.sector || "Não classificado";
    const current = sectorMap.get(key) || { sector: key, value: 0, quantity: 0, items: 0, reasons: new Map() };
    current.value += item.value;
    current.quantity += item.quantity;
    current.items += 1;
    current.reasons.set(item.reason, (current.reasons.get(item.reason) || 0) + item.value);
    sectorMap.set(key, current);
  });

  const total = [...sectorMap.values()].reduce((acc, s) => acc + s.value, 0);

  return [...sectorMap.values()]
    .map((s) => {
      const topReason = [...s.reasons.entries()].sort((a, b) => b[1] - a[1])[0];
      return {
        sector: s.sector,
        value: s.value,
        quantity: s.quantity,
        items: s.items,
        percent: total > 0 ? (s.value / total) * 100 : 0,
        mainReason: topReason ? topReason[0] : "Sem motivo"
      };
    })
    .sort((a, b) => b.value - a.value);
}

/**
 * 3. Perdas agrupadas por loja
 */
export function getLossByStore(items = [], filters = {}) {
  const filtered = filterItems(items, filters);
  const storeMap = new Map();

  filtered.forEach((item) => {
    const key = item.store || "Loja Geral";
    const current = storeMap.get(key) || { store: key, value: 0, quantity: 0, items: 0, sectors: new Map() };
    current.value += item.value;
    current.quantity += item.quantity;
    current.items += 1;
    current.sectors.set(item.sector, (current.sectors.get(item.sector) || 0) + item.value);
    storeMap.set(key, current);
  });

  const total = [...storeMap.values()].reduce((acc, s) => acc + s.value, 0);

  return [...storeMap.values()]
    .map((s) => {
      const topSector = [...s.sectors.entries()].sort((a, b) => b[1] - a[1])[0];
      return {
        store: s.store,
        value: s.value,
        quantity: s.quantity,
        items: s.items,
        percent: total > 0 ? (s.value / total) * 100 : 0,
        mainSector: topSector ? topSector[0] : "Geral"
      };
    })
    .sort((a, b) => b.value - a.value);
}

/**
 * 4. Perdas agrupadas por motivo / justificativa
 */
export function getLossByReason(items = [], filters = {}) {
  const filtered = filterItems(items, filters);
  const reasonMap = new Map();

  filtered.forEach((item) => {
    const key = item.reason || "Sem motivo";
    const current = reasonMap.get(key) || { reason: key, value: 0, quantity: 0, items: 0 };
    current.value += item.value;
    current.quantity += item.quantity;
    current.items += 1;
    reasonMap.set(key, current);
  });

  const total = [...reasonMap.values()].reduce((acc, r) => acc + r.value, 0);

  return [...reasonMap.values()]
    .map((r) => ({
      reason: r.reason,
      value: r.value,
      quantity: r.quantity,
      items: r.items,
      percent: total > 0 ? (r.value / total) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * 5. Comparativo entre períodos (Mês atual vs Mês anterior)
 */
export function compareMonths(items = [], filters = {}) {
  const currentYear = Number(filters.year || new Date().getFullYear());
  const currentMonth = filters.month && filters.month !== "TODOS" ? Number(filters.month) : (new Date().getMonth() + 1);

  let prevYear = currentYear;
  let prevMonth = currentMonth - 1;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }

  const currentFilters = { ...filters, year: currentYear, month: currentMonth };
  const prevFilters = { ...filters, year: prevYear, month: prevMonth };

  const currentItems = filterItems(items, currentFilters);
  const prevItems = filterItems(items, prevFilters);

  const currentTotal = currentItems.reduce((acc, i) => acc + i.value, 0);
  const previousTotal = prevItems.reduce((acc, i) => acc + i.value, 0);

  const currentQuantity = currentItems.reduce((acc, i) => acc + i.quantity, 0);
  const previousQuantity = prevItems.reduce((acc, i) => acc + i.quantity, 0);

  const diffValue = currentTotal - previousTotal;
  const pctVariation = previousTotal > 0 ? ((diffValue) / previousTotal) * 100 : (currentTotal > 0 ? 100 : 0);

  return {
    currentPeriod: { year: currentYear, month: currentMonth, monthName: MONTH_NAMES[currentMonth - 1] },
    previousPeriod: { year: prevYear, month: prevMonth, monthName: MONTH_NAMES[prevMonth - 1] },
    currentTotal,
    previousTotal,
    currentQuantity,
    previousQuantity,
    diffValue,
    pctVariation,
    trend: diffValue > 0 ? "aumento" : (diffValue < 0 ? "reducao" : "estavel"),
    currentItemsCount: currentItems.length,
    prevItemsCount: prevItems.length
  };
}

/**
 * 6. Ranking de produtos com maior impacto ou variação
 */
export function getTopLossProducts(items = [], filters = {}, limit = 15) {
  const currentYear = Number(filters.year || new Date().getFullYear());
  const currentMonth = filters.month && filters.month !== "TODOS" ? Number(filters.month) : (new Date().getMonth() + 1);

  let prevYear = currentYear;
  let prevMonth = currentMonth - 1;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }

  const currentFiltered = filterItems(items, { ...filters, year: currentYear, month: currentMonth });
  const prevFiltered = filterItems(items, { ...filters, year: prevYear, month: prevMonth });

  const currentMap = new Map();
  currentFiltered.forEach((item) => {
    const key = `${item.product}|${item.store}|${item.sector}`;
    const curr = currentMap.get(key) || {
      product: item.product,
      store: item.store,
      sector: item.sector,
      currentValue: 0,
      currentQuantity: 0,
      reasons: new Map()
    };
    curr.currentValue += item.value;
    curr.currentQuantity += item.quantity;
    curr.reasons.set(item.reason, (curr.reasons.get(item.reason) || 0) + item.value);
    currentMap.set(key, curr);
  });

  const prevMap = new Map();
  prevFiltered.forEach((item) => {
    const key = `${item.product}|${item.store}|${item.sector}`;
    const curr = prevMap.get(key) || { previousValue: 0, previousQuantity: 0 };
    curr.previousValue += item.value;
    curr.previousQuantity += item.quantity;
    prevMap.set(key, curr);
  });

  const allKeys = new Set([...currentMap.keys(), ...prevMap.keys()]);
  const rows = [];

  allKeys.forEach((key) => {
    const c = currentMap.get(key) || {
      product: key.split("|")[0],
      store: key.split("|")[1],
      sector: key.split("|")[2],
      currentValue: 0,
      currentQuantity: 0,
      reasons: new Map()
    };
    const p = prevMap.get(key) || { previousValue: 0, previousQuantity: 0 };

    const currentValue = c.currentValue;
    const previousValue = p.previousValue;
    const valueVariation = currentValue - previousValue;
    const pctVariation = previousValue > 0 ? (valueVariation / previousValue) * 100 : (currentValue > 0 ? 100 : 0);

    const currentQty = c.currentQuantity;
    const prevQty = p.previousQuantity;
    const currentPrice = currentQty > 0 ? currentValue / currentQty : 0;
    const previousPrice = prevQty > 0 ? previousValue / prevQty : 0;

    const topReason = [...c.reasons.entries()].sort((a, b) => b[1] - a[1])[0];

    rows.push({
      key,
      product: c.product,
      store: c.store,
      sector: c.sector,
      currentValue,
      previousValue,
      valueVariation,
      pctVariation,
      currentQuantity: currentQty,
      previousQuantity: prevQty,
      currentPrice,
      previousPrice,
      mainReason: topReason ? topReason[0] : "Sem motivo",
      status: valueVariation > 1 ? "aumentou" : (valueVariation < -1 ? "reduziu" : "estavel")
    });
  });

  return rows.sort((a, b) => b.currentValue - a.currentValue).slice(0, limit);
}

/**
 * 7. Detecção de Anomalias e Insights automáticos
 */
export function detectAnomaliesAndInsights(items = [], filters = {}) {
  const comparison = compareMonths(items, filters);
  const sectors = getLossBySector(items, filters);
  const stores = getLossByStore(items, filters);
  const reasons = getLossByReason(items, filters);
  const topProducts = getTopLossProducts(items, filters, 10);
  const summary = getMonthlyLossSummary(items, filters);

  const insights = [];

  // 1. Variação geral do mês
  if (Math.abs(comparison.pctVariation) > 5) {
    const isIncrease = comparison.diffValue > 0;
    insights.push({
      type: isIncrease ? "warning" : "success",
      tag: "Evolução Geral",
      title: isIncrease
        ? `Perdas totais aumentaram ${num(comparison.pctVariation)}% no período`
        : `Perdas totais reduziram ${num(Math.abs(comparison.pctVariation))}% no período`,
      description: `Volume financeiro passou de ${brl(comparison.previousTotal)} para ${brl(comparison.currentTotal)} (variação de ${brl(comparison.diffValue)}).`,
      actionPrompt: `Explique detalhadamente por que as perdas ${isIncrease ? "aumentaram" : "reduziram"} ${num(Math.abs(comparison.pctVariation))}% este mês.`
    });
  }

  // 2. Setor mais crítico / com maior perda
  if (sectors.length > 0) {
    const topSector = sectors[0];
    if (topSector.percent >= 25) {
      insights.push({
        type: "danger",
        tag: "Concentração Setorial",
        title: `${topSector.sector} concentra ${num(topSector.percent)}% das perdas`,
        description: `Total de ${brl(topSector.value)} acumulado no setor. Principal motivo apontado: ${topSector.mainReason}.`,
        actionPrompt: `Analise as perdas do setor ${topSector.sector} e aponte ações práticas para redução.`
      });
    }
  }

  // 3. Loja com maior volume ou desvio
  if (stores.length > 1) {
    const topStore = stores[0];
    const avgStoreLoss = stores.reduce((acc, s) => acc + s.value, 0) / stores.length;
    if (topStore.value > avgStoreLoss * 1.3) {
      insights.push({
        type: "warning",
        tag: "Desvio por Loja",
        title: `${topStore.store} está ${num(((topStore.value - avgStoreLoss) / avgStoreLoss) * 100)}% acima da média`,
        description: `A loja registrou ${brl(topStore.value)}, com maior concentração no setor ${topStore.mainSector}.`,
        actionPrompt: `Compare a ${topStore.store} com as demais lojas e identifique onde estão os maiores desvios.`
      });
    }
  }

  // 4. Motivo / Justificativa com forte impacto
  if (reasons.length > 0) {
    const topReason = reasons[0];
    if (topReason.reason !== "Sem motivo" && topReason.percent >= 20) {
      insights.push({
        type: "info",
        tag: "Motivo Dominante",
        title: `Justificativa '${topReason.reason}' lidera com ${num(topReason.percent)}%`,
        description: `Impacto financeiro de ${brl(topReason.value)} distribuído em ${topReason.items} ocorrências.`,
        actionPrompt: `O que está impulsionando as perdas por ${topReason.reason} e como controlar?`
      });
    }
  }

  // 5. Itens sem classificação / motivo pendente
  if (summary.unclassifiedCount > 0) {
    insights.push({
      type: "warning",
      tag: "Pendência Operacional",
      title: `${summary.unclassifiedCount} itens sem justificativa registrada`,
      description: `${brl(summary.unclassifiedValue)} em perdas (${num(summary.unclassifiedPercent)}% do total) ainda não possuem motivo classificado.`,
      actionPrompt: `Quais lojas e setores concentram os itens sem motivo e qual a auditoria necessária?`
    });
  }

  // 6. Produto com maior aumento de perda
  const highestIncrease = topProducts.filter((p) => p.valueVariation > 0).sort((a, b) => b.valueVariation - a.valueVariation)[0];
  if (highestIncrease && highestIncrease.valueVariation > 500) {
    insights.push({
      type: "danger",
      tag: "Alerta de Produto",
      title: `${highestIncrease.product} teve aumento de ${brl(highestIncrease.valueVariation)}`,
      description: `Perda no setor ${highestIncrease.sector} (${highestIncrease.store}) subiu ${num(highestIncrease.pctVariation)}% contra o mês anterior.`,
      actionPrompt: `Investigue por que a perda de ${highestIncrease.product} na ${highestIncrease.store} subiu tanto.`
    });
  }

  return insights;
}

/**
 * 8. Gerador de Resumo Executivo estruturado para reuniões
 */
export function generateExecutiveSummary(items = [], filters = {}) {
  const comparison = compareMonths(items, filters);
  const sectors = getLossBySector(items, filters);
  const stores = getLossByStore(items, filters);
  const reasons = getLossByReason(items, filters);
  const topProducts = getTopLossProducts(items, filters, 5);
  const summary = getMonthlyLossSummary(items, filters);

  const monthLabel = comparison.currentPeriod.monthName;
  const year = comparison.currentPeriod.year;
  const prevMonthLabel = comparison.previousPeriod.monthName;

  const topSector = sectors[0] || { sector: "Geral", value: 0, percent: 0 };
  const topStore = stores[0] || { store: "Geral", value: 0, percent: 0 };
  const topReason = reasons[0] || { reason: "Geral", value: 0, percent: 0 };

  const isIncrease = comparison.diffValue >= 0;
  const variationText = isIncrease
    ? `aumento de ${num(comparison.pctVariation)}% (+${brl(comparison.diffValue)})`
    : `redução de ${num(Math.abs(comparison.pctVariation))}% (-${brl(Math.abs(comparison.diffValue))})`;

  return {
    periodo: `${monthLabel} de ${year}`,
    resumoTexto: `Em ${monthLabel}/${year}, as perdas registradas somaram ${brl(comparison.currentTotal)}, representando um ${variationText} em relação a ${prevMonthLabel}. O principal impacto setorial ocorreu no setor ${topSector.sector} (${brl(topSector.value)}, correspondendo a ${num(topSector.percent)}% do volume consolidado). A loja com maior impacto financeiro foi a ${topStore.store} (${brl(topStore.value)}). A classificação de maior relevância foi "${topReason.reason}" (${brl(topReason.value)}). Há ${summary.unclassifiedCount} itens sem justificativa (${brl(summary.unclassifiedValue)}), o que requer auditoria operacional prioritária.`,
    metricas: [
      { label: "Perda Total Atual", value: brl(comparison.currentTotal), comp: `${monthLabel}/${year}` },
      { label: "Mês Anterior", value: brl(comparison.previousTotal), comp: `${prevMonthLabel}` },
      { label: "Variação R$", value: brl(comparison.diffValue), comp: isIncrease ? "Aumento" : "Redução" },
      { label: "Variação %", value: `${num(comparison.pctVariation)}%`, comp: "vs mês anterior" },
      { label: "Maior Setor", value: topSector.sector, comp: `${num(topSector.percent)}% do total` },
      { label: "Maior Loja", value: topStore.store, comp: brl(topStore.value) }
    ],
    setoresCriticos: sectors.slice(0, 3),
    produtosEmDestaque: topProducts.slice(0, 5),
    acoesPrioritarias: [
      `Realizar reunião de alinhamento com a liderança do setor ${topSector.sector} focando nas causas de ${topSector.mainReason || topReason.reason}.`,
      `Auditar e justificar os ${summary.unclassifiedCount} itens pendentes de classificação no sistema.`,
      `Acompanhar os produtos do topo do ranking (${topProducts.slice(0, 2).map((p) => p.product).join(", ")}) com auditoria de conferência e rendimento.`,
      `Validar se as perdas da ${topStore.store} decorrem de erros de processo, vencimento ou avarias no transporte.`
    ]
  };
}
