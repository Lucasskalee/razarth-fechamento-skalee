import { brl, normalizeReason, num } from "./classificacao.js";
import { getSupabaseClient } from "../config/supabase.js";

const PAGE_SIZE = 1000;

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export async function fetchClosingItems(filters = {}) {
  const client = getSupabaseClient();
  const year = Number(filters.year || new Date().getFullYear());
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    let query = client
      .from("loss_items")
      .select("id, note_key, invoice, store, emission_date, emission_month, competence_month, operation, type, display_type, sector, product, quantity, unit_value, value, reason")
      .gte("emission_date", `${year - 1}-01-01T00:00:00.000Z`)
      .lt("emission_date", `${year + 1}-01-01T00:00:00.000Z`);

    if (filters.store && filters.store !== "TODAS") query = query.eq("store", filters.store);
    if (filters.sector && filters.sector !== "TODOS") query = query.eq("sector", filters.sector);
    if (filters.type && filters.type !== "TODOS") query = query.eq("type", filters.type);

    const { data, error } = await query.order("emission_date", { ascending: true }).range(from, to);
    if (error) throw new Error(error.message || "Falha ao consultar itens de fechamento.");
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows.map((row) => {
    const emissionDate = row.emission_date ? new Date(row.emission_date) : null;
    const month = emissionDate ? emissionDate.getUTCMonth() + 1 : (Number(String(row.emission_month || "").slice(5, 7)) || 1);
    const itemYear = emissionDate ? emissionDate.getUTCFullYear() : (Number(String(row.emission_month || "").slice(0, 4)) || year);
    return {
      id: row.id,
      noteKey: row.note_key,
      invoice: row.invoice || "-",
      store: row.store || "Loja Geral",
      date: row.emission_date || "",
      year: itemYear,
      month,
      type: row.type || "perdas_saidas",
      displayType: row.display_type || row.type || "Perdas",
      sector: row.sector || "Nao classificado",
      product: row.product || "Produto",
      quantity: Number(row.quantity || 0),
      unitValue: Number(row.unit_value || 0),
      value: Number(row.value || 0),
      reason: normalizeReason(row.reason || "") || "Sem motivo"
    };
  });
}

export function filterItems(items = [], filters = {}) {
  const year = Number(filters.year || new Date().getFullYear());
  const month = filters.month && filters.month !== "TODOS" ? Number(filters.month) : null;
  return items.filter((item) => {
    if (item.year !== year) return false;
    if (month !== null && item.month !== month) return false;
    if (filters.store && filters.store !== "TODAS" && item.store !== filters.store) return false;
    if (filters.sector && filters.sector !== "TODOS" && item.sector !== filters.sector) return false;
    if (filters.type && filters.type !== "TODOS" && item.type !== filters.type) return false;
    if (filters.reason && filters.reason !== "TODOS" && item.reason !== filters.reason) return false;
    return true;
  });
}

function groupBy(items, keyGetter) {
  const map = new Map();
  items.forEach((item) => {
    const key = keyGetter(item) || "Geral";
    const current = map.get(key) || { key, value: 0, quantity: 0, items: 0, children: new Map() };
    current.value += item.value;
    current.quantity += item.quantity;
    current.items += 1;
    current.children.set(item.reason || item.sector || "Geral", (current.children.get(item.reason || item.sector || "Geral") || 0) + item.value);
    map.set(key, current);
  });
  const total = [...map.values()].reduce((acc, row) => acc + row.value, 0);
  return [...map.values()].map((row) => ({ ...row, percent: total ? (row.value / total) * 100 : 0 })).sort((a, b) => b.value - a.value);
}

export function getMonthlyLossSummary(items = [], filters = {}) {
  const filtered = filterItems(items, filters);
  const totalValue = filtered.reduce((acc, item) => acc + item.value, 0);
  const unclassified = filtered.filter((item) => item.reason === "Sem motivo");
  return {
    totalValue,
    totalQuantity: filtered.reduce((acc, item) => acc + item.quantity, 0),
    totalItems: filtered.length,
    uniqueNotes: new Set(filtered.map((item) => item.noteKey)).size,
    unclassifiedCount: unclassified.length,
    unclassifiedValue: unclassified.reduce((acc, item) => acc + item.value, 0),
    unclassifiedPercent: totalValue ? (unclassified.reduce((acc, item) => acc + item.value, 0) / totalValue) * 100 : 0
  };
}

export function getLossBySector(items = [], filters = {}) {
  return groupBy(filterItems(items, filters), (item) => item.sector).map((row) => {
    const topReason = [...row.children.entries()].sort((a, b) => b[1] - a[1])[0];
    return { sector: row.key, value: row.value, quantity: row.quantity, items: row.items, percent: row.percent, mainReason: topReason?.[0] || "Sem motivo" };
  });
}

export function getLossByStore(items = [], filters = {}) {
  const filtered = filterItems(items, filters);
  const storeMap = new Map();
  filtered.forEach((item) => {
    const current = storeMap.get(item.store) || { store: item.store, value: 0, quantity: 0, items: 0, sectors: new Map() };
    current.value += item.value;
    current.quantity += item.quantity;
    current.items += 1;
    current.sectors.set(item.sector, (current.sectors.get(item.sector) || 0) + item.value);
    storeMap.set(item.store, current);
  });
  const total = [...storeMap.values()].reduce((acc, row) => acc + row.value, 0);
  return [...storeMap.values()].map((row) => {
    const topSector = [...row.sectors.entries()].sort((a, b) => b[1] - a[1])[0];
    return { ...row, percent: total ? (row.value / total) * 100 : 0, mainSector: topSector?.[0] || "Geral" };
  }).sort((a, b) => b.value - a.value);
}

export function getLossByReason(items = [], filters = {}) {
  return groupBy(filterItems(items, filters), (item) => item.reason).map((row) => ({
    reason: row.key,
    value: row.value,
    quantity: row.quantity,
    items: row.items,
    percent: row.percent
  }));
}

export function compareMonths(items = [], filters = {}) {
  const currentYear = Number(filters.year || new Date().getFullYear());
  const currentMonth = filters.month && filters.month !== "TODOS" ? Number(filters.month) : (new Date().getMonth() + 1);
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const currentItems = filterItems(items, { ...filters, year: currentYear, month: currentMonth });
  const previousItems = filterItems(items, { ...filters, year: prevYear, month: prevMonth });
  const currentTotal = currentItems.reduce((acc, item) => acc + item.value, 0);
  const previousTotal = previousItems.reduce((acc, item) => acc + item.value, 0);
  const diffValue = currentTotal - previousTotal;
  return {
    currentTotal,
    previousTotal,
    diffValue,
    pctVariation: previousTotal ? (diffValue / previousTotal) * 100 : (currentTotal ? 100 : 0),
    currentPeriod: { year: currentYear, month: currentMonth, monthName: MONTH_NAMES[currentMonth - 1] },
    previousPeriod: { year: prevYear, month: prevMonth, monthName: MONTH_NAMES[prevMonth - 1] }
  };
}

export function getTopLossProducts(items = [], filters = {}, limit = 10) {
  const current = filterItems(items, filters);
  const map = new Map();
  current.forEach((item) => {
    const key = `${item.product}|${item.store}|${item.sector}`;
    const row = map.get(key) || { product: item.product, store: item.store, sector: item.sector, currentValue: 0, currentQuantity: 0, reasons: new Map() };
    row.currentValue += item.value;
    row.currentQuantity += item.quantity;
    row.reasons.set(item.reason, (row.reasons.get(item.reason) || 0) + item.value);
    map.set(key, row);
  });
  return [...map.values()].map((row) => {
    const topReason = [...row.reasons.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      produto: row.product,
      loja: row.store,
      setor: row.sector,
      valor_atual: row.currentValue,
      quantidade_atual: row.currentQuantity,
      preco_medio_atual: row.currentQuantity ? row.currentValue / row.currentQuantity : 0,
      motivo_principal: topReason?.[0] || "Sem motivo"
    };
  }).sort((a, b) => b.valor_atual - a.valor_atual).slice(0, limit);
}

export function detectAnomaliesAndInsights(items = [], filters = {}) {
  const comparison = compareMonths(items, filters);
  const sectors = getLossBySector(items, filters);
  const stores = getLossByStore(items, filters);
  const summary = getMonthlyLossSummary(items, filters);
  const insights = [];
  if (Math.abs(comparison.pctVariation) > 5) {
    insights.push(`${comparison.diffValue >= 0 ? "Alta" : "Reducao"} de ${num(Math.abs(comparison.pctVariation))}% contra o mes anterior (${brl(Math.abs(comparison.diffValue))}).`);
  }
  if (sectors[0]) insights.push(`${sectors[0].sector} concentra ${num(sectors[0].percent)}% do valor analisado.`);
  if (stores[0]) insights.push(`${stores[0].store} lidera o impacto financeiro com ${brl(stores[0].value)}.`);
  if (summary.unclassifiedCount) insights.push(`${summary.unclassifiedCount} itens sem motivo somam ${brl(summary.unclassifiedValue)}.`);
  return insights.slice(0, 4);
}

export function buildAnalyticsPayload(items = [], filters = {}) {
  const comparison = compareMonths(items, filters);
  const currentMonth = filters.month && filters.month !== "TODOS" ? Number(filters.month) : comparison.currentPeriod.month;
  const currentYear = Number(filters.year || new Date().getFullYear());
  const summary = getMonthlyLossSummary(items, filters);
  return {
    periodo: `${MONTH_NAMES[currentMonth - 1] || "Mes"} de ${currentYear}`,
    filtros: {
      empresa: "Razarth Supermercados",
      store: filters.store || "TODAS",
      sector: filters.sector || "TODOS",
      month: currentMonth,
      year: currentYear,
      type: filters.type || "TODOS",
      reason: filters.reason || "TODOS"
    },
    indicadores: {
      perda_total: comparison.currentTotal,
      perda_mes_anterior: comparison.previousTotal,
      variacao_valor: comparison.diffValue,
      variacao_percentual: comparison.pctVariation,
      itens_analisados: summary.totalItems,
      itens_sem_motivo: summary.unclassifiedCount,
      valor_sem_motivo: summary.unclassifiedValue
    },
    lojas: getLossByStore(items, filters).slice(0, 10),
    setores: getLossBySector(items, filters).slice(0, 10),
    motivos: getLossByReason(items, filters).slice(0, 8),
    produtos: getTopLossProducts(items, filters, 10)
  };
}
