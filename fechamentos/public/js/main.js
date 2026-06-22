import { brl, formatDate, groupItemsByNote, normalizeReason } from "./services/classificacao.js";
import { clearDatabase, deleteNote, getPersistenceInfo, importXmlFiles, loadAllData, updateCompetenceMonthForNote, updateItemField, updateReasonForNote, updateSectorForNote } from "./services/importacao.js";
import { applyFilters, buildNoteOptions, refreshFilters } from "./services/filtros.js";
import { exportCsv, openPrintReport, renderClassification, renderDashboard, renderItems } from "./services/dashboard.js";
import { subscribeRealtime } from "./services/realtime.js";
import { initUi, touchLastSync } from "./services/ui.js";
import { searchNf as searchNfService, loadNfItems } from "./services/notas.js";

const refs = {
  basis: document.getElementById("basis"),
  storeFilter: document.getElementById("storeFilter"),
  typeFilter: document.getElementById("typeFilter"),
  sectorFilter: document.getElementById("sectorFilter"),
  reasonFilter: document.getElementById("reasonFilter"),
  monthFilter: document.getElementById("monthFilter"),
  noteStoreFilter: document.getElementById("noteStoreFilter"),
  noteMonthFilter: document.getElementById("noteMonthFilter"),
  noteSelect: document.getElementById("noteSelect"),
  applyAll: document.getElementById("applyAll"),
  applySelected: document.getElementById("applySelected"),
  applyAllBtn: document.getElementById("applyAllBtn"),
  applySelectedBtn: document.getElementById("applySelectedBtn"),
  selectAll: document.getElementById("selectAll"),
  xmlFiles: document.getElementById("xmlFiles"),
  xmlFolder: document.getElementById("xmlFolder"),
  clearDatabaseBtn: document.getElementById("clearDatabaseBtn"),
  productSearch: document.getElementById("productSearch"),
  pendingOnlyBtn: document.getElementById("pendingOnlyBtn"),
  csvBtn: document.getElementById("csvBtn"),
  reportBtn: document.getElementById("reportBtn"),
  classBody: document.getElementById("classBody"),
  noteSummary: document.getElementById("noteSummary"),
  itemsBody: document.getElementById("itemsBody"),
  productSummary: document.getElementById("productSummary"),
  storesBody: document.getElementById("storesBody"),
  sectorBox: document.getElementById("sectorBox"),
  productRanking: document.getElementById("productRanking"),
  monthChart: document.getElementById("monthChart"),
  typeChart: document.getElementById("typeChart"),
  sectorChart: document.getElementById("sectorChart"),
  sectorChartEmpty: document.getElementById("sectorChartEmpty"),
  sectorChartSummary: document.getElementById("sectorChartSummary"),
  pendingExecutive: document.getElementById("pendingExecutive"),
  pendingExecutiveTitle: document.getElementById("pendingExecutiveTitle"),
  pendingExecutiveText: document.getElementById("pendingExecutiveText"),
  pendingExecutiveBadge: document.getElementById("pendingExecutiveBadge"),
  pendingItemsCount: document.getElementById("pendingItemsCount"),
  pendingNotesCount: document.getElementById("pendingNotesCount"),
  pendingCompletion: document.getElementById("pendingCompletion"),
  pendingFocus: document.getElementById("pendingFocus"),
  pendingFocusMeta: document.getElementById("pendingFocusMeta"),
  pendingKpiCard: document.getElementById("pendingKpiCard"),
  kpiNotes: document.getElementById("kpiNotes"),
  kpiTotal: document.getElementById("kpiTotal"),
  kpiLoss: document.getElementById("kpiLoss"),
  kpiUsage: document.getElementById("kpiUsage"),
  kpiPending: document.getElementById("kpiPending"),
  kpiPendingMeta: document.getElementById("kpiPendingMeta"),
  kpiStore: document.getElementById("kpiStore"),
  statusBanner: document.getElementById("statusBanner"),
  loadingOverlay: document.getElementById("loadingOverlay"),
  loadingText: document.getElementById("loadingText"),
  loadingProgressShell: document.getElementById("loadingProgressShell"),
  loadingProgressMeta: document.getElementById("loadingProgressMeta"),
  loadingProgressBar: document.getElementById("loadingProgressBar"),
  toast: document.getElementById("toast"),
  importSummaryModal: document.getElementById("importSummaryModal"),
  importSummaryTitle: document.getElementById("importSummaryTitle"),
  importSummaryContent: document.getElementById("importSummaryContent"),
  importSummaryClose: document.getElementById("importSummaryClose"),
  resetImportModal: document.getElementById("resetImportModal"),
  resetImportClose: document.getElementById("resetImportClose"),
  resetImportConfirmBtn: document.getElementById("resetImportConfirmBtn"),
  resetImportConfirmInput: document.getElementById("resetImportConfirmInput"),
  resetImportMonthlyToggle: document.getElementById("resetImportMonthlyToggle"),
  themeToggle: document.getElementById("themeToggle"),
  themeToggleLabel: document.getElementById("themeToggleLabel"),
  currentDate: document.getElementById("currentDate"),
  currentWeekday: document.getElementById("currentWeekday"),
  currentTime: document.getElementById("currentTime"),
  connectionBadge: document.getElementById("connectionBadge"),
  lastSyncLabel: document.getElementById("lastSyncLabel"),
  nfNumberInput: document.getElementById("nfNumberInput"),
  nfReadBarcodeBtn: document.getElementById("nfReadBarcodeBtn"),
  nfSearchBtn: document.getElementById("nfSearchBtn"),
  nfSearchResult: document.getElementById("nfSearchResult"),
  nfResultNumber: document.getElementById("nfResultNumber"),
    nfResultItems: document.getElementById("nfResultItems"),
    nfResultChave: document.getElementById("nfResultChave"),
  nfResultSupplier: document.getElementById("nfResultSupplier"),
  nfResultValue: document.getElementById("nfResultValue"),
  nfResultDate: document.getElementById("nfResultDate"),
  nfItemsBody: document.getElementById("nfItemsBody"),
  nfMultipleSelect: document.getElementById("nfMultipleSelect"),
  nfStoreSelect: document.getElementById("nfStoreSelect"),
  nfSectorSelect: document.getElementById("nfSectorSelect"),
  nfCompetenceSelect: document.getElementById("nfCompetenceSelect"),
  nfAutoUpdateToggle: document.getElementById("nfAutoUpdateToggle"),
  nfSaveLaunchBtn: document.getElementById("nfSaveLaunchBtn"),
  nfLaunchFeedback: document.getElementById("nfLaunchFeedback"),
  nfSuggestionBox: document.getElementById("nfSuggestionBox"),
  nfApplySuggestionBtn: document.getElementById("nfApplySuggestionBtn"),
  nfReviewBody: document.getElementById("nfReviewBody"),
  nfResultStatus: document.getElementById("nfResultStatus"),
  nfImpactPanel: document.getElementById("nfImpactPanel")
};

const NF_HISTORY_KEY = "razarth-fechamento-inteligente-history-v1";

// Ciclo de status: PENDING -> CLASSIFIED -> CONFIRMED -> CLOSED
// Regra: NF CLOSED não pode ser sobrescrita sem desfazer primeiro.
const NF_STATUS = {
  PENDING: "PENDING",
  CLASSIFIED: "CLASSIFIED",
  CONFIRMED: "CONFIRMED",
  CLOSED: "CLOSED"
};

const NF_STATUS_LABEL = {
  PENDING: "Pendente",
  CLASSIFIED: "Classificada",
  CONFIRMED: "Confirmada",
  CLOSED: "Fechada"
};

const NF_STATUS_BADGE = {
  PENDING: "warning",
  CLASSIFIED: "info",
  CONFIRMED: "success",
  CLOSED: "neutral"
};

const NF_STATUS_NEXT = {
  PENDING: NF_STATUS.CLASSIFIED,
  CLASSIFIED: NF_STATUS.CONFIRMED,
  CONFIRMED: NF_STATUS.CLOSED,
  CLOSED: null
};

const NF_STATUS_NEXT_LABEL = {
  PENDING: "Classificar",
  CLASSIFIED: "Confirmar",
  CONFIRMED: "Fechar",
  CLOSED: null
};
const MONTH_LABELS = {
  jan: "Janeiro",
  fev: "Fevereiro",
  mar: "Marco",
  abr: "Abril",
  mai: "Maio",
  jun: "Junho",
  jul: "Julho",
  ago: "Agosto",
  set: "Setembro",
  out: "Outubro",
  nov: "Novembro",
  dez: "Dezembro"
};
const MONTH_ORDER = {
  jan: 1,
  fev: 2,
  mar: 3,
  abr: 4,
  mai: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  set: 9,
  out: 10,
  nov: 11,
  dez: 12
};

const state = {
  items: [],
  notes: [],
  filtered: [],
  totals: {
    bankNotes: 0,
    bankItems: 0,
    filteredNotes: 0,
    displayedNotes: 0,
    orphanNotes: 0
  },
  monthChart: null,
  typeChart: null,
  sectorChart: null,
  realtimeCleanup: null,
  realtimeTimer: null,
  toastTimer: null,
  uiCleanup: null,
  nfModule: {
    currentNote: null,
    entries: [],
    suggestion: null
  }
};

function sanitizeText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeInvoiceNumber(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatCompetenceLabel(value) {
  const [monthKey, year] = String(value || "").toLowerCase().split("/");
  if (!monthKey || !year) return "Competencia nao definida";
  return `${MONTH_LABELS[monthKey] || monthKey}/${year}`;
}

function monthSortValue(value) {
  const [monthKey, yearValue] = String(value || "").toLowerCase().split("/");
  const year = Number(yearValue || 0);
  const month = MONTH_ORDER[monthKey] || 0;
  return (year * 100) + month;
}

function inferStoreCode(store) {
  const text = String(store || "").toUpperCase();
  if (text.includes("CD")) return "CD";
  if (text.includes("07")) return "SOL7";
  if (text.includes("04")) return "SOL4";
  if (text.includes("03")) return "SOL3";
  if (text.includes("02")) return "SOL2";
  return "SOL1";
}

function buildCompetenceByDate(dateValue) {
  const date = new Date(dateValue || "");
  if (Number.isNaN(date.getTime())) return "mar/2026";
  const ref = new Date(date);
  ref.setMonth(ref.getMonth() - 1);
  const monthKey = ref.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toLowerCase();
  return `${monthKey}/${ref.getFullYear()}`;
}

function readNfEntries() {
  try {
    const raw = window.localStorage.getItem(NF_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("[nf-module] Falha ao ler historico local:", error);
    return [];
  }
}

function persistNfEntries() {
  window.localStorage.setItem(NF_HISTORY_KEY, JSON.stringify(state.nfModule.entries));
}

function setNfSuggestion(noteData) {
  if (!refs.nfSuggestionBox || !refs.nfApplySuggestionBtn) return;
  const sameSupplier = state.nfModule.entries.filter((entry) => entry.fornecedor === noteData.fornecedor);
  if (!sameSupplier.length) {
    state.nfModule.suggestion = null;
    refs.nfSuggestionBox.innerHTML = `
      <strong>Nenhuma sugestao ainda</strong>
      <span>Sem historico para o fornecedor ${sanitizeText(noteData.fornecedor)}. O sistema passa a sugerir automaticamente apos os primeiros lancamentos.</span>
      <button id="nfApplySuggestionBtn" type="button" disabled>Aplicar</button>
    `;
    refs.nfApplySuggestionBtn = document.getElementById("nfApplySuggestionBtn");
    return;
  }

  const habits = sameSupplier.reduce((acc, entry) => {
    const key = `${entry.loja}|${entry.setor}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const [habitKey] = Object.entries(habits).sort((a, b) => b[1] - a[1])[0];
  const [loja, setor] = habitKey.split("|");
  state.nfModule.suggestion = { loja, setor };
  refs.nfSuggestionBox.innerHTML = `
    <strong>Sugestao encontrada</strong>
    <span>Fornecedor: ${sanitizeText(noteData.fornecedor)}</span>
    <span>Destino habitual: ${sanitizeText(loja)} -> ${sanitizeText(setor)}</span>
    <button id="nfApplySuggestionBtn" type="button">Aplicar</button>
  `;
  refs.nfApplySuggestionBtn = document.getElementById("nfApplySuggestionBtn");
  refs.nfApplySuggestionBtn.addEventListener("click", applySuggestionDestination);
}

function applySuggestionDestination() {
  if (!state.nfModule.suggestion || !refs.nfStoreSelect || !refs.nfSectorSelect) return;
  const { loja, setor } = state.nfModule.suggestion;
  if ([...refs.nfStoreSelect.options].some((option) => option.value === loja)) refs.nfStoreSelect.value = loja;
  if ([...refs.nfSectorSelect.options].some((option) => option.value === setor)) refs.nfSectorSelect.value = setor;
  showToast("success", "Destino habitual aplicado na distribuicao.");
}

function renderReview() {
  if (!refs.nfReviewBody) return;
  const rows = [...state.nfModule.entries].sort((a, b) => String(b.criadoEm || "").localeCompare(String(a.criadoEm || "")));
  if (!rows.length) {
    refs.nfReviewBody.innerHTML = '<tr><td colspan="8"><div class="empty">Nenhuma NF classificada ainda.</div></td></tr>';
    return;
  }

  refs.nfReviewBody.innerHTML = rows.map((entry) => {
    const status = entry.status || NF_STATUS.PENDING;
    const badgeClass = NF_STATUS_BADGE[status] || "warning";
    const statusLabel = NF_STATUS_LABEL[status] || status;
    const nextStatus = NF_STATUS_NEXT[status];
    const nextLabel = NF_STATUS_NEXT_LABEL[status];
    const isClosed = status === NF_STATUS.CLOSED;
    const advanceBtn = nextStatus
      ? `<button type="button" data-action="advance" data-id="${sanitizeText(entry.id)}">${sanitizeText(nextLabel)}</button>`
      : "";
    return `<tr>
      <td>${sanitizeText(entry.numeroNF)}</td>
      <td>${sanitizeText(entry.loja)}</td>
      <td>${sanitizeText(entry.setor)}</td>
      <td>${sanitizeText(formatCompetenceLabel(entry.competencia))}</td>
      <td>${brl(entry.valor)}</td>
      <td>${sanitizeText(entry.usuario || "Operador")}</td>
      <td><span class="status-badge ${badgeClass}">${sanitizeText(statusLabel)}</span></td>
      <td>
        <div class="inline-edit">
          ${advanceBtn}
          <button type="button" data-action="open" data-id="${sanitizeText(entry.id)}">Abrir</button>
          ${isClosed ? "" : `<button type="button" data-action="edit" data-id="${sanitizeText(entry.id)}">Editar</button>`}
          ${isClosed ? "" : `<button type="button" data-action="undo" data-id="${sanitizeText(entry.id)}">Desfazer</button>`}
          <button type="button" data-action="history" data-id="${sanitizeText(entry.id)}">Historico</button>
        </div>
      </td>
    </tr>`;
  }).join("");
}

function setNfSearchResult(noteData) {
  if (!refs.nfSearchResult) return;
  state.nfModule.currentNote = noteData;
  refs.nfResultNumber.textContent = noteData.numeroNF;
  refs.nfResultSupplier.textContent = noteData.fornecedor;
  refs.nfResultValue.textContent = brl(noteData.valor);
  refs.nfResultDate.textContent = formatDate(noteData.data);
  if (refs.nfResultItems) refs.nfResultItems.textContent = noteData.totalItens ? `${noteData.totalItens} item(s)` : "-";
  if (refs.nfResultChave) {
    const chave = noteData.chaveNfe || "";
    refs.nfResultChave.textContent = chave ? `${chave.slice(0, 6)}...${chave.slice(-6)}` : "-";
    refs.nfResultChave.title = chave;
  }
  refs.nfSearchResult.hidden = false;
  const nfMultiPanel = document.getElementById("nfMultipleResults");
  if (nfMultiPanel && !nfMultiPanel.hidden && nfMultiPanel.dataset.autoHide !== "false") nfMultiPanel.hidden = true;

  if ([...refs.nfStoreSelect.options].some((option) => option.value === noteData.loja)) refs.nfStoreSelect.value = noteData.loja;
  if ([...refs.nfSectorSelect.options].some((option) => option.value === noteData.setor)) refs.nfSectorSelect.value = noteData.setor;
  if ([...refs.nfCompetenceSelect.options].some((option) => option.value === noteData.competencia)) refs.nfCompetenceSelect.value = noteData.competencia;
  if (refs.nfLaunchFeedback) refs.nfLaunchFeedback.hidden = true;
  if (refs.nfResultStatus) {
    const existing = state.nfModule.entries.find((e) => e.numeroNF === noteData.numeroNF);
    if (existing) {
      refs.nfResultStatus.textContent = NF_STATUS_LABEL[existing.status] || existing.status;
      refs.nfResultStatus.className = `status-badge ${NF_STATUS_BADGE[existing.status] || "info"}`;
    } else {
      refs.nfResultStatus.textContent = "Nova";
      refs.nfResultStatus.className = "";
    }
  }
  setNfSuggestion(noteData);
  renderImpactPreview();
  renderNfItems(noteData.itens || []);
}

function renderNfItems(items) {
  if (!refs.nfItemsBody) return;
  if (!items.length) {
    refs.nfItemsBody.innerHTML = '<tr><td colspan="6"><div class="empty">Nenhum item encontrado para esta NF.</div></td></tr>';
    return;
  }
  refs.nfItemsBody.innerHTML = items.map((item) => `
    <tr>
      <td>${sanitizeText(item.produto)}</td>
      <td>${sanitizeText(item.quantidade)}</td>
      <td>${brl(item.valorUnitario)}</td>
      <td>${brl(item.valor)}</td>
      <td>${sanitizeText(item.setor || "-")}</td>
      <td>${sanitizeText(item.motivo || "-")}</td>
    </tr>
  `).join("");
}

function handleNfMultipleResults(results) {
  const container = document.getElementById("nfMultipleResults");
  if (!container) {
    setNfSearchResult(results[0]);
    showToast("info", `${results.length} notas com este numero. Exibindo: ${results[0].lojaOriginal}.`);
    return;
  }
  container.dataset.autoHide = "false";
  container.hidden = false;
  const select = document.getElementById("nfMultipleSelect");
  if (select) {
    select.innerHTML = results.map((r, i) =>
      `<option value="${i}">${sanitizeText(r.lojaOriginal)} \u2014 ${brl(r.valor)} \u2014 ${sanitizeText(formatDate(r.data))}</option>`
    ).join("");
    select.dataset.results = JSON.stringify(results);
  }
  setNfSearchResult(results[0]);
  showToast("info", `${results.length} notas encontradas. Selecione a loja correta acima.`);
}

async function handleNfMultipleSelectionChange() {
  const select = document.getElementById("nfMultipleSelect");
  if (!select?.dataset.results) return;
  try {
    const results = JSON.parse(select.dataset.results);
    const selected = results[Number(select.value || 0)] || results[0];
    if (!selected) return;
    setNfSearchResult(selected);
    if (selected.noteKey) {
      const noteItems = await loadNfItems(selected.noteKey);
      renderNfItems(noteItems);
      state.nfModule.currentNote = { ...selected, itens: noteItems, totalItens: noteItems.length };
      setNfSuggestion({ ...selected, itens: noteItems, totalItens: noteItems.length });
    }
  } catch (error) {
    console.error("[nf-multiple-select]", error);
  }
}

async function searchNf() {
  if (!refs.nfNumberInput) return;
  const invoice = normalizeInvoiceNumber(refs.nfNumberInput.value);
  if (!invoice) {
    showToast("warning", "Informe um numero de NF para buscar.");
    return;
  }
  const multiPanel = document.getElementById("nfMultipleResults");
  if (multiPanel) { multiPanel.hidden = true; multiPanel.dataset.autoHide = "true"; }
  setLoading(true, `Buscando NF ${invoice} no banco...`);
  try {
    const results = await searchNfService(invoice, state.notes);
    if (!results || !results.length) {
      if (refs.nfSearchResult) refs.nfSearchResult.hidden = true;
      renderNfItems([]);
      showToast("warning", `NF ${invoice} nao encontrada. Verifique se foi importada.`);
      return;
    }
    if (results.length > 1) {
      handleNfMultipleResults(results);
    } else {
      setNfSearchResult(results[0]);
      if (results[0].noteKey) {
        const noteItems = await loadNfItems(results[0].noteKey);
        renderNfItems(noteItems);
        state.nfModule.currentNote = { ...results[0], itens: noteItems, totalItens: noteItems.length };
        setNfSuggestion({ ...results[0], itens: noteItems, totalItens: noteItems.length });
      }
      showToast("success", `NF ${invoice} \u2014 ${results[0].lojaOriginal} \u2014 ${brl(results[0].valor)}.`);
    }
  } catch (error) {
    console.error("[searchNf]", error);
    showToast("error", error.userMessage || `Erro ao buscar NF ${invoice}. Verifique a conexao.`);
  } finally {
    setLoading(false);
  }
}

function buildNfVinculo(entry) {
  // Estrutura pronta para vínculo com fechamento mensal no Supabase
  return {
    nfId: entry.id,
    nfNumero: entry.numeroNF,
    lojaId: entry.loja,
    setorId: entry.setor,
    competenciaId: entry.competencia,
    valor: entry.valor,
    fornecedorId: entry.fornecedor,
    status: entry.status,
    criadoEm: entry.criadoEm,
    confirmedAt: entry.confirmedAt || null,
    closedAt: entry.closedAt || null
  };
}

function saveAndLaunch() {
  const current = state.nfModule.currentNote;
  if (!current) {
    showToast("warning", "Busque uma NF antes de salvar o lancamento.");
    return;
  }

  const loja = refs.nfStoreSelect.value;
  const competencia = refs.nfCompetenceSelect.value;

  // Bloqueio de duplicidade: mesma NF + loja + competência
  const duplicate = state.nfModule.entries.find(
    (item) =>
      item.numeroNF === current.numeroNF &&
      item.loja === loja &&
      item.competencia === competencia &&
      item.status !== NF_STATUS.PENDING
  );
  if (duplicate) {
    const statusLabel = NF_STATUS_LABEL[duplicate.status] || duplicate.status;
    showToast("warning", `NF ${current.numeroNF} ja lancada neste fechamento (${statusLabel}). Desfaca antes de reclassificar.`);
    return;
  }

  // NF CLOSED nunca pode ser sobrescrita
  const closed = state.nfModule.entries.find(
    (item) =>
      item.numeroNF === current.numeroNF &&
      item.loja === loja &&
      item.competencia === competencia &&
      item.status === NF_STATUS.CLOSED
  );
  if (closed) {
    showToast("warning", `NF ${current.numeroNF} esta Fechada. Desfaca o lancamento primeiro para reclassificar.`);
    return;
  }

  const now = new Date().toISOString();
  const entry = {
    id: `${current.numeroNF}-${Date.now()}`,
    numeroNF: current.numeroNF,
    loja,
    setor: refs.nfSectorSelect.value,
    competencia,
    valor: current.valor,
    // Ao salvar manualmente o status inicial é CLASSIFIED (já foi triada)
    status: NF_STATUS.CLASSIFIED,
    criadoEm: now,
    atualizadoEm: now,
    usuario: "Operador",
    fornecedor: current.fornecedor,
    atualizarAutomatico: refs.nfAutoUpdateToggle.checked,
    historico: [{ status: NF_STATUS.CLASSIFIED, em: now, usuario: "Operador" }]
  };

  // Remove eventual PENDING anterior para a mesma NF+competência (rascunho)
  state.nfModule.entries = state.nfModule.entries.filter(
    (item) => !(item.numeroNF === entry.numeroNF && item.competencia === entry.competencia && item.status === NF_STATUS.PENDING)
  );
  state.nfModule.entries.push(entry);
  persistNfEntries();
  renderReview();
  renderNfRevisao();
  renderNfHistorico();

  console.log("[nf-module] vinculo pronto para Supabase:", buildNfVinculo(entry));

  if (refs.nfLaunchFeedback) {
    refs.nfLaunchFeedback.hidden = false;
    refs.nfLaunchFeedback.innerHTML = `<strong>NF ${sanitizeText(entry.numeroNF)} lancada:</strong><span>${sanitizeText(entry.loja)} \u2192 ${sanitizeText(entry.setor)} \u2192 ${sanitizeText(formatCompetenceLabel(entry.competencia))}</span>`;
  }

  showToast("success", `NF ${entry.numeroNF} classificada em ${entry.loja} / ${entry.setor}.`);
  setNfSuggestion({ ...current, loja: entry.loja, setor: entry.setor });
}

function openNfEntryById(entryId, editingMode = false) {
  const entry = state.nfModule.entries.find((item) => item.id === entryId);
  if (!entry) return;
  refs.nfNumberInput.value = entry.numeroNF;
  setNfSearchResult({
    numeroNF: entry.numeroNF,
    fornecedor: entry.fornecedor || "Fornecedor nao identificado",
    valor: Number(entry.valor || 0),
    data: entry.criadoEm,
    loja: entry.loja,
    setor: entry.setor,
    competencia: entry.competencia
  });
  refs.nfAutoUpdateToggle.checked = entry.atualizarAutomatico !== false;
  setTab("classif-nf");
  showToast("info", editingMode ? "Registro carregado para edicao visual." : "Registro aberto para conferencia.");
}

function handleNfReviewAction(event) {
  const action = event.target.dataset.action;
  const entryId = event.target.dataset.id;
  if (!action || !entryId) return;

  if (action === "open") {
    openNfEntryById(entryId, false);
    return;
  }

  if (action === "edit") {
    openNfEntryById(entryId, true);
    return;
  }

  const entry = state.nfModule.entries.find((item) => item.id === entryId);
  if (!entry) return;

  if (action === "advance") {
    const nextStatus = NF_STATUS_NEXT[entry.status];
    if (!nextStatus) return;
    const now = new Date().toISOString();
    const patch = { status: nextStatus, atualizadoEm: now };
    if (nextStatus === NF_STATUS.CONFIRMED) patch.confirmedAt = now;
    if (nextStatus === NF_STATUS.CLOSED) patch.closedAt = now;
    const hist = { status: nextStatus, em: now, usuario: "Operador" };
    state.nfModule.entries = state.nfModule.entries.map((item) =>
      item.id === entryId
        ? { ...item, ...patch, historico: [...(item.historico || []), hist] }
        : item
    );
    persistNfEntries();
    renderReview();
    renderNfRevisao();
    renderNfHistorico();
    const label = NF_STATUS_LABEL[nextStatus];
    showToast("success", `NF ${entry.numeroNF} -> ${label}.`);
    return;
  }

  if (action === "undo") {
    if (entry.status === NF_STATUS.CLOSED) {
      showToast("warning", `NF ${entry.numeroNF} esta Fechada. Nao pode ser desfeita.`);
      return;
    }
    state.nfModule.entries = state.nfModule.entries.filter((item) => item.id !== entryId);
    persistNfEntries();
    renderReview();
    renderNfRevisao();
    renderNfHistorico();
    showToast("warning", `Lancamento da NF ${entry.numeroNF} desfeito.`);
    return;
  }

  if (action === "history") {
    const hist = entry.historico || [];
    if (!hist.length) {
      const created = new Date(entry.criadoEm).toLocaleString("pt-BR");
      showToast("info", `NF ${entry.numeroNF}: criada em ${created} por ${entry.usuario || "Operador"}.`);
      return;
    }
    const lines = hist.map((h) => `${NF_STATUS_LABEL[h.status] || h.status} em ${new Date(h.em).toLocaleString("pt-BR")} por ${h.usuario}`).join(" | ");
    showToast("info", `Historico NF ${entry.numeroNF}: ${lines}`, 6000);
  }
}

function randomInvoiceNumber() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function updateNfCompetenceOptions() {
  if (!refs.nfCompetenceSelect) return;
  const selected = refs.nfCompetenceSelect.value;
  const values = new Set(Array.from(refs.nfCompetenceSelect.options).map((option) => option.value));
  state.notes.forEach((note) => {
    if (note.competenceMonth) values.add(note.competenceMonth);
  });

  const sorted = [...values].filter(Boolean).sort((a, b) => monthSortValue(a) - monthSortValue(b));
  refs.nfCompetenceSelect.innerHTML = sorted.map((value) => `<option value="${sanitizeText(value)}">${sanitizeText(formatCompetenceLabel(value))}</option>`).join("");
  if (sorted.includes(selected)) refs.nfCompetenceSelect.value = selected;
}

// ---- API pública do módulo NF (preparação Supabase) ----

function updateMonthlyClosing() {
  const closing = {};
  state.nfModule.entries
    .filter((e) => [NF_STATUS.CLASSIFIED, NF_STATUS.CONFIRMED, NF_STATUS.CLOSED].includes(e.status))
    .forEach((e) => {
      const key = `${e.competencia}|${e.loja}|${e.setor}`;
      if (!closing[key]) closing[key] = { competencia: e.competencia, loja: e.loja, setor: e.setor, total: 0, count: 0 };
      closing[key].total += Number(e.valor || 0);
      closing[key].count += 1;
    });
  return closing;
}

function renderImpactPreview() {
  const panel = document.getElementById("nfImpactPanel");
  if (!panel) return;
  const current = state.nfModule.currentNote;
  if (!current) { panel.hidden = true; return; }
  const loja = refs.nfStoreSelect?.value;
  const setor = refs.nfSectorSelect?.value;
  const competencia = refs.nfCompetenceSelect?.value;
  if (!loja || !setor || !competencia) { panel.hidden = true; return; }
  const closing = updateMonthlyClosing();
  const key = `${competencia}|${loja}|${setor}`;
  const existing = closing[key]?.total || 0;
  const afterLaunch = existing + Number(current.valor || 0);
  const isDuplicate = state.nfModule.entries.some(
    (item) => item.numeroNF === current.numeroNF && item.loja === loja && item.competencia === competencia && item.status !== NF_STATUS.PENDING
  );
  panel.hidden = false;
  if (isDuplicate) {
    panel.className = "nf-impact-panel nf-impact-dup";
    panel.innerHTML = `<strong>NF ja lancada neste fechamento</strong><span>${sanitizeText(loja)} \u2192 ${sanitizeText(setor)} \u2192 ${sanitizeText(formatCompetenceLabel(competencia))}</span>`;
    return;
  }
  panel.className = "nf-impact-panel";
  panel.innerHTML = `
    <div class="nf-impact-row"><span class="ops-label">Fechamento afetado</span><strong>${sanitizeText(loja)} \u2192 ${sanitizeText(setor)} \u2192 ${sanitizeText(formatCompetenceLabel(competencia))}</strong></div>
    <div class="nf-impact-row"><span class="ops-label">Total atual no mes</span><strong>${brl(existing)}</strong></div>
    <div class="nf-impact-row"><span class="ops-label">Apos lancamento</span><strong>${brl(afterLaunch)}</strong><small class="nf-impact-delta">+${brl(current.valor)}</small></div>
  `;
}

function loadSuggestions(supplierName) {
  return state.nfModule.entries
    .filter((e) => e.fornecedor === supplierName)
    .reduce((acc, e) => {
      const key = `${e.loja}|${e.setor}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
}

function renderNfRevisao() {
  const body = document.getElementById("nfRevisaoBody");
  const statsEl = document.getElementById("nfRevisaoStats");
  const competEl = document.getElementById("nfRevisaoCompet");
  const storeVal = document.getElementById("nfRevisaoStore")?.value || "TODAS";
  const statusVal = document.getElementById("nfRevisaoStatus")?.value || "TODOS";
  const competVal = competEl?.value || "TODAS";
  if (competEl) {
    const cur = competEl.value;
    const vals = new Set(["TODAS"]);
    state.nfModule.entries.forEach((e) => { if (e.competencia) vals.add(e.competencia); });
    const sorted = [...vals].filter(Boolean);
    competEl.innerHTML = sorted.map((v) =>
      v === "TODAS"
        ? `<option value="TODAS">Todas as competencias</option>`
        : `<option value="${sanitizeText(v)}">${sanitizeText(formatCompetenceLabel(v))}</option>`
    ).join("");
    if ([...competEl.options].some((o) => o.value === cur)) competEl.value = cur;
  }
  let rows = [...state.nfModule.entries].sort((a, b) => String(b.criadoEm || "").localeCompare(String(a.criadoEm || "")));
  if (storeVal !== "TODAS") rows = rows.filter((e) => e.loja === storeVal);
  if (statusVal !== "TODOS") rows = rows.filter((e) => e.status === statusVal);
  if (competVal !== "TODAS") rows = rows.filter((e) => e.competencia === competVal);
  const totalValue = rows.reduce((s, e) => s + Number(e.valor || 0), 0);
  if (statsEl) {
    const counts = Object.values(NF_STATUS).reduce((acc, s) => { acc[s] = rows.filter((e) => e.status === s).length; return acc; }, {});
    statsEl.innerHTML = Object.entries(NF_STATUS_LABEL).map(([key, label]) => `
      <article class="ops-metric">
        <span class="ops-label">${sanitizeText(label)}</span>
        <strong>${counts[key] || 0}</strong>
        <small><span class="status-badge ${NF_STATUS_BADGE[key]}">${sanitizeText(label)}</span></small>
      </article>`).join("") + `<article class="ops-metric">
        <span class="ops-label">Valor total</span>
        <strong>${brl(totalValue)}</strong>
        <small>No filtro atual</small>
      </article>`;
  }
  if (!body) return;
  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="8"><div class="empty">Nenhum lancamento no filtro atual.</div></td></tr>';
    return;
  }
  body.innerHTML = rows.map((entry) => {
    const status = entry.status || NF_STATUS.PENDING;
    const badgeClass = NF_STATUS_BADGE[status] || "warning";
    const statusLabel = NF_STATUS_LABEL[status] || status;
    const nextStatus = NF_STATUS_NEXT[status];
    const nextLabel = NF_STATUS_NEXT_LABEL[status];
    const isClosed = status === NF_STATUS.CLOSED;
    const advanceBtn = nextStatus
      ? `<button type="button" data-action="advance" data-id="${sanitizeText(entry.id)}">${sanitizeText(nextLabel)}</button>`
      : "";
    return `<tr>
      <td>${sanitizeText(entry.numeroNF)}</td>
      <td>${sanitizeText(entry.loja)}</td>
      <td>${sanitizeText(entry.setor)}</td>
      <td>${sanitizeText(formatCompetenceLabel(entry.competencia))}</td>
      <td>${brl(entry.valor)}</td>
      <td>${sanitizeText(entry.usuario || "Operador")}</td>
      <td><span class="status-badge ${badgeClass}">${sanitizeText(statusLabel)}</span></td>
      <td><div class="inline-edit">
        ${advanceBtn}
        <button type="button" data-action="open" data-id="${sanitizeText(entry.id)}">Abrir</button>
        ${isClosed ? "" : `<button type="button" data-action="edit" data-id="${sanitizeText(entry.id)}">Editar</button>`}
        ${isClosed ? "" : `<button type="button" data-action="undo" data-id="${sanitizeText(entry.id)}">Desfazer</button>`}
      </div></td>
    </tr>`;
  }).join("");
}

function renderNfHistorico() {
  const body = document.getElementById("nfHistoricoBody");
  if (!body) return;
  const allEvents = [];
  state.nfModule.entries.forEach((entry) => {
    (entry.historico || []).forEach((hist) => {
      allEvents.push({
        nf: entry.numeroNF, loja: entry.loja, setor: entry.setor,
        competencia: entry.competencia, valor: entry.valor,
        status: hist.status, em: hist.em, usuario: hist.usuario
      });
    });
  });
  allEvents.sort((a, b) => String(b.em || "").localeCompare(String(a.em || "")));
  if (!allEvents.length) {
    body.innerHTML = '<div class="empty">Nenhuma transicao de status registrada ainda.</div>';
    return;
  }
  body.innerHTML = allEvents.map((ev) => {
    const badgeClass = NF_STATUS_BADGE[ev.status] || "info";
    const statusLabel = NF_STATUS_LABEL[ev.status] || ev.status;
    const dt = new Date(ev.em).toLocaleString("pt-BR");
    return `<article class="nf-historico-item">
      <div class="nf-historico-head">
        <strong>NF ${sanitizeText(ev.nf)}</strong>
        <span class="status-badge ${badgeClass}">${sanitizeText(statusLabel)}</span>
      </div>
      <div class="nf-historico-meta">${sanitizeText(ev.loja)} \u2192 ${sanitizeText(ev.setor)} \u2192 ${sanitizeText(formatCompetenceLabel(ev.competencia))}</div>
      <div class="nf-historico-meta">${brl(ev.valor)}</div>
      <div class="nf-historico-time">${sanitizeText(dt)} &middot; ${sanitizeText(ev.usuario || "Operador")}</div>
    </article>`;
  }).join("");
}

function setStatus(type, message) {
  refs.statusBanner.className = `status ${type}`;
  refs.statusBanner.textContent = message;
  if (refs.connectionBadge) {
    const labelMap = {
      info: "Sincronizacao em observacao",
      success: "Operacao sincronizada",
      warning: "Atencao ao modo atual",
      error: "Falha na sincronizacao"
    };
    refs.connectionBadge.textContent = labelMap[type] || "Painel operacional";
  }
  touchLastSync(refs, "Status atualizado");
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

function hideToast() {
  clearTimeout(state.toastTimer);
  refs.toast.hidden = true;
}

function setLoading(active, message = "Aguarde enquanto o sistema atualiza as informacoes.") {
  refs.loadingText.textContent = message;
  refs.loadingOverlay.hidden = !active;
}

function updateLoadingProgress(current, total, fileLabel = "") {
  if (!refs.loadingProgressShell || !refs.loadingProgressBar || !refs.loadingProgressMeta) return;
  if (!total) {
    refs.loadingProgressShell.hidden = true;
    refs.loadingProgressBar.style.width = "0%";
    refs.loadingProgressMeta.textContent = "Preparando importacao...";
    return;
  }

  const safeTotal = Math.max(total, 1);
  const percent = Math.min(100, Math.round((current / safeTotal) * 100));
  refs.loadingProgressShell.hidden = false;
  refs.loadingProgressBar.style.width = `${percent}%`;
  refs.loadingProgressMeta.textContent = fileLabel
    ? `Importando ${current} de ${total}: ${fileLabel}`
    : `Importando ${current} de ${total}...`;
}

function closeImportSummary() {
  if (refs.importSummaryModal) refs.importSummaryModal.hidden = true;
}

function isAdminTestModeEnabled() {
  const search = new URLSearchParams(window.location.search);
  const byQuery = ["admin", "modo", "mode", "teste", "test"].some((key) => {
    const value = search.get(key);
    return value === "1" || value === "true" || value === "admin" || value === "teste" || value === "test";
  });
  const byHash = /admin|teste|test/i.test(window.location.hash || "");
  const byPath = /admin/i.test(window.location.pathname || "");
  const byHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const byStorage = window.localStorage.getItem("razarth-admin-mode") === "enabled";
  return byQuery || byHash || byPath || byHost || byStorage;
}

function applyAdminTestModeVisibility() {
  if (!refs.clearDatabaseBtn) return;
  refs.clearDatabaseBtn.hidden = !isAdminTestModeEnabled();
}

function closeResetImportModal() {
  if (refs.resetImportModal) refs.resetImportModal.hidden = true;
  if (refs.resetImportConfirmInput) refs.resetImportConfirmInput.value = "";
  if (refs.resetImportMonthlyToggle) refs.resetImportMonthlyToggle.checked = false;
}

function openResetImportModal() {
  if (!refs.resetImportModal) return;
  refs.resetImportModal.hidden = false;
  refs.resetImportConfirmInput?.focus();
}

function resetScreenState() {
  state.items = [];
  state.notes = [];
  state.filtered = [];
  refreshUi();
}

function buildSummaryErrors(errors) {
  if (!errors.length) return '<div class="empty">Nenhum erro encontrado na importacao.</div>';
  return `<div class="import-summary-list">${errors.map((entry) => `
    <article class="import-summary-item">
      <strong>${entry.file}</strong>
      <span>Loja: ${entry.store}</span>
      <span>Tipo: ${entry.type}</span>
      <span>Nota: ${entry.note}</span>
      <span>Motivo: ${entry.reason}</span>
    </article>
  `).join("")}</div>`;
}

function openImportSummary(result) {
  if (!refs.importSummaryModal || !refs.importSummaryTitle || !refs.importSummaryContent) return;
  refs.importSummaryTitle.textContent = result.errorCount ? "Importacao concluida com pendencias" : "Importacao concluida";
  refs.importSummaryContent.innerHTML = `
    <div class="import-summary-grid">
      <article class="import-summary-card"><span class="label">Arquivos selecionados</span><strong>${result.totalSelectedFiles}</strong></article>
      <article class="import-summary-card"><span class="label">XML encontrados</span><strong>${result.totalXmlFiles}</strong></article>
      <article class="import-summary-card"><span class="label">Importados</span><strong>${result.importedNotes}</strong></article>
      <article class="import-summary-card"><span class="label">Duplicados</span><strong>${result.skippedNotes}</strong></article>
      <article class="import-summary-card"><span class="label">Com erro</span><strong>${result.errorCount}</strong></article>
    </div>
    <section>
      <h4>Arquivos com erro</h4>
      ${buildSummaryErrors(result.errors)}
    </section>
  `;
  refs.importSummaryModal.hidden = false;
}

function syncState(database) {
  state.items = (database.items || [])
    .map((item) => ({ ...item, reason: normalizeReason(item.reason) }))
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  state.notes = groupItemsByNote(state.items, database.notes || []);
  state.totals.bankNotes = (database.notes || []).length;
  state.totals.bankItems = state.items.length;
  state.totals.orphanNotes = state.notes.filter((note) => !note.items?.length).length;
}

function refreshUi() {
  refreshFilters(state, refs);
  state.filtered = applyFilters(state, refs);
  state.totals.filteredNotes = new Set(state.filtered.map((item) => item.noteKey)).size;
  state.totals.displayedNotes = state.totals.filteredNotes;
  buildNoteOptions(state, refs);
  renderDashboard(state, refs);
  renderItems(state, refs);
  renderClassification(state, refs);
  updateNfCompetenceOptions();
  renderNfRevisao();
  renderNfHistorico();
}

async function reloadFromDatabase({ loadingMessage, statusMessage, emptyMessage } = {}) {
  try {
    if (loadingMessage) setLoading(true, loadingMessage);
    const database = await loadAllData();
    syncState(database);
    refreshUi();
    console.log("[Dashboard] Banco oficial:", {
      totalNotasBanco: state.totals.bankNotes,
      totalItensBanco: state.totals.bankItems,
      totalNotasComItens: state.notes.length,
      totalNotasSemItens: state.totals.orphanNotes
    });
    const persistence = getPersistenceInfo();
    if (persistence.mode === "local") {
      const message = state.items.length
        ? `${persistence.detail} Fonte oficial: Supabase. Exibindo ${state.items.length} itens e ${state.notes.length} nota(s) do fallback temporario.`
        : `${persistence.detail} Fonte oficial: Supabase. Nenhum XML visivel no fallback temporario.`;
      setStatus("warning", message);
    } else if (persistence.mode === "remote_partial") {
      const noteMessage = state.notes.length
        ? `${state.notes.length} nota(s) oficial(is) carregada(s) do banco.`
        : "Nenhuma nota oficial foi encontrada no banco.";
      const itemMessage = state.items.length
        ? ` ${state.items.length} item(ns) tambem foram carregados.`
        : " Os itens ainda nao puderam ser lidos do banco.";
      setStatus("warning", `${noteMessage}${itemMessage} ${persistence.detail}`.trim());
    } else if (state.items.length) {
      const metrics = `Banco: ${state.totals.bankNotes} nota(s). Filtro: ${state.totals.filteredNotes} nota(s). Tela: ${state.totals.displayedNotes} nota(s).`;
      const orphanMessage = state.totals.orphanNotes ? ` ${state.totals.orphanNotes} nota(s) estao sem itens associados.` : "";
      setStatus("success", statusMessage || `${metrics}${orphanMessage}`.trim());
    } else if (state.notes.length) {
      const orphanMessage = state.totals.orphanNotes ? ` ${state.totals.orphanNotes} nota(s) estao sem itens associados.` : "";
      setStatus("success", statusMessage || `${state.notes.length} nota(s) carregada(s) do banco.${orphanMessage}`.trim());
    }
    else setStatus("info", emptyMessage || "Nenhum XML importado ainda.");
  } catch (error) {
    setStatus("error", error.userMessage || "Nao foi possivel carregar os dados do painel.");
  } finally {
    setLoading(false);
  }
}

function scheduleRealtimeReload() {
  clearTimeout(state.realtimeTimer);
  state.realtimeTimer = window.setTimeout(() => {
    reloadFromDatabase({ statusMessage: "Dados atualizados automaticamente.", emptyMessage: "Nenhum XML importado ainda." });
  }, 500);
}

function setTab(targetId) {
  document.querySelectorAll(".tabbtn").forEach((button) => button.classList.toggle("is-active", button.dataset.tab === targetId));
  document.querySelectorAll(".tab").forEach((section) => section.classList.toggle("is-active", section.id === targetId));
}

function updateLocalItem(itemId, patch) {
  state.items = state.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item));
  state.notes = groupItemsByNote(state.items, state.notes);
  state.filtered = applyFilters(state, refs);
  renderDashboard(state, refs);
  renderItems(state, refs);
  renderClassification(state, refs);
}

async function handleImport(files) {
  if (!files.length) return;
  const totalFiles = files.length;
  try {
    closeImportSummary();
    updateLoadingProgress(0, 0);
    setStatus("info", `Iniciando a leitura de ${totalFiles} arquivo(s)...`);
    showToast("info", `Importacao iniciada. Processando ${totalFiles} arquivo(s)...`, 0);
    setLoading(true, `Preparando a importacao de ${totalFiles} arquivo(s)...`);
    const result = await importXmlFiles(files, {
      onProgress(progress) {
        setLoading(true, progress.message);
        updateLoadingProgress(progress.current, progress.total, progress.fileLabel);
      }
    });
    await reloadFromDatabase({
      statusMessage: result.importedNotes
        ? `${result.importedNotes} XML(s) importado(s) com sucesso. ${result.skippedNotes} duplicado(s) ignorado(s). ${result.errorCount} com erro.`
        : "Nenhum XML novo foi encontrado para importacao.",
      emptyMessage: "Nenhum XML importado ainda."
    });
    openImportSummary(result);
    if (result.errorCount) {
      showToast("warning", `Importacao concluida com ${result.errorCount} erro(s). Veja o resumo para os detalhes.`);
    } else if (result.importedNotes && result.skippedNotes) {
      showToast("warning", `${result.importedNotes} XML(s) importado(s). ${result.skippedNotes} duplicado(s) foram ignorados.`);
    } else if (result.importedNotes) {
      showToast("success", `${result.importedNotes} XML(s) importado(s) com sucesso.`);
    } else if (result.skippedNotes) {
      setStatus("warning", "Os XMLs selecionados ja existiam e foram ignorados.");
      showToast("warning", "Os XMLs selecionados ja existiam e foram ignorados.");
    } else {
      showToast("info", "Nenhum XML novo foi encontrado para importacao.");
    }
  } catch (error) {
    const message = error.userMessage || "Falha ao enviar XMLs para o banco de dados.";
    setStatus("error", message);
    showToast("error", message);
  } finally {
    refs.xmlFiles.value = "";
    if (refs.xmlFolder) refs.xmlFolder.value = "";
    updateLoadingProgress(0, 0);
    setLoading(false);
    if (!refs.toast.hidden && refs.toast.classList.contains("info")) {
      hideToast();
    }
  }
}

async function handleClearDatabase() {
  const confirmationText = refs.resetImportConfirmInput?.value?.trim();
  if (confirmationText !== "LIMPAR") {
    showToast("warning", "Digite exatamente LIMPAR para confirmar a limpeza.");
    return;
  }

  const includeMonthlyClosing = Boolean(refs.resetImportMonthlyToggle?.checked);

  try {
    closeResetImportModal();
    closeImportSummary();
    updateLoadingProgress(0, 0);
    setLoading(true, includeMonthlyClosing ? "Limpando importacoes e fechamento mensal..." : "Limpando loss_items e loss_notes...");
    setStatus("warning", includeMonthlyClosing
      ? "Limpando dados de importacao e apoio do fechamento mensal..."
      : "Limpando os dados atuais de importacao do banco...");
    await clearDatabase({ includeMonthlyClosing });
    resetScreenState();
    await reloadFromDatabase({
      statusMessage: "Banco limpo com sucesso.",
      emptyMessage: "Banco limpo. Nenhum XML importado ainda."
    });
    showToast("success", includeMonthlyClosing
      ? "Dados de importacao e fechamento mensal limpos com sucesso."
      : "Dados de importacao limpos com sucesso.");
  } catch (error) {
    console.error("[reset-import-data]", error);
    const message = error.userMessage || "Nao foi possivel limpar o banco.";
    setStatus("error", message);
    showToast("error", message);
  } finally {
    updateLoadingProgress(0, 0);
    setLoading(false);
  }
}

async function handleBulkReason(onlySelected) {
  const noteKey = refs.noteSelect.value;
  const reason = normalizeReason(onlySelected ? refs.applySelected.value : refs.applyAll.value);
  if (!noteKey || !reason) {
    showToast("warning", "Selecione a nota e o motivo antes de aplicar.");
    return;
  }

  try {
    setLoading(true, "Salvando classificacao...");
    await updateReasonForNote(noteKey, reason, onlySelected);
    await reloadFromDatabase({ statusMessage: "Classificacao atualizada automaticamente." });
    refs.noteSelect.value = noteKey;
    renderClassification(state, refs);
    showToast("success", "Motivo salvo com sucesso.");
  } catch (error) {
    setStatus("error", error.userMessage || "Nao foi possivel atualizar o motivo.");
  } finally {
    setLoading(false);
  }
}

function bindEvents() {
  window.addEventListener("app-theme-change", () => {
    if (state.items.length) refreshUi();
  });

  refs.pendingOnlyBtn?.addEventListener("click", () => {
    const active = refs.pendingOnlyBtn.getAttribute("aria-pressed") === "true";
    refs.pendingOnlyBtn.setAttribute("aria-pressed", String(!active));
    refreshUi();
    if (state.items.length) {
      setStatus("success", !active ? `${state.filtered.length} item(ns) pendente(s) no filtro atual.` : `${state.filtered.length} item(ns) no filtro atual.`);
    }
  });

  refs.xmlFiles.addEventListener("change", (event) => handleImport([...event.target.files]));
  refs.xmlFolder?.addEventListener("change", (event) => handleImport([...event.target.files]));
  refs.clearDatabaseBtn?.addEventListener("click", openResetImportModal);
  refs.importSummaryClose?.addEventListener("click", closeImportSummary);
  refs.importSummaryModal?.addEventListener("click", (event) => {
    if (event.target === refs.importSummaryModal) closeImportSummary();
  });
  refs.resetImportClose?.addEventListener("click", closeResetImportModal);
  refs.resetImportConfirmBtn?.addEventListener("click", handleClearDatabase);
  refs.resetImportModal?.addEventListener("click", (event) => {
    if (event.target === refs.resetImportModal) closeResetImportModal();
  });

  [refs.basis, refs.storeFilter, refs.typeFilter, refs.sectorFilter, refs.reasonFilter, refs.monthFilter].forEach((element) => {
    element.addEventListener("change", () => {
      refreshUi();
      if (state.items.length) setStatus("success", `${state.filtered.length} item(ns) no filtro atual.`);
    });
  });

  [refs.noteStoreFilter, refs.noteMonthFilter].forEach((element) => {
    element.addEventListener("change", () => {
      buildNoteOptions(state, refs);
      renderClassification(state, refs);
    });
  });

  refs.noteSelect.addEventListener("change", () => renderClassification(state, refs));
  refs.productSearch.addEventListener("input", () => renderItems(state, refs));
  refs.applyAllBtn.addEventListener("click", () => handleBulkReason(false));
  refs.applySelectedBtn.addEventListener("click", () => handleBulkReason(true));

  refs.selectAll.addEventListener("change", async (event) => {
    const noteKey = refs.noteSelect.value;
    if (!noteKey) return;
    const note = state.notes.find((entry) => entry.key === noteKey);
    if (!note) return;
    try {
      setLoading(true, "Atualizando selecao...");
      for (const item of note.items) await updateItemField(item.id, { selected: event.target.checked });
      await reloadFromDatabase({ statusMessage: "Selecao atualizada automaticamente." });
      refs.noteSelect.value = noteKey;
      renderClassification(state, refs);
    } catch (error) {
      setStatus("error", error.userMessage || "Nao foi possivel atualizar a selecao.");
    } finally {
      setLoading(false);
    }
  });

  refs.classBody.addEventListener("change", async (event) => {
    const action = event.target.dataset.action;
    const itemId = event.target.dataset.id;
    if (!action || !itemId) return;

    if (action === "toggle-selected") {
      updateLocalItem(itemId, { selected: event.target.checked });
      try {
        await updateItemField(itemId, { selected: event.target.checked });
      } catch (error) {
        await reloadFromDatabase({ statusMessage: "Dados atualizados automaticamente." });
        setStatus("error", error.userMessage || "Nao foi possivel atualizar a selecao do item.");
      }
      return;
    }

    if (action === "set-reason") {
      const reason = normalizeReason(event.target.value);
      updateLocalItem(itemId, { reason });
      try {
        await updateItemField(itemId, { reason });
        setStatus("success", "Motivo salvo automaticamente.");
      } catch (error) {
        await reloadFromDatabase({ statusMessage: "Dados atualizados automaticamente." });
        setStatus("error", error.userMessage || "Nao foi possivel salvar o motivo.");
      }
    }
  });

  refs.noteSummary.addEventListener("click", async (event) => {
    const action = event.target.dataset.action;
    const noteKey = event.target.dataset.noteKey;
    if (!action || !noteKey) return;

    if (action === "save-sector") {
      const note = state.notes.find((entry) => entry.key === noteKey);
      const sectorField = document.getElementById("noteSectorEdit");
      if (!note || !sectorField) return;
      try {
        setLoading(true, "Atualizando setor da nota...");
        await updateSectorForNote(noteKey, note.type, sectorField.value);
        await reloadFromDatabase({ statusMessage: "Setor atualizado automaticamente." });
        refs.noteSelect.value = noteKey;
        renderClassification(state, refs);
        showToast("success", "Setor salvo com sucesso.");
      } catch (error) {
        setStatus("error", error.userMessage || "Nao foi possivel atualizar o setor.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (action === "save-competence-month") {
      const monthField = document.getElementById("noteCompetenceMonthEdit");
      if (!monthField) return;
      const nextMonth = monthField.value;
      try {
        setLoading(true, "Atualizando mes de competencia da nota...");
        await updateCompetenceMonthForNote(noteKey, nextMonth);
        await reloadFromDatabase({ statusMessage: "Mes de competencia atualizado automaticamente." });
        if ([...refs.noteMonthFilter.options].some((option) => option.value === nextMonth)) refs.noteMonthFilter.value = nextMonth;
        buildNoteOptions(state, refs);
        refs.noteSelect.value = noteKey;
        renderClassification(state, refs);
        showToast("success", "Mes da nota salvo com sucesso.");
      } catch (error) {
        setStatus("error", error.userMessage || "Nao foi possivel atualizar o mes da nota.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (action === "remove-note") {
      if (!window.confirm("Deseja excluir esta nota do painel e do banco de dados?")) return;
      try {
        setLoading(true, "Excluindo nota...");
        await deleteNote(noteKey);
        refs.noteSelect.value = "";
        await reloadFromDatabase({ statusMessage: "Nota removida com sucesso.", emptyMessage: "Nenhum XML importado ainda." });
        showToast("success", "Nota excluida com sucesso.");
      } catch (error) {
        setStatus("error", error.userMessage || "Nao foi possivel excluir a nota.");
      } finally {
        setLoading(false);
      }
    }
  });

  refs.csvBtn.addEventListener("click", () => {
    try {
      exportCsv(state);
    } catch (error) {
      showToast("warning", error.message);
    }
  });

  refs.reportBtn.addEventListener("click", () => {
    try {
      openPrintReport(state, refs);
    } catch (error) {
      showToast("warning", error.message);
    }
  });

  document.querySelectorAll(".tabbtn").forEach((button) => button.addEventListener("click", () => setTab(button.dataset.tab)));

  refs.nfSearchBtn?.addEventListener("click", searchNf);
  refs.nfReadBarcodeBtn?.addEventListener("click", () => {
    if (!refs.nfNumberInput) return;
    refs.nfNumberInput.value = randomInvoiceNumber();
    searchNf();
  });
  refs.nfNumberInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") searchNf();
  });
  refs.nfSaveLaunchBtn?.addEventListener("click", saveAndLaunch);
  refs.nfReviewBody?.addEventListener("click", handleNfReviewAction);
  refs.nfMultipleSelect?.addEventListener("change", handleNfMultipleSelectionChange);
  [refs.nfStoreSelect, refs.nfSectorSelect, refs.nfCompetenceSelect].forEach((el) => {
    el?.addEventListener("change", renderImpactPreview);
  });
  document.getElementById("nfRevisaoStore")?.addEventListener("change", renderNfRevisao);
  document.getElementById("nfRevisaoStatus")?.addEventListener("change", renderNfRevisao);
  document.getElementById("nfRevisaoCompet")?.addEventListener("change", renderNfRevisao);
  document.getElementById("nfRevisaoRefreshBtn")?.addEventListener("click", renderNfRevisao);
  document.getElementById("nfRevisaoBody")?.addEventListener("click", handleNfReviewAction);
}

async function init() {
  state.uiCleanup = initUi(refs);
  state.nfModule.entries = readNfEntries();
  renderReview();
  renderNfRevisao();
  renderNfHistorico();
  applyAdminTestModeVisibility();
  bindEvents();
  await reloadFromDatabase({
    loadingMessage: "Carregando dados oficiais do Supabase...",
    statusMessage: "Dados oficiais carregados automaticamente do Supabase.",
    emptyMessage: "Nenhum XML importado ainda."
  });
  try {
    state.realtimeCleanup = await subscribeRealtime(() => scheduleRealtimeReload());
  } catch (error) {
    console.error(error);
    setStatus("warning", error.userMessage || "Realtime indisponivel. O Supabase continua sendo a fonte oficial, mas sem atualizacao automatica.");
  }
}

init();
