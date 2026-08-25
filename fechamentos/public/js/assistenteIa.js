import { initUi, touchLastSync } from "./services/ui.js";
import { ensureAuthenticated } from "./services/auth.js?v=20260820-1";
import {
  fetchClosingItems,
  detectAnomaliesAndInsights,
  generateExecutiveSummary,
  getMonthlyLossSummary
} from "./services/closingAnalyticsService.js";
import { askAiAssistant } from "./services/aiService.js";
import { initContextFilters } from "./components/aiContextFilters.js";
import { renderInsightsPanel } from "./components/aiInsights.js";
import { initChat } from "./components/aiChat.js";
import { showExecutiveSummaryModal } from "./components/aiExecutiveSummary.js";

const state = {
  items: [],
  stores: [],
  filters: {
    store: "TODAS",
    year: new Date().getFullYear(),
    month: "TODOS",
    sector: "TODOS",
    type: "perdas_saidas"
  },
  insights: [],
  loading: false,
  error: null
};

const refs = {
  connectionBadge: document.getElementById("connectionBadge"),
  lastSyncLabel: document.getElementById("lastSyncLabel"),
  currentDate: document.getElementById("currentDate"),
  currentWeekday: document.getElementById("currentWeekday"),
  currentTime: document.getElementById("currentTime"),
  themeToggle: document.getElementById("themeToggle"),
  themeToggleLabel: document.getElementById("themeToggleLabel"),
  filtersContainer: document.getElementById("aiContextFiltersContainer"),
  insightsContainer: document.getElementById("aiInsightsContainer"),
  chatContainer: document.getElementById("aiChatContainer"),
  kpiCardsContainer: document.getElementById("aiKpisContainer"),
  statusBanner: document.getElementById("statusBanner"),
  pageLoading: document.getElementById("pageLoading"),
  loadingText: document.getElementById("loadingText")
};

let chatInstance = null;

function setPageLoading(isLoading, message = "Carregando dados do fechamento...") {
  if (refs.pageLoading) {
    refs.pageLoading.hidden = !isLoading;
    if (refs.loadingText) refs.loadingText.textContent = message;
  }
}

function setStatus(type, message) {
  if (!refs.statusBanner) return;
  refs.statusBanner.className = `status ${type}`;
  refs.statusBanner.textContent = message;
}

function renderKpis() {
  if (!refs.kpiCardsContainer) return;
  const summary = getMonthlyLossSummary(state.items, state.filters);

  refs.kpiCardsContainer.innerHTML = `
    <article class="card kpi-card">
      <div class="label">Valor Total Analisado</div>
      <div class="value">${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(summary.totalValue)}</div>
      <div class="meta">Volume no recorte selecionado</div>
    </article>
    <article class="card kpi-card">
      <div class="label">Itens Processados</div>
      <div class="value">${summary.totalItems}</div>
      <div class="meta">${summary.uniqueNotes} notas auditadas</div>
    </article>
    <article class="card kpi-card ${summary.unclassifiedCount > 0 ? 'kpi-card-pending' : ''}">
      <div class="label">Itens Sem Motivo</div>
      <div class="value">${summary.unclassifiedCount}</div>
      <div class="meta">${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(summary.unclassifiedValue)} pendente de justificativa</div>
    </article>
    <article class="card kpi-card">
      <div class="label">Insights Ativos</div>
      <div class="value">${state.insights.length}</div>
      <div class="meta">Padrões e alertas calculados</div>
    </article>
  `;
}

async function loadData() {
  state.loading = true;
  setPageLoading(true, "Consultando dados de perdas no Supabase...");
  setStatus("info", "Carregando dados operacionais...");

  try {
    const items = await fetchClosingItems({
      year: state.filters.year,
      store: state.filters.store,
      sector: state.filters.sector,
      type: state.filters.type
    });

    state.items = items;

    // Extrai lista única de lojas
    const storeSet = new Set(items.map((i) => i.store).filter(Boolean));
    state.stores = Array.from(storeSet).sort();

    // Calcula insights com os dados carregados
    state.insights = detectAnomaliesAndInsights(state.items, state.filters);

    setStatus("success", `${state.items.length} itens de fechamento carregados com sucesso.`);
    touchLastSync(refs, "Dados sincronizados");

    renderKpis();
    renderInsights();
  } catch (err) {
    console.error("Falha ao carregar dados do Assistente IA:", err);
    state.error = err.message;
    setStatus("error", "Não foi possível carregar dados completos do fechamento. Operando com dados locais.");
  } finally {
    state.loading = false;
    setPageLoading(false);
  }
}

function renderInsights() {
  renderInsightsPanel(refs.insightsContainer, state.insights, (prompt) => {
    if (chatInstance) {
      chatInstance.submitPrompt(prompt);
      refs.chatContainer?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

function handleGenerateExecutiveSummary() {
  const summary = generateExecutiveSummary(state.items, state.filters);
  showExecutiveSummaryModal(summary);
}

async function init() {
  initUi(refs);

  try {
    await ensureAuthenticated({
      connectionBadge: refs.connectionBadge,
      lastSyncLabel: refs.lastSyncLabel,
      pageLabel: "Assistente IA"
    });
  } catch (err) {
    console.warn("Autenticação não concluída imediatamente:", err);
  }

  // Inicializa Filtros de Contexto
  initContextFilters({
    container: refs.filtersContainer,
    filters: state.filters,
    stores: state.stores,
    onFilterChange: (nextFilters) => {
      state.filters = { ...state.filters, ...nextFilters };
      state.insights = detectAnomaliesAndInsights(state.items, state.filters);
      renderKpis();
      renderInsights();
    },
    onGenerateSummary: handleGenerateExecutiveSummary,
    onRefresh: () => {
      loadData();
    },
    onClear: () => {
      state.insights = detectAnomaliesAndInsights(state.items, state.filters);
      renderKpis();
      renderInsights();
    }
  });

  // Inicializa Chat
  chatInstance = initChat({
    container: refs.chatContainer,
    onSendMessage: async (question, history) => {
      return await askAiAssistant(question, state.filters, state.items, history);
    },
    onClearChat: () => {
      touchLastSync(refs, "Conversa reiniciada");
    }
  });

  await loadData();

  // Atualiza lojas nos filtros após carregamento
  initContextFilters({
    container: refs.filtersContainer,
    filters: state.filters,
    stores: state.stores,
    onFilterChange: (nextFilters) => {
      state.filters = { ...state.filters, ...nextFilters };
      state.insights = detectAnomaliesAndInsights(state.items, state.filters);
      renderKpis();
      renderInsights();
    },
    onGenerateSummary: handleGenerateExecutiveSummary,
    onRefresh: () => {
      loadData();
    },
    onClear: () => {
      state.insights = detectAnomaliesAndInsights(state.items, state.filters);
      renderKpis();
      renderInsights();
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
