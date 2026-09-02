import { SECTOR_OPTIONS, brl, escapeHtml, formatDate, num, sortLabels } from "./services/classificacao.js?v=20260428-2";
import {
  MONTHS,
  STATUS_META,
  classifyClosingType,
  clearFechamentoCache,
  fetchCellNotes,
  fetchGrid,
  fetchManagerialItems,
  fetchNoteItems,
  invalidateCellCache,
  normalizeClosingSector,
  saveEntryAudit,
  saveItemReason,
  saveItemReasons,
  saveNoteAudit
} from "./services/fechamento.js?v=20260511-3";
import { ensureAuthenticated } from "./services/auth.js?v=20260820-1";
import { requestClosingAnalysis, requestClosingChat } from "./services/analiseIa.js?v=20260820-2";
import { getRealtimeImpact, subscribeRealtime } from "./services/realtime.js?v=20260825-1";

const refs = {
  storeFilter: document.getElementById("storeFilter"),
  yearFilter: document.getElementById("yearFilter"),
  typeFilter: document.getElementById("typeFilter"),
  statusFilter: document.getElementById("statusFilter"),
  quickStoreFilter: document.getElementById("quickStoreFilter"),
  refreshBtn: document.getElementById("refreshBtn"),
  clearBtn: document.getElementById("clearBtn"),
  statusBanner: document.getElementById("statusBanner"),
  summaryCards: document.getElementById("summaryCards"),
  gridState: document.getElementById("gridState"),
  gridTable: document.getElementById("gridTable"),
  drawer: document.getElementById("drawer"),
  drawerBackdrop: document.getElementById("drawerBackdrop"),
  drawerClose: document.getElementById("drawerClose"),
  drawerTitle: document.getElementById("drawerTitle"),
  drawerMeta: document.getElementById("drawerMeta"),
  drawerBody: document.getElementById("drawerBody"),
  pageLoading: document.getElementById("pageLoading"),
  loadingText: document.getElementById("loadingText"),
  toast: document.getElementById("toast"),
  connectionBadge: document.getElementById("connectionBadge"),
  lastSyncLabel: document.getElementById("lastSyncLabel"),
  currentTime: document.getElementById("currentTime"),
  metaYear: document.getElementById("metaYear"),
  managerRefreshBtn: document.getElementById("managerRefreshBtn"),
  managerMonthFilter: document.getElementById("managerMonthFilter"),
  managerYearFilter: document.getElementById("managerYearFilter"),
  managerStoreFilter: document.getElementById("managerStoreFilter"),
  managerSectorFilter: document.getElementById("managerSectorFilter"),
  managerProductFilter: document.getElementById("managerProductFilter"),
  managerTypeFilter: document.getElementById("managerTypeFilter"),
  managerReasonFilter: document.getElementById("managerReasonFilter"),
  managerStatus: document.getElementById("managerStatus"),
  aiAnalyzeBtn: document.getElementById("aiAnalyzeBtn"),
  aiAnalysisBlock: document.getElementById("aiAnalysisBlock"),
  aiAnalysisResult: document.getElementById("aiAnalysisResult"),
  aiChatForm: document.getElementById("aiChatForm"),
  aiChatInput: document.getElementById("aiChatInput"),
  aiChatSendBtn: document.getElementById("aiChatSendBtn"),
  aiChatClearBtn: document.getElementById("aiChatClearBtn"),
  aiChatMessages: document.getElementById("aiChatMessages"),
  aiChatContext: document.getElementById("aiChatContext"),
  managerCards: document.getElementById("managerCards"),
  noteReportExportBtn: document.getElementById("noteReportExportBtn"),
  noteReportSummary: document.getElementById("noteReportSummary"),
  noteReportList: document.getElementById("noteReportList"),
  storeComparisonChart: document.getElementById("storeComparisonChart"),
  monthlyEvolutionChart: document.getElementById("monthlyEvolutionChart"),
  reasonChart: document.getElementById("reasonChart"),
  storeComparisonList: document.getElementById("storeComparisonList"),
  managerDiagnosis: document.getElementById("managerDiagnosis"),
  increaseProducts: document.getElementById("increaseProducts"),
  decreaseProducts: document.getElementById("decreaseProducts"),
  managerRankingBody: document.getElementById("managerRankingBody"),
  priceQuantityTitle: document.getElementById("priceQuantityTitle"),
  priceQuantityAnalysis: document.getElementById("priceQuantityAnalysis"),
  reasonBreakdown: document.getElementById("reasonBreakdown"),
  decisionForm: document.getElementById("decisionForm"),
  decisionText: document.getElementById("decisionText"),
  decisionOwner: document.getElementById("decisionOwner"),
  decisionDueDate: document.getElementById("decisionDueDate"),
  decisionStatus: document.getElementById("decisionStatus"),
  decisionObservation: document.getElementById("decisionObservation"),
  decisionDate: document.getElementById("decisionDate"),
  decisionClearBtn: document.getElementById("decisionClearBtn"),
  decisionSaved: document.getElementById("decisionSaved")
};

const state = {
  allRows: [],
  quickStores: [],
  grid: { lojas: [], rows: [], totalsByMonth: [], summary: defaultSummary() },
  filters: {
    store: "TODAS",
    year: new Date().getFullYear(),
    type: "TODOS",
    status: "TODOS"
  },
  loadingGrid: false,
  gridError: "",
  drawerOpen: false,
  selectedCell: null,
  notes: [],
  notesPage: 0,
  hasMoreNotes: false,
  totalNotes: 0,
  notesLoading: false,
  notesError: "",
  selectedNoteKey: "",
  noteItems: [],
  itemsLoading: false,
  itemsError: "",
  savingCell: false,
  savingNote: false,
  savingItems: false,
  savingItemIds: new Set(),
  manager: {
    items: [],
    rows: [],
    selectedKey: "",
    loading: false,
    error: "",
    aiLoading: false,
    aiResult: null,
    chatLoading: false,
    chatMessages: [],
    filters: {
      month: "TODOS",
      year: new Date().getFullYear(),
      store: "TODAS",
      sector: "TODOS",
      product: "TODOS",
      type: "TODOS",
      reason: "TODOS"
    },
    currentMonth: null,
    previousMonth: null,
    charts: {
      stores: null,
      evolution: null,
      reasons: null
    }
  },
  toastTimer: null,
  realtimeTimer: null,
  realtimeCleanup: null,
  realtimeRefreshing: false,
  realtimeImpact: null
};

function defaultSummary() {
  return {
    totalValue: 0,
    noteCount: 0,
    historicalCount: 0,
    pendingCount: 0,
    divergentCount: 0,
    checkedCount: 0
  };
}

function setStatus(type, message) {
  refs.statusBanner.className = `status ${type}`;
  refs.statusBanner.textContent = message;
  if (refs.connectionBadge) {
    refs.connectionBadge.textContent = ({
      info: "Sincronizacao em leitura",
      success: "Fechamento sincronizado",
      warning: "Atencao no recorte",
      error: "Falha na leitura"
    })[type] || "Painel operacional";
  }
  if (refs.lastSyncLabel) refs.lastSyncLabel.textContent = `Status atualizado em ${new Date().toLocaleTimeString("pt-BR")}.`;
}

function showToast(type, message, duration = 3200) {
  clearTimeout(state.toastTimer);
  refs.toast.className = `toast ${type}`;
  refs.toast.textContent = message;
  refs.toast.hidden = false;
  if (duration > 0) {
    state.toastTimer = window.setTimeout(() => {
      refs.toast.hidden = true;
    }, duration);
  }
}

function setPageLoading(active, message = "Aguarde enquanto a grade mensal e sincronizada.") {
  refs.loadingText.textContent = message;
  refs.pageLoading.hidden = !active;
}

function fillSelect(select, values, currentValue, formatter = (value) => value) {
  select.innerHTML = values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(formatter(value))}</option>`).join("");
  if (values.includes(String(currentValue))) select.value = String(currentValue);
}

function monthMeta(monthNumber) {
  return MONTHS.find((month) => month.number === Number(monthNumber)) || { shortLabel: "--", longLabel: "Mes" };
}

function buildBadge(status) {
  const meta = STATUS_META[status] || STATUS_META.pendente;
  return `<span class="status-badge ${meta.tone}">${meta.label}</span>`;
}

function buildClassificationOptions(currentValue = "") {
  return NOTE_CLASSIFICATION_OPTIONS.map((option) => `
    <option value="${escapeHtml(option.value)}" ${currentValue === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>
  `).join("");
}

function buildItemReasonOptions(currentValue = "", suggestedValue = "") {
  const selectedValue = currentValue || suggestedValue || "";
  return [
    `<option value="" ${selectedValue ? "" : "selected"}>Selecionar motivo</option>`,
    ...ITEM_REASON_OPTIONS.map((option) => `
      <option value="${escapeHtml(option.value)}" ${selectedValue === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>
    `)
  ].join("");
}

function canPersistAudit(cell) {
  return !cell?.isHistorical && cell?.store && cell.store !== "TODAS" && cell.type && cell.type !== "TODOS";
}

function deriveCellStatus(cell, notes) {
  if (!cell.noteCount && !notes.length) return "sem_nota";
  if (notes.some((note) => note.status === "divergente")) return "divergente";
  if (notes.length && notes.every((note) => note.status === "confere")) return "confere";
  if (cell.status === "sem_nota" && cell.noteCount > 0) return "pendente";
  return cell.status || "pendente";
}

function buildYearOptions(rows) {
  const years = new Set([String(new Date().getFullYear())]);
  years.add("2025");
  rows.forEach((row) => years.add(String(row.year)));
  return sortLabels(years);
}

const CLOSING_TABLES = [
  {
    key: "perdasSaidas",
    title: "PERDAS / SA\u00cdDAS SETORES",
    tone: "loss",
    sectors: ["FLV", "A\u00e7ougue", "Padaria", "Produ\u00e7\u00e3o Padaria", "Frios e Congelados", "Pagas", "Furtos", "Bebidas", "Loja e Dep\u00f3sito", "Sa\u00edda de um para outro"]
  },
  {
    key: "consumo",
    title: "MATERIAL USO / CONSUMO SETOR",
    tone: "usage",
    sectors: ["A\u00e7ougue", "FLV", "Padaria", "Produ\u00e7\u00e3o", "Frente de Caixa", "Administrativo", "Fatia\u00e7\u00e3o", "Loja / Dep\u00f3sito"]
  }
];

const NOTE_CLASSIFICATION_OPTIONS = [
  { value: "", label: "Sem classificacao" },
  { value: "Quebra", label: "Quebra" },
  { value: "Uso e Consumo", label: "Uso e Consumo" },
  { value: "Saída de um para outro", label: "Saída de um para outro" },
  { value: "Vencimento", label: "Vencimento" },
  { value: "Avaria", label: "Avaria" },
  { value: "Erro de corte", label: "Erro de corte" },
  { value: "Outros", label: "Outros" }
];

const ITEM_REASON_OPTIONS = NOTE_CLASSIFICATION_OPTIONS.filter((option) => option.value);

function mergeStatus(previousStatus, currentStatus) {
  const statuses = [previousStatus, currentStatus].filter(Boolean);
  if (statuses.includes("divergente")) return "divergente";
  if (statuses.length && statuses.every((status) => status === "confere")) return "confere";
  if (statuses.includes("pendente")) return "pendente";
  return statuses[0] || "sem_nota";
}

function positiveMonthAverage(values) {
  const positives = values.map(Number).filter((value) => value > 0);
  if (!positives.length) return 0;
  return positives.reduce((sum, value) => sum + value, 0) / positives.length;
}

function buildEmptyCell({ store, year, month, typeGroup, sector }) {
  return {
    entryId: null,
    store,
    year: Number(year),
    month: month.number,
    monthLabel: month.longLabel,
    type: "TODOS",
    typeGroup,
    sector,
    status: "sem_nota",
    observation: "",
    totalValue: 0,
    noteCount: 0,
    isHistorical: false
  };
}

function buildSectorRow({ store, year, typeGroup, sector, grouped }) {
  const months = MONTHS.map((month) => grouped.get(`${store}::${typeGroup}::${sector}::${month.number}`) || buildEmptyCell({
    store,
    year,
    month,
    typeGroup,
    sector
  }));
  const monthValues = months.map((cell) => Number(cell.totalValue || 0));
  return {
    sector,
    months,
    averageValue: positiveMonthAverage(monthValues),
    totalValue: monthValues.reduce((sum, value) => sum + value, 0),
    noteCount: months.reduce((sum, cell) => sum + Number(cell.noteCount || 0), 0)
  };
}

function buildTableModel({ store, year, definition, grouped }) {
  const availableSectors = [...grouped.keys()]
    .map((key) => key.split("::"))
    .filter(([rowStore, typeGroup]) => rowStore === store && typeGroup === definition.key)
    .map((parts) => parts[2]);
  const extraSectors = sortLabels(new Set(availableSectors.filter((sector) => !definition.sectors.includes(sector))));
  const sectors = [...definition.sectors, ...extraSectors];
  const rows = sectors.map((sector) => buildSectorRow({
    store,
    year,
    typeGroup: definition.key,
    sector,
    grouped
  }));
  const totalsByMonth = MONTHS.map((month) => rows.reduce((sum, row) => sum + Number(row.months[month.number - 1].totalValue || 0), 0));
  const noteCount = rows.reduce((sum, row) => sum + row.noteCount, 0);
  return {
    ...definition,
    rows,
    totalsByMonth,
    totalValue: totalsByMonth.reduce((sum, value) => sum + value, 0),
    averageValue: positiveMonthAverage(totalsByMonth),
    noteCount
  };
}

function buildStoreSummary(storeModel) {
  const perdas = storeModel.tables.find((table) => table.key === "perdasSaidas");
  const consumo = storeModel.tables.find((table) => table.key === "consumo");
  const topLoss = [...(perdas?.rows || [])].sort((a, b) => b.totalValue - a.totalValue)[0];
  const topUsage = [...(consumo?.rows || [])].sort((a, b) => b.totalValue - a.totalValue)[0];
  return {
    totalPerdas: perdas?.totalValue || 0,
    totalConsumo: consumo?.totalValue || 0,
    totalGeral: (perdas?.totalValue || 0) + (consumo?.totalValue || 0),
    topLoss: topLoss?.totalValue > 0 ? topLoss : null,
    topUsage: topUsage?.totalValue > 0 ? topUsage : null
  };
}

function normalizeClosingRows(records) {
  const grouped = new Map();
  const storeSet = new Set();
  const year = Number(state.filters.year);

  records.forEach((row) => {
    const store = row.store || "Loja nao identificada";
    const typeGroup = classifyClosingType(row.type || row.category || "");
    const sector = normalizeClosingSector(row.sector || "", typeGroup);
    const month = Number(row.month_number);
    const key = `${store}::${typeGroup}::${sector}::${month}`;
    const currentType = row.type || "Outros";
    const previous = grouped.get(key);
    const current = {
      entryId: state.filters.type === "TODOS" ? null : (row.entry_id || null),
      store,
      year: Number(row.year || year),
      month,
      monthLabel: row.month_label || monthMeta(month).longLabel,
      type: currentType,
      typeGroup,
      sector,
      status: row.status || "pendente",
      observation: row.observation || "",
      totalValue: Number(row.total_value || 0),
      noteCount: Number(row.note_count || 0),
      isHistorical: Boolean(row.is_historical),
      source: row.source || "",
      detailLevel: row.detail_level || "",
      sourceTypes: new Set([currentType])
    };

    storeSet.add(store);
    if (!previous) {
      grouped.set(key, current);
      return;
    }

    previous.sourceTypes.add(currentType);
    grouped.set(key, {
      ...previous,
      entryId: previous.sourceTypes.size === 1 && state.filters.type !== "TODOS" ? previous.entryId : null,
      type: previous.sourceTypes.size === 1 ? [...previous.sourceTypes][0] : "TODOS",
      totalValue: previous.totalValue + current.totalValue,
      noteCount: previous.noteCount + current.noteCount,
      isHistorical: previous.isHistorical && current.isHistorical,
      source: previous.source || current.source || "",
      detailLevel: previous.detailLevel || current.detailLevel || "",
      status: mergeStatus(previous.status, current.status),
      observation: previous.observation || current.observation || ""
    });
  });

  const stores = sortLabels(storeSet);
  const lojas = stores.map((store) => {
    const tables = CLOSING_TABLES.map((definition) => buildTableModel({ store, year, definition, grouped }));
    const model = { loja: store, tables };
    return { ...model, summary: buildStoreSummary(model) };
  });

  return { lojas };
}

function buildGridModel(records) {
  const normalized = normalizeClosingRows(records);
  const summary = normalized.lojas.reduce((acc, loja) => {
    loja.tables.forEach((table) => {
      table.rows.forEach((row) => {
        row.months.forEach((cell) => {
          acc.totalValue += cell.totalValue;
          acc.noteCount += cell.noteCount;
          if (cell.isHistorical && cell.totalValue > 0) acc.historicalCount += 1;
          if (cell.status === "pendente") acc.pendingCount += 1;
          if (cell.status === "divergente") acc.divergentCount += 1;
          if (cell.status === "confere") acc.checkedCount += 1;
        });
      });
    });
    return acc;
  }, defaultSummary());
  const totalsByMonth = MONTHS.map((month) => normalized.lojas.reduce((storeSum, loja) => storeSum + loja.tables.reduce((tableSum, table) => tableSum + Number(table.totalsByMonth[month.number - 1] || 0), 0), 0));
  return { ...normalized, rows: [], totalsByMonth, summary };
}

function renderSummary() {
  const isHistoricalGrid = state.grid.summary.historicalCount > 0 && state.grid.summary.noteCount === 0;
  refs.summaryCards.innerHTML = `
    <article class="card kpi-card">
      <div class="label">Total do periodo</div>
      <div class="value">${brl(state.grid.summary.totalValue)}</div>
      <div class="meta">Soma consolidada do recorte atual.</div>
    </article>
    <article class="card kpi-card">
      <div class="label">${isHistoricalGrid ? "Registros historicos" : "Notas no periodo"}</div>
      <div class="value">${isHistoricalGrid ? state.grid.summary.historicalCount : state.grid.summary.noteCount}</div>
      <div class="meta">${isHistoricalGrid ? "Celulas consolidadas importadas de planilha." : "Quantidade de notas presentes na grade."}</div>
    </article>
    <article class="card kpi-card">
      <div class="label">Pendencias</div>
      <div class="value">${state.grid.summary.pendingCount}</div>
      <div class="meta">Celulas aguardando conferencia operacional.</div>
    </article>
    <article class="card kpi-card">
      <div class="label">Divergencias</div>
      <div class="value">${state.grid.summary.divergentCount}</div>
      <div class="meta">Celulas com diferenca registrada manualmente.</div>
    </article>
  `;
}

function renderGridSkeleton() {
  const cells = MONTHS.map(() => '<div class="fechamento-cell fechamento-skeleton-cell"></div>').join("");
  refs.gridTable.innerHTML = new Array(6).fill("").map((_, index) => `
    <div class="fechamento-grid-row">
      <div class="fechamento-sticky-col fechamento-sector-cell fechamento-skeleton-text">Setor ${index + 1}</div>
      ${cells}
      <div class="fechamento-total-cell fechamento-skeleton-cell"></div>
      <div class="fechamento-total-cell fechamento-skeleton-cell"></div>
    </div>
  `).join("");
}

function renderCellButton(cell) {
  const meta = STATUS_META[cell.status] || STATUS_META.pendente;
  return `
    <button
      type="button"
      class="fechamento-cell fechamento-cell-${meta.tone} ${cell.isHistorical ? "fechamento-cell-historical" : ""}"
      data-action="open-cell"
      data-entry-id="${escapeHtml(cell.entryId || "")}"
      data-store="${escapeHtml(cell.store)}"
      data-year="${cell.year}"
      data-month="${cell.month}"
      data-type="${escapeHtml(cell.type)}"
      data-type-group="${escapeHtml(cell.typeGroup || "")}"
      data-sector="${escapeHtml(cell.sector)}"
      data-status="${escapeHtml(cell.status)}"
      data-observation="${escapeHtml(cell.observation || "")}"
      data-total-value="${cell.totalValue}"
      data-note-count="${cell.noteCount}"
      data-is-historical="${cell.isHistorical ? "true" : "false"}"
      data-source="${escapeHtml(cell.source || "")}"
      data-detail-level="${escapeHtml(cell.detailLevel || "")}"
    >
      <strong>${brl(cell.totalValue)}</strong>
      <span>${cell.isHistorical ? "consolidado" : `${cell.noteCount} nota(s)`}</span>
      ${buildBadge(cell.status)}
    </button>
  `;
}

function renderClosingTable(table) {
  const isHistoricalTable = table.rows.some((row) => row.months.some((cell) => cell.isHistorical && cell.totalValue > 0));
  const head = `
    <div class="fechamento-table-title fechamento-table-title-${table.tone}">
      <h4>${escapeHtml(table.title)}</h4>
      <span>${brl(table.totalValue)} no periodo</span>
    </div>
    <div class="fechamento-grid-head fechamento-grid-head-${table.tone}">
      <div class="fechamento-sticky-col fechamento-head-cell">Setor</div>
      ${MONTHS.map((month) => `<div class="fechamento-head-cell">${month.longLabel}</div>`).join("")}
      <div class="fechamento-head-cell">M\u00e9dia</div>
      <div class="fechamento-head-cell">Total</div>
    </div>
  `;

  const body = table.rows.map((row) => `
    <div class="fechamento-grid-row">
      <div class="fechamento-sticky-col fechamento-sector-cell">
        <strong>${escapeHtml(row.sector)}</strong>
        <span>${isHistoricalTable ? "consolidado" : `${row.noteCount} nota(s)`}</span>
      </div>
      ${row.months.map(renderCellButton).join("")}
      <div class="fechamento-total-cell fechamento-average-cell">
        <strong>${brl(row.averageValue)}</strong>
        <span>meses com valor</span>
      </div>
      <div class="fechamento-total-cell">
        <strong>${brl(row.totalValue)}</strong>
        <span>${isHistoricalTable ? "consolidado" : `${row.noteCount} nota(s)`}</span>
      </div>
    </div>
  `).join("");

  const footer = `
    <div class="fechamento-grid-row fechamento-grid-footer fechamento-grid-footer-${table.tone}">
      <div class="fechamento-sticky-col fechamento-sector-cell">
        <strong>Total</strong>
        <span>${isHistoricalTable ? "consolidado" : `${table.noteCount} nota(s)`}</span>
      </div>
      ${table.totalsByMonth.map((value) => `<div class="fechamento-footer-cell"><strong>${brl(value)}</strong></div>`).join("")}
      <div class="fechamento-total-cell">
        <strong>${brl(table.averageValue)}</strong>
        <span>m\u00e9dia mensal</span>
      </div>
      <div class="fechamento-total-cell">
        <strong>${brl(table.totalValue)}</strong>
        <span>${isHistoricalTable ? "consolidado" : `${table.noteCount} nota(s)`}</span>
      </div>
    </div>
  `;

  return `<div class="fechamento-table-block fechamento-table-block-${table.tone}">${head}${body}${footer}</div>`;
}

function renderStoreSummaryCards(loja) {
  const { summary } = loja;
  return `
    <div class="fechamento-store-kpis">
      <article class="card kpi-card">
        <div class="label">Total Perdas / Sa\u00eddas</div>
        <div class="value">${brl(summary.totalPerdas)}</div>
      </article>
      <article class="card kpi-card">
        <div class="label">Total Consumo</div>
        <div class="value">${brl(summary.totalConsumo)}</div>
      </article>
      <article class="card kpi-card">
        <div class="label">Total Geral da Loja</div>
        <div class="value">${brl(summary.totalGeral)}</div>
      </article>
      <article class="card kpi-card">
        <div class="label">Setor com maior perda</div>
        <div class="value">${escapeHtml(summary.topLoss?.sector || "-")}</div>
        <div class="meta">${brl(summary.topLoss?.totalValue || 0)}</div>
      </article>
      <article class="card kpi-card">
        <div class="label">Setor com maior consumo</div>
        <div class="value">${escapeHtml(summary.topUsage?.sector || "-")}</div>
        <div class="meta">${brl(summary.topUsage?.totalValue || 0)}</div>
      </article>
    </div>
  `;
}

function renderStoreBlock(loja) {
  const isHistoricalStore = loja.tables.some((table) => table.rows.some((row) => row.months.some((cell) => cell.isHistorical && cell.totalValue > 0)));
  return `
    <section class="fechamento-store-block">
      <div class="fechamento-store-head">
        <div>
          <span class="panel-tag">Fechamento Mensal ${escapeHtml(String(state.filters.year))}</span>
          <h3>${escapeHtml(loja.loja)}</h3>
          ${isHistoricalStore ? '<span class="fechamento-history-badge">Historico consolidado</span>' : ""}
        </div>
        <strong>${brl(loja.summary.totalGeral)}</strong>
      </div>
      ${renderStoreSummaryCards(loja)}
      ${loja.tables.map(renderClosingTable).join("")}
    </section>
  `;
}

function renderQuickStoreFilter() {
  if (!refs.quickStoreFilter) return;
  const stores = sortLabels(new Set([
    ...state.quickStores,
    ...state.allRows.map((row) => row.store).filter(Boolean),
    ...state.grid.lojas.map((loja) => loja.loja).filter(Boolean)
  ]));
  const options = ["TODAS", ...stores];
  refs.quickStoreFilter.innerHTML = options.map((store) => {
    const active = state.filters.store === store;
    const label = store === "TODAS" ? "Todas as lojas" : store;
    return `
      <button
        type="button"
        class="fechamento-store-chip ${active ? "is-active" : ""}"
        data-action="select-store-chip"
        data-store="${escapeHtml(store)}"
        aria-pressed="${active ? "true" : "false"}"
      >${escapeHtml(label)}</button>
    `;
  }).join("");
}

function renderGrid() {
  renderSummary();
  renderQuickStoreFilter();

  if (state.loadingGrid && !state.grid.lojas?.length) {
    refs.gridState.innerHTML = "";
    renderGridSkeleton();
    return;
  }

  if (state.gridError && !state.grid.lojas?.length) {
    refs.gridState.innerHTML = `
      <div class="status error fechamento-state">
        <span>${escapeHtml(state.gridError)}</span>
        <div class="fechamento-inline">
          <button type="button" data-action="retry-grid">Tentar novamente</button>
        </div>
      </div>
    `;
    refs.gridTable.innerHTML = "";
    return;
  }

  if (!state.grid.summary.noteCount && !state.grid.summary.historicalCount && !state.grid.summary.totalValue) {
    refs.gridState.innerHTML = `
      <div class="empty">
        Nenhum fechamento encontrado para os filtros atuais.
        <div class="fechamento-inline">
          <button type="button" data-action="clear-filters">Limpar filtros</button>
        </div>
      </div>
    `;
    refs.gridTable.innerHTML = "";
    return;
  }

  const isHistoricalGrid = state.grid.summary.historicalCount > 0 && state.grid.summary.noteCount === 0;
  refs.gridState.innerHTML = state.gridError
    ? `<div class="status warning">${escapeHtml(state.gridError)}</div>`
    : (isHistoricalGrid ? '<div class="fechamento-history-badge">Historico consolidado</div>' : "");
  refs.gridTable.innerHTML = state.grid.lojas.map(renderStoreBlock).join("");
}

function setManagerStatus(type, message) {
  if (!refs.managerStatus) return;
  refs.managerStatus.className = `status ${type}`;
  refs.managerStatus.textContent = message;
}

function monthDateKey(item) {
  const date = new Date(item.date || "");
  if (Number.isNaN(date.getTime())) return null;
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

function monthLabel(year, month) {
  const meta = monthMeta(month);
  return `${meta.shortLabel}/${year}`;
}

function previousPeriod(year, month) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

function isSamePeriod(item, period) {
  const key = monthDateKey(item);
  return key && key.year === period.year && key.month === period.month;
}

function isRealLoss(item) {
  return item.type === "Perdas";
}

function percentChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function averagePrice(value, quantity) {
  return quantity ? value / quantity : 0;
}

function groupSum(items, keyFn) {
  const map = new Map();
  items.forEach((item) => {
    const key = keyFn(item);
    const entry = map.get(key) || { value: 0, quantity: 0, items: 0, notes: new Set(), reasons: new Map() };
    entry.value += Number(item.value || 0);
    entry.quantity += Number(item.quantity || 0);
    entry.items += 1;
    if (item.noteKey) entry.notes.add(item.noteKey);
    const reason = item.reason || "Sem motivo";
    const reasonEntry = entry.reasons.get(reason) || { value: 0, quantity: 0, items: 0 };
    reasonEntry.value += Number(item.value || 0);
    reasonEntry.quantity += Number(item.quantity || 0);
    reasonEntry.items += 1;
    entry.reasons.set(reason, reasonEntry);
    map.set(key, entry);
  });
  return map;
}

function topReasonLabel(reasonMap) {
  const top = [...reasonMap.entries()].sort((a, b) => b[1].value - a[1].value)[0];
  return top?.[0] || "Sem motivo";
}

function buildManagerModel() {
  const manager = state.manager;
  const year = Number(manager.filters.year || new Date().getFullYear());
  const monthsInYear = manager.items
    .map(monthDateKey)
    .filter((key) => key && key.year === year)
    .map((key) => key.month);
  const currentMonth = manager.filters.month !== "TODOS"
    ? Number(manager.filters.month)
    : (monthsInYear.length ? Math.max(...monthsInYear) : new Date().getMonth() + 1);
  const currentPeriod = { year, month: currentMonth };
  const previous = previousPeriod(year, currentMonth);
  const selectedTypeIsUsage = manager.filters.type === "Uso/Consumo";
  const lossItems = manager.items.filter(isRealLoss);
  const currentItems = selectedTypeIsUsage ? [] : lossItems.filter((item) => isSamePeriod(item, currentPeriod));
  const previousItems = selectedTypeIsUsage ? [] : lossItems.filter((item) => isSamePeriod(item, previous));
  const currentMap = groupSum(currentItems, (item) => `${item.product}||${item.store}||${item.sector}`);
  const previousMap = groupSum(previousItems, (item) => `${item.product}||${item.store}||${item.sector}`);
  const keys = new Set([...currentMap.keys(), ...previousMap.keys()]);

  const rows = [...keys].map((key) => {
    const [product, store, sector] = key.split("||");
    const current = currentMap.get(key) || { value: 0, quantity: 0, items: 0, notes: new Set(), reasons: new Map() };
    const previousEntry = previousMap.get(key) || { value: 0, quantity: 0, items: 0, notes: new Set(), reasons: new Map() };
    const currentPrice = averagePrice(current.value, current.quantity);
    const previousPrice = averagePrice(previousEntry.value, previousEntry.quantity);
    const valueVariation = current.value - previousEntry.value;
    const pctVariation = percentChange(current.value, previousEntry.value);
    const quantityImpact = (current.quantity - previousEntry.quantity) * previousPrice;
    const priceImpact = (currentPrice - previousPrice) * current.quantity;

    return {
      key,
      product,
      store,
      sector,
      currentValue: current.value,
      previousValue: previousEntry.value,
      valueVariation,
      pctVariation,
      currentQuantity: current.quantity,
      previousQuantity: previousEntry.quantity,
      currentPrice,
      previousPrice,
      mainReason: topReasonLabel(current.reasons.size ? current.reasons : previousEntry.reasons),
      status: valueVariation > 1 ? "aumentou" : (valueVariation < -1 ? "reduziu" : "estavel"),
      quantityVariation: current.quantity - previousEntry.quantity,
      priceVariation: currentPrice - previousPrice,
      quantityImpact,
      priceImpact,
      totalVariation: valueVariation,
      reasons: current.reasons,
      missingReasonValue: current.reasons.get("Sem motivo")?.value || 0
    };
  }).sort((a, b) => b.currentValue - a.currentValue || b.valueVariation - a.valueVariation);

  const currentTotal = currentItems.reduce((sum, item) => sum + item.value, 0);
  const previousTotal = previousItems.reduce((sum, item) => sum + item.value, 0);
  const storeMap = groupSum(currentItems, (item) => item.store);
  const sectorMap = groupSum(currentItems, (item) => item.sector);
  const productMap = groupSum(currentItems, (item) => item.product);
  const monthMap = groupSum(lossItems.filter((item) => {
    const key = monthDateKey(item);
    return key && key.year === year;
  }), (item) => monthDateKey(item).month);

  const stores = [...storeMap.entries()].map(([store, data]) => ({ store, ...data })).sort((a, b) => b.value - a.value);
  const sectors = [...sectorMap.entries()].map(([sector, data]) => ({ sector, ...data })).sort((a, b) => b.value - a.value);
  const products = [...productMap.entries()].map(([product, data]) => ({ product, ...data })).sort((a, b) => b.value - a.value);
  const avgStore = stores.length ? currentTotal / stores.length : 0;
  const topStore = stores[0] || null;
  const topSector = sectors[0] || null;
  const topIncrease = rows.filter((row) => row.valueVariation > 0).sort((a, b) => b.pctVariation - a.pctVariation || b.valueVariation - a.valueVariation).slice(0, 5);
  const topDecrease = rows.filter((row) => row.valueVariation < 0).sort((a, b) => a.pctVariation - b.pctVariation || a.valueVariation - b.valueVariation).slice(0, 5);
  const selected = rows.find((row) => row.key === manager.selectedKey) || rows[0] || null;

  manager.currentMonth = currentPeriod;
  manager.previousMonth = previous;
  manager.rows = rows;
  if (selected) manager.selectedKey = selected.key;

  return {
    currentPeriod,
    previousPeriod: previous,
    currentItems,
    previousItems,
    currentTotal,
    previousTotal,
    totalVariation: currentTotal - previousTotal,
    pctVariation: percentChange(currentTotal, previousTotal),
    stores,
    sectors,
    products,
    avgStore,
    topStore,
    topSector,
    topIncrease,
    topDecrease,
    selected,
    monthMap,
    selectedTypeIsUsage
  };
}

function renderManagerCards(model) {
  const criticalStore = model.stores.find((store) => model.stores.length > 1 && store.value > ((model.currentTotal - store.value) / (model.stores.length - 1))) || model.topStore;
  const topIncrease = model.topIncrease[0];
  const topDecrease = model.topDecrease[0];
  refs.managerCards.innerHTML = `
    <article class="card kpi-card">
      <div class="label">Perda total</div>
      <div class="value">${brl(model.currentTotal)}</div>
      <div class="meta">Somente movimentos classificados como Perdas.</div>
    </article>
    <article class="card kpi-card ${Math.abs(model.pctVariation) > 15 ? "manager-alert-card" : ""}">
      <div class="label">Variacao %</div>
      <div class="value">${num(model.pctVariation)}%</div>
      <div class="meta">${brl(model.totalVariation)} contra ${monthLabel(model.previousPeriod.year, model.previousPeriod.month)}.</div>
    </article>
    <article class="card kpi-card">
      <div class="label">Loja mais critica</div>
      <div class="value">${escapeHtml(criticalStore?.store || "-")}</div>
      <div class="meta">${criticalStore ? brl(criticalStore.value) : "Sem perda real no recorte."}</div>
    </article>
    <article class="card kpi-card">
      <div class="label">Setor mais critico</div>
      <div class="value">${escapeHtml(model.topSector?.sector || "-")}</div>
      <div class="meta">${model.topSector ? brl(model.topSector.value) : "Sem perda real no recorte."}</div>
    </article>
    <article class="card kpi-card ${topIncrease && topIncrease.pctVariation > 15 ? "manager-alert-card" : ""}">
      <div class="label">Produto que mais aumentou</div>
      <div class="value">${escapeHtml(topIncrease?.product || "-")}</div>
      <div class="meta">${topIncrease ? `${brl(topIncrease.valueVariation)} | ${num(topIncrease.pctVariation)}%` : "Sem aumento relevante."}</div>
    </article>
    <article class="card kpi-card">
      <div class="label">Produto que mais reduziu</div>
      <div class="value">${escapeHtml(topDecrease?.product || "-")}</div>
      <div class="meta">${topDecrease ? `${brl(topDecrease.valueVariation)} | ${num(topDecrease.pctVariation)}%` : "Sem reducao no recorte."}</div>
    </article>
  `;
}

function buildNoteReport(items = []) {
  const noteMap = new Map();
  items.forEach((item) => {
    const noteKey = item.noteKey || `${item.invoice}||${item.store}||${item.date}`;
    const note = noteMap.get(noteKey) || {
      noteKey,
      invoice: item.invoice || "-",
      store: item.store || "Loja nao identificada",
      date: item.date || "",
      type: item.displayType || item.type || "Outros",
      value: 0,
      quantity: 0,
      sectors: new Map()
    };
    const sectorName = item.sector || "Nao classificado";
    const sector = note.sectors.get(sectorName) || { name: sectorName, value: 0, quantity: 0, products: [] };
    const value = Number(item.value || 0);
    const quantity = Number(item.quantity || 0);
    sector.value += value;
    sector.quantity += quantity;
    sector.products.push(item);
    note.value += value;
    note.quantity += quantity;
    note.sectors.set(sectorName, sector);
    noteMap.set(noteKey, note);
  });

  return [...noteMap.values()]
    .map((note) => ({ ...note, sectors: [...note.sectors.values()].sort((a, b) => b.value - a.value) }))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.value - a.value);
}

function noteReportItems(model) {
  return state.manager.items.filter((item) => isSamePeriod(item, model.currentPeriod));
}

function renderNoteReport(model) {
  if (!refs.noteReportList || !refs.noteReportSummary) return;
  const notes = buildNoteReport(noteReportItems(model));
  const totalValue = notes.reduce((sum, note) => sum + note.value, 0);
  const sectorNames = new Set(notes.flatMap((note) => note.sectors.map((sector) => sector.name)));
  const productCount = notes.reduce((sum, note) => sum + note.sectors.reduce((sectorSum, sector) => sectorSum + sector.products.length, 0), 0);

  refs.noteReportSummary.innerHTML = `
    <div class="summary-card"><div class="label">Notas</div><strong>${notes.length}</strong><div class="hint">no recorte atual</div></div>
    <div class="summary-card"><div class="label">Setores</div><strong>${sectorNames.size}</strong><div class="hint">setores identificados</div></div>
    <div class="summary-card"><div class="label">Itens</div><strong>${productCount}</strong><div class="hint">produtos nas notas</div></div>
    <div class="summary-card"><div class="label">Valor total</div><strong>${brl(totalValue)}</strong><div class="hint">soma das notas filtradas</div></div>
  `;
  refs.noteReportExportBtn.disabled = !notes.length;

  if (!notes.length) {
    refs.noteReportList.innerHTML = '<div class="empty">Nenhuma nota encontrada no recorte selecionado.</div>';
    return;
  }

  refs.noteReportList.innerHTML = notes.map((note) => `
    <details class="note-report-card">
      <summary>
        <span class="note-report-identity"><strong>NF ${escapeHtml(note.invoice)}</strong><small>${escapeHtml(note.store)} | ${formatDate(note.date)} | ${escapeHtml(note.type)}</small></span>
        <span class="note-report-metric"><strong>${note.sectors.length}</strong><small>setor(es)</small></span>
        <span class="note-report-metric"><strong>${note.sectors.reduce((sum, sector) => sum + sector.products.length, 0)}</strong><small>item(ns)</small></span>
        <span class="note-report-total">${brl(note.value)}</span>
      </summary>
      <div class="note-report-sectors">
        ${note.sectors.map((sector) => `
          <section class="note-report-sector">
            <div class="note-report-sector-head">
              <div><strong>${escapeHtml(sector.name)}</strong><small>${num(note.value ? (sector.value / note.value) * 100 : 0)}% da nota</small></div>
              <span>${brl(sector.value)}</span>
            </div>
            <div class="table-wrap note-report-table-wrap">
              <table>
                <thead><tr><th>Produto</th><th>Quantidade</th><th>Valor unitario</th><th>Total</th></tr></thead>
                <tbody>${sector.products.map((item) => `
                  <tr><td>${escapeHtml(item.product)}</td><td>${num(item.quantity)}</td><td>${brl(item.unitValue)}</td><td>${brl(item.value)}</td></tr>
                `).join("")}</tbody>
              </table>
            </div>
          </section>
        `).join("")}
      </div>
    </details>
  `).join("");
}

function exportNoteReportCsv() {
  const model = buildManagerModel();
  const notes = buildNoteReport(noteReportItems(model));
  if (!notes.length) return showToast("warning", "Nao ha notas para exportar neste recorte.");
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = [["Nota", "Loja", "Data", "Tipo", "Setor", "Produto", "Quantidade", "Valor unitario", "Valor total"]];
  notes.forEach((note) => note.sectors.forEach((sector) => sector.products.forEach((item) => rows.push([
    note.invoice, note.store, note.date, note.type, sector.name, item.product, item.quantity, item.unitValue, item.value
  ]))));
  const csv = `\uFEFF${rows.map((row) => row.map(quote).join(";")).join("\r\n")}`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = `relatorio-notas-${model.currentPeriod.year}-${String(model.currentPeriod.month).padStart(2, "0")}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function chartOptions() {
  const styles = getComputedStyle(document.documentElement);
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: styles.getPropertyValue("--text-soft") } } },
    scales: {
      x: { ticks: { color: styles.getPropertyValue("--text-soft") }, grid: { color: "rgba(148,163,184,.18)" } },
      y: { ticks: { color: styles.getPropertyValue("--text-soft") }, grid: { color: "rgba(148,163,184,.18)" } }
    }
  };
}

function renderManagerCharts(model) {
  if (!window.Chart) return;
  Object.values(state.manager.charts).forEach((chart) => chart?.destroy());
  state.manager.charts = { stores: null, evolution: null, reasons: null };
  const styles = getComputedStyle(document.documentElement);
  const accent = styles.getPropertyValue("--accent").trim() || "#0f5bd4";
  const accent2 = styles.getPropertyValue("--accent-2").trim() || "#18a0b7";
  const warning = styles.getPropertyValue("--warning").trim() || "#b97008";
  const danger = styles.getPropertyValue("--danger").trim() || "#c2413a";
  const options = chartOptions();

  state.manager.charts.stores = new window.Chart(refs.storeComparisonChart, {
    type: "bar",
    data: {
      labels: model.stores.map((entry) => entry.store),
      datasets: [{
        label: "Perda real",
        data: model.stores.map((entry) => entry.value),
        backgroundColor: model.stores.map((entry) => entry.value > model.avgStore ? danger : accent),
        borderRadius: 8
      }]
    },
    options
  });

  const monthLabels = MONTHS.map((month) => month.shortLabel);
  state.manager.charts.evolution = new window.Chart(refs.monthlyEvolutionChart, {
    type: "line",
    data: {
      labels: monthLabels,
      datasets: [{
        label: "Perda mensal",
        data: MONTHS.map((month) => model.monthMap.get(month.number)?.value || 0),
        borderColor: accent,
        backgroundColor: "rgba(15,91,212,.14)",
        fill: true,
        tension: .32
      }]
    },
    options
  });

  const selectedReasons = model.selected ? [...model.selected.reasons.entries()].sort((a, b) => b[1].value - a[1].value) : [];
  state.manager.charts.reasons = new window.Chart(refs.reasonChart, {
    type: "bar",
    data: {
      labels: selectedReasons.map(([reason]) => reason),
      datasets: [{
        label: "Motivos",
        data: selectedReasons.map(([, data]) => data.value),
        backgroundColor: selectedReasons.map(([reason]) => reason === "Sem motivo" ? warning : accent2),
        borderRadius: 8
      }]
    },
    options
  });
}

function renderStoreComparison(model) {
  const total = model.currentTotal || 1;
  refs.storeComparisonList.innerHTML = model.stores.map((entry) => {
    const othersAverage = model.stores.length > 1 ? (model.currentTotal - entry.value) / (model.stores.length - 1) : model.avgStore;
    const aboveAverage = model.stores.length > 1 && entry.value > othersAverage;
    return `
      <div class="reason-chip ${aboveAverage ? "manager-warning-row" : ""}">
        <div>
          <strong>${escapeHtml(entry.store)}</strong>
          <div class="hint">${num((entry.value / total) * 100)}% do total do setor</div>
        </div>
        <div class="cell-stack">
          ${aboveAverage ? '<span class="status-badge warning">Acima da media</span>' : '<span class="status-badge success">Dentro da media</span>'}
          <strong>${brl(entry.value)}</strong>
        </div>
      </div>
    `;
  }).join("") || '<div class="empty">Nenhuma perda real encontrada para comparar lojas.</div>';
}

function renderProductList(element, rows, emptyText) {
  element.innerHTML = rows.map((row) => `
    <button type="button" class="manager-product-card ${state.manager.selectedKey === row.key ? "is-active" : ""} ${Math.abs(row.pctVariation) > 15 ? "is-alert" : ""}" data-action="select-manager-product" data-key="${escapeHtml(row.key)}">
      <div>
        <strong>${escapeHtml(row.product)}</strong>
        <span>${escapeHtml(row.store)} - ${escapeHtml(row.sector)}</span>
      </div>
      <div class="cell-stack">
        <span class="status-badge ${row.status === "aumentou" ? "danger" : "success"}">${escapeHtml(row.status)}</span>
        <strong>${brl(row.valueVariation)}</strong>
        <span>${num(row.pctVariation)}%</span>
      </div>
    </button>
  `).join("") || `<div class="empty">${escapeHtml(emptyText)}</div>`;
}

function renderManagerRanking() {
  refs.managerRankingBody.innerHTML = state.manager.rows.slice(0, 80).map((row) => `
    <tr class="${state.manager.selectedKey === row.key ? "manager-selected-row" : ""}" data-action="select-manager-product" data-key="${escapeHtml(row.key)}">
      <td><button type="button" class="manager-row-button" data-action="select-manager-product" data-key="${escapeHtml(row.key)}">${escapeHtml(row.product)}</button></td>
      <td>${escapeHtml(row.store)}</td>
      <td>${escapeHtml(row.sector)}</td>
      <td>${brl(row.currentValue)}</td>
      <td>${brl(row.previousValue)}</td>
      <td>${brl(row.valueVariation)}</td>
      <td class="${Math.abs(row.pctVariation) > 15 ? "manager-alert-text" : ""}">${num(row.pctVariation)}%</td>
      <td>${num(row.currentQuantity)}</td>
      <td>${num(row.previousQuantity)}</td>
      <td>${brl(row.currentPrice)}</td>
      <td>${brl(row.previousPrice)}</td>
      <td>${escapeHtml(row.mainReason)}</td>
      <td><span class="status-badge ${row.status === "aumentou" ? "danger" : (row.status === "reduziu" ? "success" : "neutral")}">${escapeHtml(row.status)}</span></td>
    </tr>
  `).join("") || '<tr><td colspan="13">Nenhum produto com perda real no recorte atual.</td></tr>';
}

function renderPriceQuantity(model) {
  const row = model.selected;
  refs.priceQuantityTitle.textContent = row ? `${row.product} - ${row.store}` : "Produto selecionado";
  if (!row) {
    refs.priceQuantityAnalysis.innerHTML = '<div class="empty">Selecione um produto no ranking para analisar quantidade, preco medio e impacto financeiro.</div>';
    return;
  }

  const dominant = Math.abs(row.priceImpact) > Math.abs(row.quantityImpact)
    ? "aumento do preco medio"
    : (Math.abs(row.quantityImpact) > 0 ? "maior quantidade perdida" : "variacao estavel");
  refs.priceQuantityAnalysis.innerHTML = `
    <div class="summary-card"><div class="label">Variacao de quantidade</div><strong>${num(row.quantityVariation)}</strong><div class="hint">${dominant === "maior quantidade perdida" ? "Principal vetor" : "Impacto operacional"}</div></div>
    <div class="summary-card"><div class="label">Variacao do preco medio</div><strong>${brl(row.priceVariation)}</strong><div class="hint">${dominant === "aumento do preco medio" ? "Principal vetor" : "Impacto de custo"}</div></div>
    <div class="summary-card"><div class="label">Variacao total</div><strong>${brl(row.totalVariation)}</strong><div class="hint">${num(row.pctVariation)}% contra mes anterior</div></div>
    <div class="summary-card"><div class="label">Impacto por quantidade</div><strong>${brl(row.quantityImpact)}</strong><div class="hint">(qtd atual - qtd anterior) x preco anterior</div></div>
    <div class="summary-card"><div class="label">Impacto por preco</div><strong>${brl(row.priceImpact)}</strong><div class="hint">(preco atual - preco anterior) x qtd atual</div></div>
    <div class="summary-card ${row.missingReasonValue > 0 ? "manager-alert-card" : ""}"><div class="label">Falta de justificativa</div><strong>${brl(row.missingReasonValue)}</strong><div class="hint">${row.missingReasonValue > 0 ? "Ha itens sem motivo" : "Motivos preenchidos"}</div></div>
  `;
}

function renderReasonBreakdown(model) {
  const row = model.selected;
  if (!row) {
    refs.reasonBreakdown.innerHTML = '<div class="empty">Nenhum produto selecionado.</div>';
    return;
  }
  const total = row.currentValue || 1;
  refs.reasonBreakdown.innerHTML = [...row.reasons.entries()].sort((a, b) => b[1].value - a[1].value).map(([reason, data]) => `
    <div class="reason-chip ${reason === "Sem motivo" ? "manager-warning-row" : ""}">
      <div>
        <strong>${escapeHtml(reason)}</strong>
        <div class="hint">${data.items} item(ns) - ${num((data.value / total) * 100)}%</div>
      </div>
      <div class="cell-stack">
        ${reason === "Sem motivo" ? '<span class="status-badge warning">Sem justificativa</span>' : '<span class="status-badge success">Justificado</span>'}
        <strong>${brl(data.value)}</strong>
      </div>
    </div>
  `).join("") || '<div class="empty">Sem motivos vinculados ao produto selecionado.</div>';
}

function renderDiagnosis(model) {
  if (!model.currentItems.length) {
    refs.managerDiagnosis.innerHTML = '<strong>Diagnostico automatico</strong><p>Nao ha perda real no recorte gerencial selecionado. Uso e consumo nao foi misturado aos indicadores de perda.</p>';
    return;
  }
  const store = model.stores.find((entry) => model.stores.length > 1 && entry.value > ((model.currentTotal - entry.value) / (model.stores.length - 1))) || model.topStore;
  const productNames = model.topIncrease.slice(0, 2).map((row) => row.product).join(" e ") || model.products.slice(0, 2).map((entry) => entry.product).join(" e ");
  const selected = model.selected;
  const mainDriver = selected && Math.abs(selected.priceImpact) > Math.abs(selected.quantityImpact)
    ? "variacao de preco medio"
    : "quantidade perdida";
  const reason = selected?.mainReason || "sem motivo";
  const sector = state.manager.filters.sector !== "TODOS" ? state.manager.filters.sector : (model.topSector?.sector || "setor selecionado");
  refs.managerDiagnosis.innerHTML = `
    <strong>Diagnostico automatico</strong>
    <p>A ${escapeHtml(store?.store || "loja principal")} apresenta perda no setor ${escapeHtml(sector)} ${store && store.value > model.avgStore ? "acima da media das lojas" : "como maior impacto do recorte"}. Os principais produtos responsaveis foram ${escapeHtml(productNames || "sem destaque")}. A variacao ocorreu principalmente por ${escapeHtml(mainDriver)}. O principal motivo informado foi ${escapeHtml(reason)}.</p>
  `;
}

function buildAiPayload(model) {
  return {
    periodo: monthLabel(model.currentPeriod.year, model.currentPeriod.month),
    filtros: { ...state.manager.filters },
    indicadores: {
      perda_total: model.currentTotal,
      perda_mes_anterior: model.previousTotal,
      variacao_valor: model.totalVariation,
      variacao_percentual: model.pctVariation,
      itens_analisados: model.currentItems.length
    },
    lojas: model.stores.slice(0, 10).map(({ store, value, quantity, items }) => ({ store, value, quantity, items })),
    setores: model.sectors.slice(0, 10).map(({ sector, value, quantity, items }) => ({ sector, value, quantity, items })),
    produtos: state.manager.rows.slice(0, 12).map((row) => ({
      produto: row.product,
      loja: row.store,
      setor: row.sector,
      valor_atual: row.currentValue,
      valor_anterior: row.previousValue,
      variacao_valor: row.valueVariation,
      variacao_percentual: row.pctVariation,
      quantidade_atual: row.currentQuantity,
      preco_medio_atual: row.currentPrice,
      motivo_principal: row.mainReason,
      valor_sem_motivo: row.missingReasonValue
    }))
  };
}

function renderAiAnalysis() {
  if (!refs.aiAnalysisResult) return;
  if (state.manager.aiLoading) {
    refs.aiAnalysisResult.innerHTML = '<div class="fechamento-skeleton-text"></div>';
    return;
  }
  const analysis = state.manager.aiResult;
  if (!analysis) return;
  const list = (items, renderItem, emptyText) => items?.length
    ? `<ul>${items.map(renderItem).join("")}</ul>`
    : `<p class="muted-note">${escapeHtml(emptyText)}</p>`;
  refs.aiAnalysisResult.innerHTML = `
    <div class="ai-analysis-summary">
      <span class="status-badge ${analysis.nivel_atencao === "critico" || analysis.nivel_atencao === "alto" ? "danger" : (analysis.nivel_atencao === "medio" ? "warning" : "success")}">Atencao ${escapeHtml(analysis.nivel_atencao)}</span>
      <p>${escapeHtml(analysis.resumo_executivo)}</p>
    </div>
    <div class="ai-analysis-grid">
      <article><h4>Anomalias observadas</h4>${list(analysis.anomalias, (item) => `<li><strong>${escapeHtml(item.titulo)}</strong><span>${escapeHtml(item.evidencia)} ${escapeHtml(item.impacto)}</span></li>`, "Nenhuma anomalia relevante.")}</article>
      <article><h4>Causas a validar</h4>${list(analysis.causas_provaveis, (item) => `<li><strong>${escapeHtml(item.causa)} (${escapeHtml(item.confianca)})</strong><span>${escapeHtml(item.como_validar)}</span></li>`, "Sem hipoteses suficientes.")}</article>
      <article><h4>Recomendacoes</h4>${list(analysis.recomendacoes, (item) => `<li><strong>${escapeHtml(item.acao)} - prioridade ${escapeHtml(item.prioridade)}</strong><span>Indicador: ${escapeHtml(item.indicador)}</span></li>`, "Sem recomendacoes adicionais.")}</article>
      <article><h4>Conferencia humana</h4>${list(analysis.pontos_conferencia, (item) => `<li><span>${escapeHtml(item)}</span></li>`, "Sem pontos adicionais.")}</article>
    </div>
    ${analysis.limitacoes?.length ? `<div class="ai-analysis-limitations"><strong>Limitacoes da analise</strong>${list(analysis.limitacoes, (item) => `<li><span>${escapeHtml(item)}</span></li>`, "")}</div>` : ""}
  `;
}

function renderAiChat() {
  if (!refs.aiChatMessages) return;
  const messages = state.manager.chatMessages;
  refs.aiChatMessages.innerHTML = messages.length ? messages.map((message) => `
    <div class="ai-chat-message ${message.role}">
      <span>${message.role === "user" ? "Voce" : "Assistente"}</span>
      <p>${escapeHtml(message.content).replace(/\n/g, "<br>")}</p>
    </div>
  `).join("") : '<div class="ai-chat-welcome">Pergunte, por exemplo: “Por que as perdas aumentaram neste mes?”</div>';
  if (state.manager.chatLoading) {
    refs.aiChatMessages.insertAdjacentHTML("beforeend", '<div class="ai-chat-message assistant is-typing"><span>Assistente</span><p>Analisando o fechamento...</p></div>');
  }
  refs.aiChatMessages.scrollTop = refs.aiChatMessages.scrollHeight;
}

function resetAiChat(message = "") {
  state.manager.chatMessages = [];
  state.manager.chatLoading = false;
  renderAiChat();
  if (message) showToast("info", message);
}

async function sendAiChatMessage(event) {
  event.preventDefault();
  const question = refs.aiChatInput.value.trim();
  if (!question || state.manager.chatLoading) return;
  const model = buildManagerModel();
  if (!model.currentItems.length) {
    showToast("warning", "Nao ha perdas no recorte atual para conversar.");
    return;
  }

  const history = state.manager.chatMessages.map(({ role, content }) => ({ role, content }));
  state.manager.chatMessages.push({ role: "user", content: question });
  state.manager.chatLoading = true;
  refs.aiChatInput.value = "";
  refs.aiChatSendBtn.disabled = true;
  renderAiChat();

  try {
    const result = await requestClosingChat(buildAiPayload(model), question, history);
    state.manager.chatMessages.push({ role: "assistant", content: result.answer });
  } catch (error) {
    const message = error.userMessage || error.message || "Nao foi possivel obter uma resposta.";
    state.manager.chatMessages.push({ role: "assistant", content: `Nao consegui responder: ${message}` });
    showToast("error", message, 6000);
  } finally {
    state.manager.chatLoading = false;
    refs.aiChatSendBtn.disabled = false;
    refs.aiChatInput.focus();
    renderAiChat();
  }
}

async function analyzeWithAi() {
  const model = buildManagerModel();
  if (!model.currentItems.length) {
    showToast("warning", "Nao ha perdas no recorte atual para analisar.");
    refs.aiAnalysisBlock?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  refs.aiAnalysisBlock?.scrollIntoView({ behavior: "smooth", block: "start" });
  state.manager.aiLoading = true;
  state.manager.aiResult = null;
  refs.aiAnalyzeBtn.disabled = true;
  refs.aiAnalyzeBtn.textContent = "Analisando...";
  renderAiAnalysis();
  try {
    const result = await requestClosingAnalysis(buildAiPayload(model));
    state.manager.aiResult = result.analysis;
    renderAiAnalysis();
    showToast("success", "Analise por IA concluida.");
  } catch (error) {
    console.error(error);
    const message = error.userMessage || error.message || "Falha ao gerar analise.";
    refs.aiAnalysisResult.innerHTML = `
      <div class="ai-analysis-error" role="alert">
        <strong>Nao foi possivel concluir a analise</strong>
        <p>${escapeHtml(message)}</p>
        <small>Verifique a configuracao da IA e tente novamente.</small>
      </div>
    `;
    showToast("error", message, 6000);
  } finally {
    state.manager.aiLoading = false;
    refs.aiAnalyzeBtn.disabled = false;
    refs.aiAnalyzeBtn.textContent = "Analisar com IA";
  }
}

function renderManager() {
  if (state.manager.loading && !state.manager.items.length) {
    setManagerStatus("info", "Carregando dados gerenciais...");
    refs.managerCards.innerHTML = "";
    refs.managerRankingBody.innerHTML = '<tr><td colspan="13">Carregando analise...</td></tr>';
    return;
  }

  if (state.manager.error) {
    setManagerStatus("error", state.manager.error);
    return;
  }

  const model = buildManagerModel();
  setManagerStatus(model.selectedTypeIsUsage ? "warning" : "success", model.selectedTypeIsUsage
    ? "Uso/Consumo selecionado. Os indicadores de perda real ficam zerados para evitar mistura de natureza operacional."
    : `${model.currentItems.length} item(ns) de perda real em ${monthLabel(model.currentPeriod.year, model.currentPeriod.month)}.`);
  renderManagerCards(model);
  renderNoteReport(model);
  renderStoreComparison(model);
  renderProductList(refs.increaseProducts, model.topIncrease, "Nenhum produto aumentou a perda contra o mes anterior.");
  renderProductList(refs.decreaseProducts, model.topDecrease, "Nenhum produto reduziu a perda contra o mes anterior.");
  renderManagerRanking();
  renderPriceQuantity(model);
  renderReasonBreakdown(model);
  renderDiagnosis(model);
  renderManagerCharts(model);
  renderSavedDecision();
}

function renderNotesList() {
  if (state.notesLoading && !state.notes.length) {
    return '<div class="fechamento-skeleton"></div><div class="fechamento-skeleton"></div><div class="fechamento-skeleton"></div>';
  }

  if (state.notesError) {
    return `
      <div class="empty">
        ${escapeHtml(state.notesError)}
        <div class="fechamento-inline">
          <button type="button" data-action="retry-notes">Tentar novamente</button>
        </div>
      </div>
    `;
  }

  if (!state.notes.length) return '<div class="empty">Nenhuma nota localizada para esta celula.</div>';

  return `
    ${state.notes.map((note) => `
      <button
        type="button"
        class="fechamento-note-card ${state.selectedNoteKey === note.noteKey ? "is-active" : ""}"
        data-action="select-note"
        data-note-key="${escapeHtml(note.noteKey)}"
      >
        <div class="fechamento-note-main">
          <div class="fechamento-note-titleline">
            <strong>NF ${escapeHtml(note.invoice)}</strong>
            ${buildBadge(note.status)}
          </div>
          <div class="fechamento-note-tags">
            <span>Competencia ${escapeHtml(note.competenceMonth || "-")}</span>
            <span>Emissao ${escapeHtml(formatDate(note.date))}</span>
            <span>${escapeHtml(note.type)}</span>
            <span>${escapeHtml(note.sector)}</span>
            ${note.classification ? `<span>${escapeHtml(note.classification)}</span>` : ""}
          </div>
        </div>
        <div class="fechamento-note-metrics">
          <strong>${brl(note.totalValue)}</strong>
          <span>${note.itemCount} item(ns)</span>
        </div>
      </button>
    `).join("")}
    ${state.hasMoreNotes ? '<button type="button" data-action="load-more-notes">Carregar mais notas</button>' : ""}
  `;
}

function renderItemsPanel() {
  const note = state.notes.find((entry) => entry.noteKey === state.selectedNoteKey);
  if (!note) {
    return '<div class="empty">Selecione uma nota para visualizar os produtos e concluir a auditoria.</div>';
  }

  if (state.itemsLoading && !state.noteItems.length) {
    return '<div class="fechamento-skeleton tall"></div>';
  }

  if (state.itemsError) {
    return `
      <div class="empty">
        ${escapeHtml(state.itemsError)}
        <div class="fechamento-inline">
          <button type="button" data-action="retry-items">Tentar novamente</button>
        </div>
      </div>
    `;
  }

  const pendingItems = state.noteItems.filter((item) => !item.reason);
  const completedItems = state.noteItems.length - pendingItems.length;
  const suggestedReason = note.classification || "";
  const displayedStatus = note.status === "pendente" && state.noteItems.length && !pendingItems.length
    ? "confere"
    : note.status;
  const canApplySuggestion = Boolean(suggestedReason && pendingItems.length && !state.savingItems);

  return `
    <div class="fechamento-note-toolbar">
      <div class="cell-stack">
        <span class="label">Nota em auditoria</span>
        <strong>NF ${escapeHtml(note.invoice)} - ${brl(note.totalValue)}</strong>
      </div>
      ${buildBadge(note.status)}
    </div>

    <div class="fechamento-form-grid fechamento-note-audit-grid">
      <label class="fechamento-field">
        <span>Status da nota</span>
        <select id="noteStatus">
          <option value="pendente" ${displayedStatus === "pendente" ? "selected" : ""}>Pendente</option>
          <option value="confere" ${displayedStatus === "confere" ? "selected" : ""}>Confere</option>
          <option value="divergente" ${displayedStatus === "divergente" ? "selected" : ""}>Divergente</option>
        </select>
      </label>
      <label class="fechamento-field">
        <span>Classificacao da nota</span>
        <select id="noteClassification">${buildClassificationOptions(note.classification || "")}</select>
      </label>
      <label class="fechamento-field">
        <span>Observacao da nota</span>
        <textarea id="noteObservation" rows="4" placeholder="Registre observacoes da conferencia.">${escapeHtml(note.observation || "")}</textarea>
      </label>
    </div>

    <div class="fechamento-inline">
      <button type="button" data-action="save-note" ${(state.savingNote || !canPersistAudit(state.selectedCell)) ? "disabled" : ""}>${state.savingNote ? "Salvando..." : "Salvar nota"}</button>
    </div>
    ${canPersistAudit(state.selectedCell) ? "" : '<div class="hint">Selecione uma loja e um tipo especificos para salvar auditoria manual.</div>'}

    <div class="fechamento-items-actions">
      <div class="cell-stack">
        <span class="label">Classificacao dos produtos</span>
        <strong>${completedItems}/${state.noteItems.length} produto(s) com motivo</strong>
        ${suggestedReason ? `<span class="hint">Sugestao da nota: ${escapeHtml(suggestedReason)}</span>` : '<span class="hint">Defina uma classificacao na nota para sugerir motivos aos produtos pendentes.</span>'}
      </div>
      <div class="fechamento-inline">
        <button type="button" data-action="apply-note-classification-to-items" ${canApplySuggestion ? "" : "disabled"}>Aplicar aos sem motivo</button>
        <button type="button" data-action="save-all-item-reasons" ${(state.savingItems || !state.noteItems.length) ? "disabled" : ""}>${state.savingItems ? "Salvando..." : "Salvar todos"}</button>
      </div>
    </div>

    <div class="table-wrap fechamento-items-table">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Produto</th>
            <th>Qtd</th>
            <th>Valor</th>
            <th>Motivo</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          ${state.noteItems.length ? state.noteItems.map((item) => {
            const isComplete = Boolean(item.reason);
            const selectedReason = item.reason || suggestedReason || "";
            const savingThisItem = state.savingItemIds.has(item.id);
            return `
            <tr class="fechamento-item-row ${isComplete ? "is-complete" : "is-pending"}">
              <td>${item.itemIndex}</td>
              <td>
                <div class="cell-stack">
                  <strong>${escapeHtml(item.product)}</strong>
                  ${isComplete ? '<span class="status-badge success">Concluido</span>' : '<span class="status-badge warning">Sem motivo salvo</span>'}
                </div>
              </td>
              <td>${num(item.quantity)}</td>
              <td>${brl(item.value)}</td>
              <td>
                <div class="cell-stack">
                  <select
                    class="fechamento-item-reason-select ${isComplete ? "is-saved" : "is-pending"}"
                    data-action="set-item-reason"
                    data-item-id="${escapeHtml(item.id)}"
                    data-saved-reason="${escapeHtml(item.reason || "")}"
                  >${buildItemReasonOptions(item.reason || "", suggestedReason)}</select>
                  <span class="row-meta">${isComplete ? "Motivo salvo" : (selectedReason ? "Sugestao pronta para salvar" : "Selecione um motivo")}</span>
                </div>
              </td>
              <td>
                <button type="button" data-action="save-item-reason" data-item-id="${escapeHtml(item.id)}" ${savingThisItem ? "disabled" : ""}>${savingThisItem ? "Salvando..." : "Salvar"}</button>
              </td>
            </tr>
          `;
          }).join("") : '<tr><td colspan="6">Nenhum item encontrado para esta nota.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}

function renderDrawer() {
  refs.drawerBackdrop.hidden = !state.drawerOpen;
  refs.drawer.hidden = !state.drawerOpen;
  if (!state.drawerOpen || !state.selectedCell) return;

  refs.drawerTitle.textContent = `${state.selectedCell.sector} - ${state.selectedCell.monthLabel}`;
  refs.drawerMeta.innerHTML = `
    <span>${escapeHtml(state.selectedCell.store === "TODAS" ? "Todas as lojas" : state.selectedCell.store)}</span>
    <span>${state.selectedCell.year}</span>
    <span>${escapeHtml(state.selectedCell.type === "TODOS" ? "Todos os tipos" : state.selectedCell.type)}</span>
    <span>${brl(state.selectedCell.totalValue)}</span>
  `;

  if (state.selectedCell.isHistorical) {
    refs.drawerBody.innerHTML = `
      <div class="fechamento-history-detail">
        <span class="fechamento-history-badge">Historico consolidado</span>
        <section class="fechamento-panel">
          <div class="fechamento-summary-grid">
            <div class="summary-card">
              <div class="label">Loja</div>
              <strong>${escapeHtml(state.selectedCell.store)}</strong>
            </div>
            <div class="summary-card">
              <div class="label">Setor</div>
              <strong>${escapeHtml(state.selectedCell.sector)}</strong>
            </div>
            <div class="summary-card">
              <div class="label">Mes</div>
              <strong>${escapeHtml(state.selectedCell.monthLabel)}</strong>
            </div>
            <div class="summary-card">
              <div class="label">Tipo</div>
              <strong>${escapeHtml(state.selectedCell.type)}</strong>
            </div>
            <div class="summary-card">
              <div class="label">Valor</div>
              <strong>${brl(state.selectedCell.totalValue)}</strong>
            </div>
            <div class="summary-card">
              <div class="label">Origem</div>
              <strong>${escapeHtml(state.selectedCell.source || "planilha_historica")}</strong>
            </div>
          </div>
          <div class="status info">Histórico consolidado importado de planilha antiga. Sem detalhamento por nota ou produto.</div>
          ${state.selectedCell.observation ? `<div class="summary-card"><div class="label">Observacoes</div><strong>${escapeHtml(state.selectedCell.observation)}</strong></div>` : ""}
        </section>
      </div>
    `;
    return;
  }

  refs.drawerBody.innerHTML = `
    <div class="fechamento-drawer-layout">
      <section class="fechamento-panel">
        <div class="fechamento-summary-grid">
          <div class="summary-card">
            <div class="label">Valor da celula</div>
            <strong>${brl(state.selectedCell.totalValue)}</strong>
          </div>
          <div class="summary-card">
            <div class="label">Notas</div>
            <strong>${state.selectedCell.noteCount}</strong>
          </div>
          <div class="summary-card">
            <div class="label">Status</div>
            <strong>${(STATUS_META[state.selectedCell.status] || STATUS_META.pendente).label}</strong>
          </div>
        </div>

        <div class="fechamento-form-grid">
          <label class="fechamento-field">
            <span>Status da celula</span>
            <select id="cellStatus">
              <option value="sem_nota" ${state.selectedCell.status === "sem_nota" ? "selected" : ""}>Sem nota</option>
              <option value="pendente" ${state.selectedCell.status === "pendente" ? "selected" : ""}>Pendente</option>
              <option value="confere" ${state.selectedCell.status === "confere" ? "selected" : ""}>Confere</option>
              <option value="divergente" ${state.selectedCell.status === "divergente" ? "selected" : ""}>Divergente</option>
            </select>
          </label>
          <label class="fechamento-field">
            <span>Observacao da celula</span>
            <textarea id="cellObservation" rows="4" placeholder="Descreva o fechamento do setor neste mes.">${escapeHtml(state.selectedCell.observation || "")}</textarea>
          </label>
        </div>

        <div class="fechamento-inline">
          <button type="button" data-action="save-cell" ${(state.savingCell || !canPersistAudit(state.selectedCell)) ? "disabled" : ""}>${state.savingCell ? "Salvando..." : "Salvar celula"}</button>
        </div>
        ${canPersistAudit(state.selectedCell) ? "" : '<div class="hint">Para salvar auditoria manual, selecione uma loja e um tipo especificos.</div>'}

        <div class="panel-head">
          <div>
            <span class="panel-tag">Notas do periodo</span>
            <h3>Notas relacionadas</h3>
            <p class="muted-note">${state.totalNotes} nota(s) localizadas no recorte atual.</p>
          </div>
        </div>
        <div class="fechamento-notes-list">${renderNotesList()}</div>
      </section>

      <section class="fechamento-panel">
        <div class="panel-head">
          <div>
            <span class="panel-tag">Produtos</span>
            <h3>Detalhamento da nota</h3>
            <p class="muted-note">Abra uma nota para analisar os produtos e confirmar a conferencia.</p>
          </div>
        </div>
        ${renderItemsPanel()}
      </section>
    </div>
  `;
}

function patchGridCell(updatedCell) {
  state.grid.lojas = state.grid.lojas.map((loja) => {
    if (loja.loja !== updatedCell.store) return loja;
    const tables = loja.tables.map((table) => {
      if (table.key !== updatedCell.typeGroup) return table;
      const rows = table.rows.map((row) => {
        if (row.sector !== updatedCell.sector) return row;
        const months = row.months.map((cell) => cell.month === updatedCell.month ? { ...cell, ...updatedCell } : cell);
        const monthValues = months.map((cell) => Number(cell.totalValue || 0));
        return {
          ...row,
          months,
          averageValue: positiveMonthAverage(monthValues),
          totalValue: monthValues.reduce((sum, value) => sum + value, 0),
          noteCount: months.reduce((sum, cell) => sum + Number(cell.noteCount || 0), 0)
        };
      });
      const totalsByMonth = MONTHS.map((month) => rows.reduce((sum, row) => sum + Number(row.months[month.number - 1].totalValue || 0), 0));
      return {
        ...table,
        rows,
        totalsByMonth,
        totalValue: totalsByMonth.reduce((sum, value) => sum + value, 0),
        averageValue: positiveMonthAverage(totalsByMonth),
        noteCount: rows.reduce((sum, row) => sum + row.noteCount, 0)
      };
    });
    const model = { ...loja, tables };
    return { ...model, summary: buildStoreSummary(model) };
  });
  state.grid.summary = state.grid.lojas.reduce((acc, loja) => {
    loja.tables.forEach((table) => {
      table.rows.forEach((row) => {
        row.months.forEach((cell) => {
          acc.totalValue += cell.totalValue;
          acc.noteCount += cell.noteCount;
          if (cell.isHistorical && cell.totalValue > 0) acc.historicalCount += 1;
          if (cell.status === "pendente") acc.pendingCount += 1;
          if (cell.status === "divergente") acc.divergentCount += 1;
          if (cell.status === "confere") acc.checkedCount += 1;
        });
      });
    });
    return acc;
  }, defaultSummary());
  state.grid.totalsByMonth = MONTHS.map((month) => state.grid.lojas.reduce((storeSum, loja) => storeSum + loja.tables.reduce((tableSum, table) => tableSum + Number(table.totalsByMonth[month.number - 1] || 0), 0), 0));
}

function parseCell(button) {
  return {
    entryId: button.dataset.entryId || null,
    store: button.dataset.store,
    year: Number(button.dataset.year || 0),
    month: Number(button.dataset.month || 0),
    monthLabel: monthMeta(button.dataset.month).longLabel,
    type: button.dataset.type,
    typeGroup: button.dataset.typeGroup || classifyClosingType(button.dataset.type),
    sector: button.dataset.sector,
    status: button.dataset.status || "pendente",
    observation: button.dataset.observation || "",
    totalValue: Number(button.dataset.totalValue || 0),
    noteCount: Number(button.dataset.noteCount || 0),
    isHistorical: button.dataset.isHistorical === "true",
    source: button.dataset.source || "",
    detailLevel: button.dataset.detailLevel || ""
  };
}

async function loadGrid({ silent = false } = {}) {
  try {
    state.loadingGrid = true;
    if (!silent) setPageLoading(true, "Carregando grade mensal do Supabase...");
    renderGrid();
    const rows = await fetchGrid(state.filters);
    state.allRows = rows;
    const stores = rows.map((row) => row.store).filter(Boolean);
    state.quickStores = state.filters.store === "TODAS"
      ? sortLabels(new Set(stores))
      : sortLabels(new Set([...state.quickStores, ...stores, state.filters.store].filter(Boolean)));
    state.grid = buildGridModel(rows);
    console.log("[Fechamento] Linhas da view carregadas:", rows.length);
    console.log("[Fechamento] Filtros ativos:", state.filters);
    console.log("[Fechamento] Total de notas na grade:", state.grid.summary.noteCount);
    state.gridError = "";
    renderGrid();
    const historicalOnly = state.grid.summary.historicalCount > 0 && state.grid.summary.noteCount === 0;
    setStatus("success", historicalOnly
      ? `${state.grid.summary.historicalCount} registro(s) historicos consolidados carregados.`
      : `${state.grid.summary.noteCount} nota(s) posicionadas na grade mensal.`);
  } catch (error) {
    console.error(error);
    state.gridError = error.userMessage || error.message || "Falha ao carregar a grade do fechamento.";
    renderGrid();
    setStatus("error", state.gridError);
  } finally {
    state.loadingGrid = false;
    setPageLoading(false);
    renderGrid();
  }
}

async function loadNotes({ append = false, refreshItems = false } = {}) {
  if (!state.selectedCell) return;
  try {
    state.notesLoading = true;
    state.notesError = "";
    renderDrawer();
    const result = await fetchCellNotes(state.selectedCell, state.filters, {
      page: state.notesPage,
      limit: 25
    });
    state.selectedCell = {
      ...state.selectedCell,
      entryId: result.entryId || state.selectedCell.entryId,
      status: result.entryStatus || state.selectedCell.status,
      observation: result.entryObservation || state.selectedCell.observation
    };
    state.notes = append ? [...state.notes, ...result.notes] : result.notes;
    state.totalNotes = result.totalCount;
    state.hasMoreNotes = result.hasMore;

    if (!append) {
      const nextNoteKey = state.notes.some((note) => note.noteKey === state.selectedNoteKey)
        ? state.selectedNoteKey
        : (state.notes[0]?.noteKey || "");
      if (!nextNoteKey) {
        state.selectedNoteKey = "";
        state.noteItems = [];
      } else if (refreshItems || nextNoteKey !== state.selectedNoteKey || !state.noteItems.length) {
        await loadItems(nextNoteKey);
      }
    }
  } catch (error) {
    console.error(error);
    state.notesError = error.userMessage || error.message || "Falha ao carregar as notas da celula.";
  } finally {
    state.notesLoading = false;
    renderDrawer();
  }
}

async function loadItems(noteKey) {
  try {
    state.selectedNoteKey = noteKey;
    state.itemsLoading = true;
    state.itemsError = "";
    state.savingItems = false;
    state.savingItemIds.clear();
    renderDrawer();
    state.noteItems = await fetchNoteItems(noteKey);
    await promoteSelectedNoteIfComplete();
  } catch (error) {
    console.error(error);
    state.itemsError = error.userMessage || error.message || "Falha ao carregar os produtos.";
    state.noteItems = [];
  } finally {
    state.itemsLoading = false;
    renderDrawer();
  }
}

function getSelectedNote() {
  return state.notes.find((entry) => entry.noteKey === state.selectedNoteKey) || null;
}

function selectedNoteIsComplete() {
  return Boolean(state.noteItems.length) && state.noteItems.every((item) => Boolean(item.reason));
}

async function promoteSelectedNoteIfComplete() {
  const note = getSelectedNote();
  if (!note || note.status !== "pendente" || !selectedNoteIsComplete()) return false;

  renderDrawer();
  const statusField = document.getElementById("noteStatus");
  if (statusField) statusField.value = "confere";
  return saveNote();
}

function collectItemReasonUpdates({ onlyWithReason = false } = {}) {
  return [...refs.drawerBody.querySelectorAll("[data-action='set-item-reason']")]
    .map((select) => ({
      id: select.dataset.itemId,
      reason: select.value || ""
    }))
    .filter((item) => item.id && (!onlyWithReason || item.reason));
}

function patchItemReasons(savedItems) {
  const reasonById = new Map(savedItems.map((item) => [item.id, item.reason || ""]));
  state.noteItems = state.noteItems.map((item) => reasonById.has(item.id) ? {
    ...item,
    reason: reasonById.get(item.id)
  } : item);
  state.manager.items = state.manager.items.map((item) => reasonById.has(item.id) ? {
    ...item,
    reason: reasonById.get(item.id)
  } : item);
}

function updateItemReasonRow(select) {
  const row = select.closest(".fechamento-item-row");
  if (!row) return;
  const savedReason = select.dataset.savedReason || "";
  const currentReason = select.value || "";
  row.classList.toggle("is-complete", Boolean(savedReason));
  row.classList.toggle("is-pending", !savedReason);
  row.classList.toggle("has-unsaved-reason", currentReason !== savedReason);
  const meta = row.querySelector(".row-meta");
  if (meta) {
    meta.textContent = savedReason
      ? (currentReason !== savedReason ? "Alteracao pendente" : "Motivo salvo")
      : (currentReason ? "Pronto para salvar" : "Selecione um motivo");
  }
}

function applyNoteClassificationToItems() {
  const note = getSelectedNote();
  const reason = note?.classification || "";
  if (!reason) {
    showToast("warning", "Defina uma classificacao na nota antes de aplicar aos produtos.");
    return;
  }

  let applied = 0;
  refs.drawerBody.querySelectorAll("[data-action='set-item-reason']").forEach((select) => {
    if (select.dataset.savedReason) return;
    select.value = reason;
    updateItemReasonRow(select);
    applied += 1;
  });

  showToast(applied ? "success" : "info", applied ? "Classificacao aplicada aos produtos sem motivo. Revise e salve todos." : "Todos os produtos ja possuem motivo salvo.");
}

async function saveSingleItemReason(itemId) {
  const select = [...refs.drawerBody.querySelectorAll("[data-action='set-item-reason']")].find((field) => field.dataset.itemId === itemId);
  const reason = select?.value || "";
  if (!reason) {
    showToast("warning", "Selecione um motivo antes de salvar o produto.");
    return;
  }

  try {
    state.savingItemIds.add(itemId);
    renderDrawer();
    const saved = await saveItemReason(itemId, reason);
    patchItemReasons([saved]);
    renderDrawer();
    const promoted = await promoteSelectedNoteIfComplete();
    if (!promoted) showToast("success", "Motivo do produto salvo.");
  } catch (error) {
    console.error(error);
    showToast("error", error.userMessage || "Nao foi possivel salvar o motivo do produto.");
  } finally {
    state.savingItemIds.delete(itemId);
    renderDrawer();
  }
}

async function saveAllItemReasons() {
  const updates = collectItemReasonUpdates({ onlyWithReason: true });
  if (!updates.length) {
    showToast("warning", "Selecione ao menos um motivo para salvar.");
    return;
  }

  try {
    state.savingItems = true;
    renderDrawer();
    const saved = await saveItemReasons(updates);
    patchItemReasons(saved);
    renderDrawer();
    const promoted = await promoteSelectedNoteIfComplete();
    if (!promoted) showToast("success", `${saved.length} motivo(s) de produto salvos.`);
  } catch (error) {
    console.error(error);
    showToast("error", error.userMessage || "Nao foi possivel salvar os motivos dos produtos.");
  } finally {
    state.savingItems = false;
    renderDrawer();
  }
}

function openDrawerFromCell(button) {
  state.selectedCell = parseCell(button);
  state.drawerOpen = true;
  state.notes = [];
  state.totalNotes = 0;
  state.notesPage = 0;
  state.hasMoreNotes = false;
  state.notesError = "";
  state.selectedNoteKey = "";
  state.noteItems = [];
  state.itemsError = "";
  state.savingItems = false;
  state.savingItemIds.clear();
  renderDrawer();
  if (state.selectedCell.isHistorical) return;
  loadNotes();
}

function closeDrawer() {
  state.drawerOpen = false;
  state.selectedCell = null;
  state.notes = [];
  state.selectedNoteKey = "";
  state.noteItems = [];
  state.savingItems = false;
  state.savingItemIds.clear();
  renderDrawer();
}

async function saveCell() {
  if (!state.selectedCell || !canPersistAudit(state.selectedCell)) {
    showToast("warning", "Selecione uma loja e um tipo especificos antes de salvar a celula.");
    return;
  }

  const nextStatus = document.getElementById("cellStatus")?.value || state.selectedCell.status;
  const nextObservation = document.getElementById("cellObservation")?.value || "";

  try {
    state.savingCell = true;
    renderDrawer();
    const result = await saveEntryAudit({
      cell: state.selectedCell,
      status: nextStatus,
      observation: nextObservation
    });
    state.selectedCell = { ...state.selectedCell, entryId: result.entryId, status: result.status, observation: result.observation };
    patchGridCell(state.selectedCell);
    invalidateCellCache(state.selectedCell, state.filters);
    renderGrid();
    renderDrawer();
    showToast("success", "Celula salva com sucesso.");
  } catch (error) {
    console.error(error);
    showToast("error", error.userMessage || "Nao foi possivel salvar a celula.");
  } finally {
    state.savingCell = false;
    renderDrawer();
  }
}

async function saveNote() {
  if (!state.selectedCell || !state.selectedNoteKey || !canPersistAudit(state.selectedCell)) {
    showToast("warning", "Selecione uma loja e um tipo especificos antes de salvar a nota.");
    return false;
  }

  const nextStatus = document.getElementById("noteStatus")?.value || "pendente";
  const nextClassification = document.getElementById("noteClassification")?.value || "";
  const nextObservation = document.getElementById("noteObservation")?.value || "";

  try {
    state.savingNote = true;
    renderDrawer();
    const noteResult = await saveNoteAudit({
      cell: state.selectedCell,
      noteKey: state.selectedNoteKey,
      status: nextStatus,
      classification: nextClassification,
      observation: nextObservation
    });

    state.notes = state.notes.map((note) => note.noteKey === state.selectedNoteKey ? {
      ...note,
      status: noteResult.status,
      classification: noteResult.classification,
      observation: noteResult.observation
    } : note);

    const derivedStatus = deriveCellStatus(state.selectedCell, state.notes);
    const entryResult = await saveEntryAudit({
      cell: { ...state.selectedCell, entryId: noteResult.entryId },
      status: derivedStatus,
      observation: state.selectedCell.observation || ""
    });

    state.selectedCell = {
      ...state.selectedCell,
      entryId: entryResult.entryId,
      status: entryResult.status,
      observation: entryResult.observation
    };

    patchGridCell(state.selectedCell);
    invalidateCellCache(state.selectedCell, state.filters);
    renderGrid();
    renderDrawer();
    showToast("success", nextStatus === "confere" ? "Nota classificada e marcada como Confere." : "Nota auditada com sucesso.");
    return true;
  } catch (error) {
    console.error(error);
    showToast("error", error.userMessage || "Nao foi possivel salvar a nota.");
    return false;
  } finally {
    state.savingNote = false;
    renderDrawer();
  }
}

function syncFiltersFromData() {
  const stores = sortLabels(new Set(state.allRows.map((row) => row.store).filter(Boolean)));
  state.quickStores = sortLabels(new Set([...state.quickStores, ...stores]));
  const years = buildYearOptions(state.allRows);
  const types = sortLabels(new Set(state.allRows.map((row) => row.type).filter(Boolean)));

  fillSelect(refs.storeFilter, ["TODAS", ...stores], state.filters.store, (value) => value === "TODAS" ? "Todas as lojas" : value);
  fillSelect(refs.yearFilter, years, state.filters.year);
  fillSelect(refs.typeFilter, ["TODOS", ...types], state.filters.type, (value) => value === "TODOS" ? "Todos os tipos" : value);
  fillSelect(refs.statusFilter, ["TODOS", "confere", "pendente", "divergente", "sem_nota"], state.filters.status, (value) => value === "TODOS" ? "Todos os status" : (STATUS_META[value] || STATUS_META.pendente).label);
  refs.metaYear.textContent = String(state.filters.year);
  renderQuickStoreFilter();
}

function syncManagerFiltersFromData() {
  if (!refs.managerYearFilter) return;
  const stores = sortLabels(new Set([
    ...state.allRows.map((row) => row.store).filter(Boolean),
    ...state.manager.items.map((item) => item.store).filter(Boolean)
  ]));
  const sectors = sortLabels(new Set([
    ...SECTOR_OPTIONS,
    ...state.manager.items.map((item) => item.sector).filter(Boolean)
  ]));
  const products = sortLabels(new Set(state.manager.items.map((item) => item.product).filter(Boolean))).slice(0, 600);
  const types = sortLabels(new Set([
    ...state.allRows.map((row) => row.type).filter(Boolean),
    ...state.manager.items.map((item) => item.type).filter(Boolean)
  ]));
  const reasons = sortLabels(new Set(state.manager.items.map((item) => item.reason || "Sem motivo")));
  const years = buildYearOptions([
    ...state.allRows,
    ...state.manager.items.map((item) => ({ year: monthDateKey(item)?.year || state.manager.filters.year }))
  ]);
  const monthOptions = ["TODOS", ...MONTHS.map((month) => String(month.number))];

  fillSelect(refs.managerMonthFilter, monthOptions, state.manager.filters.month, (value) => value === "TODOS" ? "Mes mais recente" : monthMeta(value).longLabel);
  fillSelect(refs.managerYearFilter, years, state.manager.filters.year);
  fillSelect(refs.managerStoreFilter, ["TODAS", ...stores], state.manager.filters.store, (value) => value === "TODAS" ? "Todas as lojas" : value);
  fillSelect(refs.managerSectorFilter, ["TODOS", ...sectors], state.manager.filters.sector, (value) => value === "TODOS" ? "Todos os setores" : value);
  fillSelect(refs.managerProductFilter, ["TODOS", ...products], state.manager.filters.product, (value) => value === "TODOS" ? "Todos os produtos" : value);
  fillSelect(refs.managerTypeFilter, ["TODOS", ...types], state.manager.filters.type, (value) => value === "TODOS" ? "Todos os tipos" : value);
  fillSelect(refs.managerReasonFilter, ["TODOS", ...reasons], state.manager.filters.reason, (value) => value === "TODOS" ? "Todos os motivos" : value);
}

function syncManagerStateFromFilters() {
  state.manager.filters = {
    month: refs.managerMonthFilter.value,
    year: Number(refs.managerYearFilter.value || state.filters.year || new Date().getFullYear()),
    store: refs.managerStoreFilter.value,
    sector: refs.managerSectorFilter.value,
    product: refs.managerProductFilter.value,
    type: refs.managerTypeFilter.value,
    reason: refs.managerReasonFilter.value
  };
}

async function loadManagerData({ silent = false } = {}) {
  if (!refs.managerStatus) return;
  try {
    state.manager.loading = true;
    state.manager.error = "";
    if (!silent) renderManager();
    state.manager.items = await fetchManagerialItems(state.manager.filters);
    state.manager.selectedKey = "";
    syncManagerFiltersFromData();
  } catch (error) {
    console.error(error);
    state.manager.error = error.userMessage || error.message || "Falha ao carregar a analise gerencial.";
  } finally {
    state.manager.loading = false;
    renderManager();
  }
}

async function refreshFromRealtime() {
  if (state.realtimeRefreshing || state.savingCell || state.savingNote || state.savingItems || state.savingItemIds.size) {
    scheduleRealtimeRefresh(null, 1000);
    return;
  }

  state.realtimeRefreshing = true;
  try {
    const impact = state.realtimeImpact;
    state.realtimeImpact = null;
    if (state.drawerOpen && state.selectedCell && !state.selectedCell.isHistorical) {
      const sameNote = !impact?.noteKey || state.notes.some((note) => note.noteKey === impact.noteKey);
      const sameStore = !impact?.store || state.selectedCell.store === impact.store;
      if (!sameNote && !sameStore) return;
      invalidateCellCache(state.selectedCell, state.filters);
      state.notesPage = 0;
      await loadNotes({ refreshItems: true });
    }
    if (state.drawerOpen) showToast("success", "Detalhes da celula atualizados automaticamente.", 2500);
  } catch (error) {
    console.error("[Fechamento Realtime]", error);
  } finally {
    state.realtimeRefreshing = false;
  }
}

function scheduleRealtimeRefresh(payload, delay = 500) {
  state.realtimeImpact = getRealtimeImpact(payload);
  clearTimeout(state.realtimeTimer);
  state.realtimeTimer = window.setTimeout(refreshFromRealtime, delay);
}

function managerDecisionKey() {
  const filters = state.manager.filters;
  const product = state.manager.selectedKey || "geral";
  return `gestao_perdas_decisao_v1::${filters.year}::${filters.month}::${filters.store}::${filters.sector}::${filters.type}::${product}`;
}

function readDecision() {
  try {
    return JSON.parse(localStorage.getItem(managerDecisionKey()) || "null");
  } catch {
    return null;
  }
}

function renderSavedDecision() {
  if (!refs.decisionSaved) return;
  const decision = readDecision();
  if (!decision) {
    refs.decisionSaved.innerHTML = '<div class="empty">Nenhuma decisao registrada para o recorte e produto selecionados.</div>';
    return;
  }
  refs.decisionSaved.innerHTML = `
    <div class="decision-card">
      <div>
        <span class="panel-tag">Ultima decisao</span>
        <strong>${escapeHtml(decision.text || "Decisao sem descricao")}</strong>
        <p>${escapeHtml(decision.observation || "Sem observacao adicional.")}</p>
      </div>
      <div class="decision-meta">
        <span>Responsavel: ${escapeHtml(decision.owner || "-")}</span>
        <span>Prazo: ${escapeHtml(decision.dueDate || "-")}</span>
        <span>Data: ${escapeHtml(decision.date || "-")}</span>
        <span class="status-badge info">${escapeHtml(decision.status || "Aberta")}</span>
      </div>
    </div>
  `;
}

function fillDecisionForm(decision = {}) {
  refs.decisionText.value = decision.text || "";
  refs.decisionOwner.value = decision.owner || "";
  refs.decisionDueDate.value = decision.dueDate || "";
  refs.decisionStatus.value = decision.status || "Aberta";
  refs.decisionObservation.value = decision.observation || "";
  refs.decisionDate.value = decision.date || new Date().toISOString().slice(0, 10);
}

function saveDecision(event) {
  event.preventDefault();
  const decision = {
    text: refs.decisionText.value.trim(),
    owner: refs.decisionOwner.value.trim(),
    dueDate: refs.decisionDueDate.value,
    status: refs.decisionStatus.value,
    observation: refs.decisionObservation.value.trim(),
    date: refs.decisionDate.value || new Date().toISOString().slice(0, 10),
    savedAt: new Date().toISOString()
  };
  localStorage.setItem(managerDecisionKey(), JSON.stringify(decision));
  renderSavedDecision();
  showToast("success", "Decisao gerencial salva para o recorte atual.");
}

function refreshClock() {
  refs.currentTime.textContent = new Date().toLocaleTimeString("pt-BR");
}

function bindEvents() {
  [refs.storeFilter, refs.yearFilter, refs.typeFilter, refs.statusFilter].forEach((element) => {
    element.addEventListener("change", () => {
      state.filters.store = refs.storeFilter.value;
      state.filters.year = Number(refs.yearFilter.value || new Date().getFullYear());
      state.filters.type = refs.typeFilter.value;
      state.filters.status = refs.statusFilter.value;
      refs.metaYear.textContent = String(state.filters.year);
      loadGrid({ silent: true });
    });
  });

  refs.refreshBtn.addEventListener("click", () => refreshFromRealtime());
  refs.clearBtn.addEventListener("click", () => {
    state.filters.store = "TODAS";
    state.filters.type = "TODOS";
    state.filters.status = "TODOS";
    state.filters.year = new Date().getFullYear();
    syncFiltersFromData();
    loadGrid();
  });

  refs.quickStoreFilter?.addEventListener("click", (event) => {
    const button = event.target.closest('[data-action="select-store-chip"]');
    if (!button) return;
    state.filters.store = button.dataset.store || "TODAS";
    refs.storeFilter.value = state.filters.store;
    renderQuickStoreFilter();
    loadGrid({ silent: true });
  });

  refs.gridState.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]");
    if (!action) return;
    if (action.dataset.action === "retry-grid") loadGrid();
    if (action.dataset.action === "clear-filters") refs.clearBtn.click();
  });

  refs.gridTable.addEventListener("click", (event) => {
    const button = event.target.closest('[data-action="open-cell"]');
    if (button) openDrawerFromCell(button);
  });

  refs.drawerClose.addEventListener("click", closeDrawer);
  refs.drawerBackdrop.addEventListener("click", closeDrawer);

  refs.drawerBody.addEventListener("click", async (event) => {
    const action = event.target.closest("[data-action]");
    if (!action) return;

    if (action.dataset.action === "select-note") {
      await loadItems(action.dataset.noteKey);
      return;
    }
    if (action.dataset.action === "load-more-notes") {
      state.notesPage += 1;
      await loadNotes({ append: true });
      return;
    }
    if (action.dataset.action === "retry-notes") {
      state.notesPage = 0;
      await loadNotes();
      return;
    }
    if (action.dataset.action === "retry-items" && state.selectedNoteKey) {
      await loadItems(state.selectedNoteKey);
      return;
    }
    if (action.dataset.action === "save-cell") {
      await saveCell();
      return;
    }
    if (action.dataset.action === "save-note") {
      await saveNote();
      return;
    }
    if (action.dataset.action === "apply-note-classification-to-items") {
      applyNoteClassificationToItems();
      return;
    }
    if (action.dataset.action === "save-item-reason") {
      await saveSingleItemReason(action.dataset.itemId);
      return;
    }
    if (action.dataset.action === "save-all-item-reasons") {
      await saveAllItemReasons();
    }
  });

  refs.drawerBody.addEventListener("change", (event) => {
    const select = event.target.closest("[data-action='set-item-reason']");
    if (select) updateItemReasonRow(select);
  });

  [
    refs.managerMonthFilter,
    refs.managerYearFilter,
    refs.managerStoreFilter,
    refs.managerSectorFilter,
    refs.managerProductFilter,
    refs.managerTypeFilter,
    refs.managerReasonFilter
  ].filter(Boolean).forEach((element) => {
    element.addEventListener("change", () => {
      syncManagerStateFromFilters();
      state.manager.aiResult = null;
      resetAiChat();
      if (refs.aiAnalysisResult) refs.aiAnalysisResult.innerHTML = '<div class="empty">O recorte mudou. Clique em Analisar com IA para gerar uma nova leitura.</div>';
      loadManagerData({ silent: true });
    });
  });

  refs.managerRefreshBtn?.addEventListener("click", () => {
    syncManagerStateFromFilters();
    loadManagerData();
  });
  refs.noteReportExportBtn?.addEventListener("click", exportNoteReportCsv);

  refs.aiAnalyzeBtn?.addEventListener("click", analyzeWithAi);
  refs.aiChatForm?.addEventListener("submit", sendAiChatMessage);
  refs.aiChatClearBtn?.addEventListener("click", () => resetAiChat("Nova conversa iniciada."));

  document.getElementById("analiseGerencial")?.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]");
    if (!action) return;
    if (action.dataset.action === "select-manager-product") {
      state.manager.selectedKey = action.dataset.key;
      renderManager();
      fillDecisionForm(readDecision() || {});
    }
  });

  refs.decisionForm?.addEventListener("submit", saveDecision);
  refs.decisionClearBtn?.addEventListener("click", () => {
    fillDecisionForm({});
    localStorage.removeItem(managerDecisionKey());
    renderSavedDecision();
    showToast("success", "Decisao removida do recorte atual.");
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") scheduleRealtimeRefresh(null, 150);
  });

  window.addEventListener("beforeunload", () => {
    clearTimeout(state.realtimeTimer);
    state.realtimeCleanup?.();
  });
}

async function init() {
  await ensureAuthenticated({
    connectionBadge: refs.connectionBadge,
    lastSyncLabel: refs.lastSyncLabel,
    pageLabel: "fechamento mensal"
  });

  refreshClock();
  window.setInterval(refreshClock, 1000);
  bindEvents();
  clearFechamentoCache();
  await loadGrid();
  syncFiltersFromData();
  state.manager.filters.year = state.filters.year;
  syncManagerFiltersFromData();
  fillDecisionForm({});
  await loadManagerData({ silent: true });
  try {
    state.realtimeCleanup = await subscribeRealtime((payload) => scheduleRealtimeRefresh(payload));
  } catch (error) {
    console.error("[Fechamento Realtime]", error);
    setStatus("warning", "Dados carregados, mas a atualizacao automatica esta temporariamente indisponivel.");
  }
}

init().catch((error) => {
  console.error(error);
  setStatus("error", error.userMessage || error.message || "Nao foi possivel iniciar a tela de fechamento.");
});
