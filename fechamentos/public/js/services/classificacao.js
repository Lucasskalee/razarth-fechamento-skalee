export const REASONS = [
  "Vencimento",
  "Avaria",
  "Quebra",
  "Corte",
  "Lavagem",
  "Manipulação",
  "Furto",
  "Uso/Consumo",
  "Perdas Pagas",
  "Saída de um para outro",
  "Degustação",
  "Outros"
];

export const SECTOR_OPTIONS = [
  "Açougue",
  "FLV",
  "Padaria",
  "Produção Padaria",
  "Bebidas",
  "Furto",
  "Perdas Pagas",
  "Saída de um para outro",
  "Loja/Depósito",
  "Frios e Congelados",
  "Mercearia",
  "Hortifruti",
  "Administrativo",
  "Frente de Caixa",
  "Fatiacao",
  "Não classificado"
];

export const REASON_COLORS = {
  Vencimento: "#0f766e",
  Avaria: "#dc2626",
  Quebra: "#f97316",
  Corte: "#7c3aed",
  Lavagem: "#06b6d4",
  Manipulação: "#16a34a",
  Furto: "#b91c1c",
  "Uso/Consumo": "#2563eb",
  "Perdas Pagas": "#92400e",
  "Saída de um para outro": "#475569",
  Degustação: "#9a3412",
  Outros: "#f59e0b",
  "Sem motivo": "#94a3b8"
};

export function brl(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

export function num(value) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(Number(value || 0));
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function normalizeReason(reason) {
  if (reason === "Uso" || reason === "Consumo") return "Uso/Consumo";
  return reason || "";
}

export function safeStore(name) {
  return name ? name.replace(/SUPERMERCADO\s*/i, "").trim() : "Loja não identificada";
}

export function monthKey(dateStr) {
  if (!dateStr) return "Sem data";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Sem data";
  return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toLowerCase() + `/${date.getFullYear()}`;
}

export function competenceKey(dateStr) {
  if (!dateStr) return "Sem data";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Sem data";
  const competenceDate = new Date(date);
  competenceDate.setMonth(competenceDate.getMonth() - 1);
  return competenceDate.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toLowerCase() + `/${competenceDate.getFullYear()}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("pt-BR");
}

export function classifyType(operation) {
  const normalized = String(operation || "").toUpperCase();
  if (normalized.includes("USO") || normalized.includes("CONSUMO")) return "Uso/Consumo";
  if (normalized.includes("SAIDA") || normalized.includes("SAÍDA")) return "Saída entre lojas";
  if (normalized.includes("PERDA")) return "Perdas";
  return "Outros";
}

export function detailType(type, sector) {
  if (type === "Uso/Consumo" && sector && sector !== "Não classificado") return `Uso/Consumo ${sector}`;
  return type;
}

export function classifySector(operation, product) {
  const text = `${operation || ""} ${product || ""}`.toUpperCase();
  if (text.includes("ACOUGUE") || text.includes("AÇOUGUE")) return "Açougue";
  if (text.includes("FLV")) return "FLV";
  if (text.includes("PRODUCAO PADARIA") || text.includes("PRODUÇÃO PADARIA")) return "Produção Padaria";
  if (text.includes("PADARIA")) return "Padaria";
  if (text.includes("BEBIDAS")) return "Bebidas";
  if (text.includes("FURTO")) return "Furto";
  if (text.includes("PAGAS")) return "Perdas Pagas";
  if (text.includes("SAIDA DE UM PARA OUTRO") || text.includes("SAÍDA DE UM PARA OUTRO") || text.includes("SAIDA DE UM PRODUTO PARA OUTRO") || text.includes("SAÍDA DE UM PRODUTO PARA OUTRO")) return "Saída de um para outro";
  if (text.includes("FRIOS") || text.includes("CONGELADOS")) return "Frios e Congelados";
  if (text.includes("MERCEARIA")) return "Mercearia";
  if (text.includes("HORTIFRUTI")) return "Hortifruti";
  if (text.includes("ADMINISTRATIVO")) return "Administrativo";
  if (text.includes("FRENTE DE CAIXA")) return "Frente de Caixa";
  if (text.includes("FATIACAO") || text.includes("FATIAÇÃO")) return "Fatiacao";
  if (text.includes("LOJA") || text.includes("DEPOSITO") || text.includes("DEPÓSITO")) return "Loja/Depósito";
  return "Não classificado";
}

export function sortLabels(values) {
  return [...values].sort((a, b) => String(a).localeCompare(String(b), "pt-BR", { numeric: true }));
}

export function groupItemsByNote(items, noteRows = []) {
  const noteMap = new Map();

  noteRows.forEach((note) => {
    if (!note?.noteKey) return;
    noteMap.set(note.noteKey, {
      key: note.noteKey,
      accessKey: note.accessKey || "",
      invoice: note.invoice || "-",
      store: note.store || "Loja nao identificada",
      date: note.date || "",
      emissionMonth: note.emissionMonth || monthKey(note.date),
      competenceMonth: note.competenceMonth || competenceKey(note.date),
      type: note.type || "Outros",
      displayType: note.displayType || detailType(note.type, note.sector),
      sector: note.sector || "Nao classificado",
      operation: note.operation || "",
      totalValue: 0,
      itemCount: 0,
      items: []
    });
  });

  items.forEach((item) => {
    if (!noteMap.has(item.noteKey)) {
      noteMap.set(item.noteKey, {
        key: item.noteKey,
        accessKey: item.accessKey || "",
        invoice: item.invoice,
        store: item.store,
        date: item.date,
        emissionMonth: item.emissionMonth,
        competenceMonth: item.competenceMonth,
        type: item.type,
        displayType: item.displayType,
        sector: item.sector,
        operation: item.operation,
        totalValue: Number(item.value || 0),
        itemCount: 0,
        items: []
      });
    }
    const note = noteMap.get(item.noteKey);
    note.items.push(item);
    note.totalValue += Number(item.value || 0);
    note.itemCount += 1;
    if (!note.invoice && item.invoice) note.invoice = item.invoice;
    if (!note.store && item.store) note.store = item.store;
    if (!note.date && item.date) note.date = item.date;
    if (!note.emissionMonth && item.emissionMonth) note.emissionMonth = item.emissionMonth;
    if (!note.competenceMonth && item.competenceMonth) note.competenceMonth = item.competenceMonth;
    if (!note.type && item.type) note.type = item.type;
    if (!note.displayType && item.displayType) note.displayType = item.displayType;
    if (!note.sector && item.sector) note.sector = item.sector;
    if (!note.operation && item.operation) note.operation = item.operation;
  });
  return [...noteMap.values()].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}
