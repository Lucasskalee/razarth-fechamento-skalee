import { initUi, touchLastSync } from "./services/ui.js";
import { ensureAuthenticated } from "./services/auth.js";
import { brl, escapeHtml, num, SECTOR_OPTIONS } from "./services/classificacao.js";
import {
  MONTH_NAMES,
  buildAnalyticsPayload,
  detectAnomaliesAndInsights,
  fetchClosingItems,
  getLossBySector,
  getLossByStore,
  getMonthlyLossSummary,
  getTopLossProducts
} from "./services/closingAnalyticsService.js";
import { askAiAssistant } from "./services/aiService.js";

const state = {
  items: [],
  stores: [],
  loading: false,
  analyzing: false,
  chatLoading: false,
  chatMessages: [],
  filters: {
    store: "TODAS",
    year: new Date().getFullYear(),
    month: "TODOS",
    sector: "TODOS",
    type: "perdas_saidas"
  }
};

const refs = {
  connectionBadge: document.getElementById("connectionBadge"),
  lastSyncLabel: document.getElementById("lastSyncLabel"),
  currentDate: document.getElementById("currentDate"),
  currentWeekday: document.getElementById("currentWeekday"),
  currentTime: document.getElementById("currentTime"),
  themeToggle: document.getElementById("themeToggle"),
  themeToggleLabel: document.getElementById("themeToggleLabel"),
  storeFilter: document.getElementById("aiStoreFilter"),
  yearFilter: document.getElementById("aiYearFilter"),
  monthFilter: document.getElementById("aiMonthFilter"),
  sectorFilter: document.getElementById("aiSectorFilter"),
  typeFilter: document.getElementById("aiTypeFilter"),
  contextSummary: document.getElementById("aiContextSummary"),
  statusBanner: document.getElementById("statusBanner"),
  analyzeBtn: document.getElementById("aiAnalyzeBtn"),
  refreshBtn: document.getElementById("aiRefreshBtn"),
  analysisResult: document.getElementById("aiAnalysisResult"),
  evidenceList: document.getElementById("aiEvidenceList"),
  insightsList: document.getElementById("aiInsightsList"),
  chatMessages: document.getElementById("aiChatMessages"),
  chatForm: document.getElementById("aiChatForm"),
  chatInput: document.getElementById("aiChatInput"),
  chatSendBtn: document.getElementById("aiChatSendBtn"),
  chatClearBtn: document.getElementById("aiChatClearBtn"),
  pageLoading: document.getElementById("pageLoading"),
  loadingText: document.getElementById("loadingText"),
  toast: document.getElementById("toast")
};

function setStatus(type, message) {
  refs.statusBanner.className = `status ${type}`;
  refs.statusBanner.textContent = message;
}

function setLoading(isLoading, message = "Consultando dados...") {
  state.loading = isLoading;
  refs.pageLoading.hidden = !isLoading;
  refs.loadingText.textContent = message;
}

function showToast(type, message, timeout = 4000) {
  refs.toast.className = `toast ${type}`;
  refs.toast.textContent = message;
  refs.toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    refs.toast.hidden = true;
  }, timeout);
}

function syncFiltersFromDom() {
  state.filters = {
    store: refs.storeFilter.value,
    year: Number(refs.yearFilter.value || new Date().getFullYear()),
    month: refs.monthFilter.value === "TODOS" ? "TODOS" : Number(refs.monthFilter.value),
    sector: refs.sectorFilter.value,
    type: refs.typeFilter.value
  };
}

function fillFilters() {
  const currentYear = new Date().getFullYear();
  refs.yearFilter.innerHTML = [currentYear, currentYear - 1, 2025, 2024]
    .filter((year, index, list) => list.indexOf(year) === index)
    .map((year) => `<option value="${year}" ${Number(state.filters.year) === year ? "selected" : ""}>${year}</option>`)
    .join("");
  refs.monthFilter.innerHTML = '<option value="TODOS">Ano todo</option>' + MONTH_NAMES
    .map((month, index) => `<option value="${index + 1}" ${Number(state.filters.month) === index + 1 ? "selected" : ""}>${month}</option>`)
    .join("");
  refs.sectorFilter.innerHTML = '<option value="TODOS">Todos os setores</option>' + SECTOR_OPTIONS
    .map((sector) => `<option value="${escapeHtml(sector)}" ${state.filters.sector === sector ? "selected" : ""}>${escapeHtml(sector)}</option>`)
    .join("");
  refs.storeFilter.innerHTML = '<option value="TODAS">Todas as lojas</option>' + state.stores
    .map((store) => `<option value="${escapeHtml(store)}" ${state.filters.store === store ? "selected" : ""}>${escapeHtml(store)}</option>`)
    .join("");
}

function renderContext() {
  const summary = getMonthlyLossSummary(state.items, state.filters);
  const month = state.filters.month === "TODOS" ? "ano todo" : MONTH_NAMES[Number(state.filters.month) - 1];
  refs.contextSummary.innerHTML = `
    <strong>Contexto ativo:</strong>
    ${escapeHtml(state.filters.store === "TODAS" ? "todas as lojas" : state.filters.store)} ·
    ${escapeHtml(month)} / ${state.filters.year} ·
    ${escapeHtml(state.filters.sector === "TODOS" ? "todos os setores" : state.filters.sector)} ·
    ${escapeHtml(state.filters.type === "perdas_saidas" ? "perdas e saidas" : state.filters.type === "uso_consumo" ? "uso e consumo" : "todos os tipos")}
    <br><span>${summary.totalItems} item(ns), ${summary.uniqueNotes} nota(s), ${brl(summary.totalValue)} no recorte.</span>
  `;
}

function renderEvidence() {
  const summary = getMonthlyLossSummary(state.items, state.filters);
  const sectors = getLossBySector(state.items, state.filters).slice(0, 3);
  const stores = getLossByStore(state.items, state.filters).slice(0, 3);
  const products = getTopLossProducts(state.items, state.filters, 3);
  const rows = [
    { title: "Volume analisado", body: `${brl(summary.totalValue)} em ${summary.totalItems} item(ns).` },
    { title: "Pendencias", body: `${summary.unclassifiedCount} item(ns) sem motivo, somando ${brl(summary.unclassifiedValue)}.` },
    ...sectors.map((row) => ({ title: row.sector, body: `${brl(row.value)} · ${num(row.percent)}% · motivo principal: ${row.mainReason}.` })),
    ...stores.map((row) => ({ title: row.store, body: `${brl(row.value)} · setor de maior peso: ${row.mainSector}.` })),
    ...products.map((row) => ({ title: row.produto, body: `${brl(row.valor_atual)} em ${row.loja}/${row.setor}.` }))
  ];

  refs.evidenceList.innerHTML = rows.map((row) => `
    <div class="ai-list-item">
      <strong>${escapeHtml(row.title)}</strong>
      <span>${escapeHtml(row.body)}</span>
    </div>
  `).join("");
}

function renderInsights() {
  const insights = detectAnomaliesAndInsights(state.items, state.filters);
  refs.insightsList.innerHTML = insights.length ? insights.map((insight) => `
    <button class="ai-list-item" type="button" data-prompt="${escapeHtml(insight)}">
      <strong>Investigar</strong>
      <span>${escapeHtml(insight)}</span>
    </button>
  `).join("") : '<div class="ai-list-item"><strong>Sem alerta critico</strong><span>Nenhuma anomalia automatica relevante no recorte atual.</span></div>';

  refs.insightsList.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => sendQuestion(button.dataset.prompt));
  });
}

function formatAiAnswer(answer) {
  const paragraphs = String(answer || "").split(/\n{2,}/).map((line) => line.trim()).filter(Boolean);
  const first = paragraphs.shift() || answer || "Analise concluida.";
  return `
    <div class="ai-answer">
      <p class="ai-answer-lead">${escapeHtml(first).replace(/\n/g, "<br>")}</p>
      ${paragraphs.map((text) => `
        <div class="ai-answer-block">
          <p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>
        </div>
      `).join("")}
    </div>
  `;
}

async function analyzeWithAi() {
  if (state.analyzing) return;
  if (!state.items.length) {
    showToast("warning", "Nao ha dados carregados para analisar.");
    return;
  }

  state.analyzing = true;
  refs.analyzeBtn.disabled = true;
  refs.analyzeBtn.textContent = "Analisando...";
  refs.analysisResult.innerHTML = '<div class="ai-empty ai-loading-note">Analisando o fechamento com base no contexto selecionado...</div>';

  try {
    const result = await askAiAssistant("Faça uma analise gerencial completa deste fechamento.", state.filters, state.items, state.chatMessages);
    refs.analysisResult.innerHTML = formatAiAnswer(result.answer);
    showToast("success", result.source === "server" ? "Analise por IA concluida." : "Analise local gerada.");
  } catch (error) {
    refs.analysisResult.innerHTML = `<div class="ai-empty">Nao foi possivel concluir a analise: ${escapeHtml(error.message)}</div>`;
    showToast("error", error.message, 6000);
  } finally {
    state.analyzing = false;
    refs.analyzeBtn.disabled = false;
    refs.analyzeBtn.textContent = "Analisar com IA";
  }
}

function renderChat() {
  refs.chatMessages.innerHTML = state.chatMessages.length ? state.chatMessages.map((message) => `
    <div class="ai-chat-message ${message.role}">
      <span>${message.role === "user" ? "Voce" : "Assistente"}</span>
      <p>${escapeHtml(message.content).replace(/\n/g, "<br>")}</p>
    </div>
  `).join("") : '<div class="ai-chat-welcome">Pergunte sobre perdas, setores, lojas, produtos, anomalias ou proximas acoes para o fechamento.</div>';

  if (state.chatLoading) {
    refs.chatMessages.insertAdjacentHTML("beforeend", '<div class="ai-chat-message assistant ai-loading-note"><span>Assistente</span><p>Analisando dados do fechamento...</p></div>');
  }
  refs.chatMessages.scrollTop = refs.chatMessages.scrollHeight;
}

async function sendQuestion(question) {
  const clean = String(question || "").trim();
  if (!clean || state.chatLoading) return;
  state.chatMessages.push({ role: "user", content: clean });
  refs.chatInput.value = "";
  state.chatLoading = true;
  refs.chatSendBtn.disabled = true;
  renderChat();

  try {
    const history = state.chatMessages.map(({ role, content }) => ({ role, content }));
    const result = await askAiAssistant(clean, state.filters, state.items, history);
    state.chatMessages.push({ role: "assistant", content: result.answer });
  } catch (error) {
    state.chatMessages.push({ role: "assistant", content: `Nao consegui responder: ${error.message}` });
    showToast("error", error.message, 6000);
  } finally {
    state.chatLoading = false;
    refs.chatSendBtn.disabled = false;
    renderChat();
    refs.chatInput.focus();
  }
}

async function loadData() {
  setLoading(true, "Consultando dados do fechamento...");
  setStatus("info", "Carregando dados operacionais...");
  try {
    state.items = await fetchClosingItems(state.filters);
    state.stores = Array.from(new Set(state.items.map((item) => item.store).filter(Boolean))).sort();
    fillFilters();
    renderContext();
    renderEvidence();
    renderInsights();
    setStatus("success", `${state.items.length} item(ns) carregados para analise.`);
    touchLastSync(refs, "Dados sincronizados");
  } catch (error) {
    console.error(error);
    setStatus("error", error.message || "Nao foi possivel carregar dados da IA.");
  } finally {
    setLoading(false);
  }
}

function bindEvents() {
  [refs.storeFilter, refs.yearFilter, refs.monthFilter, refs.sectorFilter, refs.typeFilter].forEach((field) => {
    field.addEventListener("change", () => {
      syncFiltersFromDom();
      renderContext();
      renderEvidence();
      renderInsights();
      refs.analysisResult.innerHTML = '<div class="ai-empty">O contexto mudou. Clique em Analisar com IA para atualizar a leitura.</div>';
    });
  });
  refs.refreshBtn.addEventListener("click", loadData);
  refs.analyzeBtn.addEventListener("click", analyzeWithAi);
  refs.chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendQuestion(refs.chatInput.value);
  });
  refs.chatClearBtn.addEventListener("click", () => {
    state.chatMessages = [];
    renderChat();
    showToast("info", "Nova conversa iniciada.");
  });
}

async function init() {
  initUi(refs);
  fillFilters();
  bindEvents();
  renderChat();
  try {
    await ensureAuthenticated({ connectionBadge: refs.connectionBadge, lastSyncLabel: refs.lastSyncLabel, pageLabel: "Assistente IA" });
  } catch (error) {
    console.warn("Autenticacao pendente:", error);
  }
  await loadData();
}

document.addEventListener("DOMContentLoaded", init);
