import { MONTH_NAMES } from "../services/closingAnalyticsService.js";
import { SECTOR_OPTIONS } from "../services/classificacao.js?v=20260428-2";

export function initContextFilters({
  container,
  filters,
  stores = [],
  onFilterChange,
  onGenerateSummary,
  onRefresh,
  onClear
}) {
  if (!container) return;

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, 2025, 2024];
  const uniqueYears = Array.from(new Set(years)).sort((a, b) => b - a);

  container.innerHTML = `
    <div class="panel-head ai-filters-head">
      <div>
        <span class="panel-tag">Contexto operacional</span>
        <h3>Filtros do Assistente</h3>
        <p class="muted-note">Selecione o recorte para que todas as perguntas e análises da IA considerem este contexto.</p>
      </div>
      <div class="ai-filter-quick-actions">
        <button id="aiSummaryBtn" class="ai-summary-btn" type="button">
          <span aria-hidden="true">📋</span> Gerar Resumo Executivo
        </button>
        <button id="aiRefreshBtn" class="ai-subtle-btn" type="button">
          <span aria-hidden="true">🔄</span> Atualizar
        </button>
        <button id="aiClearBtn" class="ai-subtle-btn" type="button">
          Limpar
        </button>
      </div>
    </div>

    <div class="filters ai-context-filters-grid">
      <div class="ai-filter-group">
        <label for="aiStoreFilter">Loja / Unidade</label>
        <select id="aiStoreFilter">
          <option value="TODAS">Todas as lojas</option>
          ${stores.map((st) => `<option value="${st}" ${filters.store === st ? "selected" : ""}>${st}</option>`).join("")}
        </select>
      </div>

      <div class="ai-filter-group">
        <label for="aiYearFilter">Ano</label>
        <select id="aiYearFilter">
          ${uniqueYears.map((y) => `<option value="${y}" ${Number(filters.year) === y ? "selected" : ""}>${y}</option>`).join("")}
        </select>
      </div>

      <div class="ai-filter-group">
        <label for="aiMonthFilter">Mês</label>
        <select id="aiMonthFilter">
          <option value="TODOS">Todos os meses</option>
          ${MONTH_NAMES.map((m, idx) => `
            <option value="${idx + 1}" ${Number(filters.month) === idx + 1 ? "selected" : ""}>${m}</option>
          `).join("")}
        </select>
      </div>

      <div class="ai-filter-group">
        <label for="aiSectorFilter">Setor</label>
        <select id="aiSectorFilter">
          <option value="TODOS">Todos os setores</option>
          ${SECTOR_OPTIONS.map((sec) => `
            <option value="${sec}" ${filters.sector === sec ? "selected" : ""}>${sec}</option>
          `).join("")}
        </select>
      </div>

      <div class="ai-filter-group">
        <label for="aiTypeFilter">Tipo</label>
        <select id="aiTypeFilter">
          <option value="TODOS">Todos os tipos</option>
          <option value="perdas_saidas" ${filters.type === "perdas_saidas" ? "selected" : ""}>Perdas e Saídas</option>
          <option value="uso_consumo" ${filters.type === "uso_consumo" ? "selected" : ""}>Uso e Consumo</option>
        </select>
      </div>
    </div>

    <div class="ai-active-context-banner" id="aiActiveContextBanner">
      <!-- Injetado dinamicamente -->
    </div>
  `;

  const storeSelect = container.querySelector("#aiStoreFilter");
  const yearSelect = container.querySelector("#aiYearFilter");
  const monthSelect = container.querySelector("#aiMonthFilter");
  const sectorSelect = container.querySelector("#aiSectorFilter");
  const typeSelect = container.querySelector("#aiTypeFilter");
  const banner = container.querySelector("#aiActiveContextBanner");

  function updateBanner(f) {
    const storeLabel = f.store && f.store !== "TODAS" ? f.store : "Todas as lojas";
    const monthLabel = f.month && f.month !== "TODOS" ? MONTH_NAMES[Number(f.month) - 1] : "Ano todo";
    const sectorLabel = f.sector && f.sector !== "TODOS" ? f.sector : "Todos os setores";
    const typeLabel = f.type === "perdas_saidas" ? "Perdas" : (f.type === "uso_consumo" ? "Uso/Consumo" : "Todos tipos");

    banner.innerHTML = `
      <span class="ai-context-indicator" aria-hidden="true">🎯</span>
      <div class="ai-context-chips">
        <strong>Contexto ativo:</strong>
        <span class="ai-context-chip">${storeLabel}</span>
        <span class="ai-context-chip">${monthLabel} / ${f.year}</span>
        <span class="ai-context-chip">${sectorLabel}</span>
        <span class="ai-context-chip">${typeLabel}</span>
      </div>
      <small class="ai-context-sub">Perguntas feitas ao assistente consideram automaticamente este recorte.</small>
    `;
  }

  function emitChange() {
    const nextFilters = {
      store: storeSelect.value,
      year: Number(yearSelect.value),
      month: monthSelect.value === "TODOS" ? "TODOS" : Number(monthSelect.value),
      sector: sectorSelect.value,
      type: typeSelect.value
    };
    updateBanner(nextFilters);
    if (typeof onFilterChange === "function") {
      onFilterChange(nextFilters);
    }
  }

  storeSelect.addEventListener("change", emitChange);
  yearSelect.addEventListener("change", emitChange);
  monthSelect.addEventListener("change", emitChange);
  sectorSelect.addEventListener("change", emitChange);
  typeSelect.addEventListener("change", emitChange);

  container.querySelector("#aiSummaryBtn")?.addEventListener("click", () => {
    if (typeof onGenerateSummary === "function") onGenerateSummary();
  });

  container.querySelector("#aiRefreshBtn")?.addEventListener("click", () => {
    if (typeof onRefresh === "function") onRefresh();
  });

  container.querySelector("#aiClearBtn")?.addEventListener("click", () => {
    storeSelect.value = "TODAS";
    yearSelect.value = currentYear;
    monthSelect.value = "TODOS";
    sectorSelect.value = "TODOS";
    typeSelect.value = "TODOS";
    emitChange();
    if (typeof onClear === "function") onClear();
  });

  updateBanner(filters);
}
