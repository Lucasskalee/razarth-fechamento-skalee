import { SECTOR_OPTIONS, brl, escapeHtml, formatDate, num, sortLabels } from "./classificacao.js";
import {
  CLOSING_MONTHS,
  CLOSING_STATUS_OPTIONS,
  clearMonthlyClosingCache,
  fetchMonthlyClosingGrid,
  fetchMonthlyClosingNoteItems,
  fetchMonthlyClosingNotes,
  invalidateMonthlyClosingCellCache,
  saveMonthlyClosingEntryAudit,
  saveMonthlyClosingNoteAudit
} from "./fechamentoMensalApi.js";

function fillSelect(select, values, currentValue, formatter = (value) => value) {
  if (!select) return;
  select.innerHTML = values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(formatter(value))}</option>`).join("");
  if (values.includes(currentValue)) select.value = currentValue;
}

function monthShortLabel(monthNumber) {
  return CLOSING_MONTHS.find((month) => month.number === Number(monthNumber))?.shortLabel || "--";
}

function monthLongLabel(monthNumber) {
  return CLOSING_MONTHS.find((month) => month.number === Number(monthNumber))?.longLabel || "Mes";
}

function statusMeta(status) {
  const meta = {
    confere: { label: "Confere", tone: "success" },
    pendente: { label: "Pendente", tone: "warning" },
    divergente: { label: "Divergente", tone: "danger" },
    sem_nota: { label: "Sem nota", tone: "neutral" }
  };
  return meta[status] || meta.pendente;
}

function buildStatusBadge(status) {
  const meta = statusMeta(status);
  return `<span class="status-badge ${meta.tone}">${meta.label}</span>`;
}

function buildStatusOptions(currentStatus, allowSemNota = true) {
  return CLOSING_STATUS_OPTIONS
    .filter((option) => allowSemNota || option.value !== "sem_nota")
    .map((option) => `<option value="${option.value}" ${currentStatus === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`)
    .join("");
}

function toYearList(items) {
  const years = new Set();
  items.forEach((item) => {
    const date = new Date(item.date || item.emission_date || "");
    if (!Number.isNaN(date.getTime())) years.add(String(date.getFullYear()));
  });
  years.add(String(new Date().getFullYear()));
  return sortLabels(years);
}

function deriveCellStatus(cell, notes) {
  if (!cell.noteCount && !notes.length) return "sem_nota";
  if (notes.some((note) => note.status === "divergente")) return "divergente";
  if (notes.length && notes.every((note) => note.status === "confere")) return "confere";
  if (cell.status === "sem_nota" && cell.noteCount > 0) return "pendente";
  return cell.status || "pendente";
}

function canPersistAudit(cell) {
  return cell?.store && cell.store !== "TODAS" && cell.type && cell.type !== "TODOS";
}

function summarizeGrid(rows) {
  return rows.reduce((summary, row) => {
    row.months.forEach((cell) => {
      summary.totalValue += Number(cell.totalValue || 0);
      summary.noteCount += Number(cell.noteCount || 0);
      if (cell.status === "divergente") summary.divergentCount += 1;
      if (cell.status === "pendente") summary.pendingCount += 1;
      if (cell.status === "confere") summary.checkedCount += 1;
    });
    return summary;
  }, { totalValue: 0, noteCount: 0, divergentCount: 0, pendingCount: 0, checkedCount: 0 });
}

function buildGridModel(records, filters, items) {
  const recordMap = new Map();
  records.forEach((row) => {
    const key = `${row.sector}::${row.month_number}`;
    const previous = recordMap.get(key);
    const current = {
      entryId: filters.store === "TODAS" || filters.type === "TODOS" ? null : (row.entry_id || null),
      store: filters.store === "TODAS" ? "TODAS" : row.store,
      basis: row.basis,
      year: Number(row.year),
      month: Number(row.month_number),
      monthLabel: monthLongLabel(row.month_number),
      type: filters.type === "TODOS" ? "TODOS" : row.type,
      sector: row.sector,
      status: row.status || "pendente",
      totalValue: Number(row.total_value || 0),
      noteCount: Number(row.note_count || 0),
      observation: row.observation || ""
    };

    if (!previous) {
      recordMap.set(key, current);
      return;
    }

    const mergedStatuses = [previous.status, current.status];
    recordMap.set(key, {
      ...previous,
      entryId: filters.store === "TODAS" || filters.type === "TODOS" ? null : (previous.entryId || current.entryId),
      store: filters.store === "TODAS" ? "TODAS" : current.store,
      type: filters.type === "TODOS" ? "TODOS" : current.type,
      status: mergedStatuses.includes("divergente")
        ? "divergente"
        : (mergedStatuses.every((status) => status === "confere")
          ? "confere"
          : (mergedStatuses.includes("pendente") ? "pendente" : previous.status)),
      totalValue: previous.totalValue + current.totalValue,
      noteCount: previous.noteCount + current.noteCount,
      observation: previous.observation || current.observation
    });
  });

  const sectors = sortLabels(new Set([
    ...SECTOR_OPTIONS,
    ...records.map((row) => row.sector).filter(Boolean),
    ...items.map((item) => item.sector).filter(Boolean)
  ]));

  const rows = sectors.map((sector) => {
    const months = CLOSING_MONTHS.map((month) => {
      const record = recordMap.get(`${sector}::${month.number}`);
      return record || {
        entryId: null,
        store: filters.store === "TODAS" ? "TODAS" : filters.store,
        basis: filters.basis,
        year: Number(filters.year),
        month: month.number,
        monthLabel: month.longLabel,
        type: filters.type === "TODOS" ? "Todos" : filters.type,
        sector,
        status: "sem_nota",
        totalValue: 0,
        noteCount: 0,
        observation: ""
      };
    });

    return {
      sector,
      months,
      totalValue: months.reduce((sum, cell) => sum + Number(cell.totalValue || 0), 0),
      noteCount: months.reduce((sum, cell) => sum + Number(cell.noteCount || 0), 0)
    };
  });

  const summary = summarizeGrid(rows);
  const totalsByMonth = CLOSING_MONTHS.map((month) => rows.reduce((sum, row) => sum + Number(row.months[month.number - 1].totalValue || 0), 0));
  return { rows, summary, totalsByMonth };
}

function renderSummary(summary) {
  return `
    <article class="card kpi-card">
      <div class="label">Total do periodo</div>
      <div class="value">${brl(summary.totalValue)}</div>
      <div class="meta">Valor consolidado do fechamento no recorte atual.</div>
    </article>
    <article class="card kpi-card">
      <div class="label">Notas no periodo</div>
      <div class="value">${summary.noteCount}</div>
      <div class="meta">Quantidade de notas consideradas na grade.</div>
    </article>
    <article class="card kpi-card">
      <div class="label">Celulas pendentes</div>
      <div class="value">${summary.pendingCount}</div>
      <div class="meta">Setores e meses aguardando conferencia.</div>
    </article>
    <article class="card kpi-card">
      <div class="label">Divergencias</div>
      <div class="value">${summary.divergentCount}</div>
      <div class="meta">Celulas com diferenca identificada na auditoria.</div>
    </article>
  `;
}

function renderGridSkeleton() {
  const cells = CLOSING_MONTHS.map(() => '<div class="closing-cell skeleton-cell"></div>').join("");
  return new Array(6).fill("").map((_, index) => `
    <div class="closing-grid-row" role="row">
      <div class="closing-sticky-col closing-sector-cell skeleton-text">Setor ${index + 1}</div>
      ${cells}
      <div class="closing-total-cell skeleton-cell"></div>
    </div>
  `).join("");
}

function renderGridTable(model) {
  const headerMonths = CLOSING_MONTHS.map((month) => `<div class="closing-head-cell">${month.shortLabel}</div>`).join("");
  const body = model.rows.map((row) => {
    const cells = row.months.map((cell) => {
      const meta = statusMeta(cell.status);
      return `
        <button
          type="button"
          class="closing-cell closing-cell-${meta.tone}"
          data-action="open-closing-cell"
          data-store="${escapeHtml(cell.store)}"
          data-year="${cell.year}"
          data-month="${cell.month}"
          data-sector="${escapeHtml(cell.sector)}"
          data-type="${escapeHtml(cell.type)}"
          data-entry-id="${escapeHtml(cell.entryId || "")}"
          data-status="${escapeHtml(cell.status)}"
          data-total-value="${cell.totalValue}"
          data-note-count="${cell.noteCount}"
          data-observation="${escapeHtml(cell.observation || "")}"
          aria-label="${escapeHtml(`${cell.sector} ${cell.monthLabel} ${brl(cell.totalValue)}`)}"
        >
          <strong>${brl(cell.totalValue)}</strong>
          <span>${cell.noteCount} nota(s)</span>
          ${buildStatusBadge(cell.status)}
        </button>
      `;
    }).join("");

    return `
      <div class="closing-grid-row" role="row">
        <div class="closing-sticky-col closing-sector-cell">
          <strong>${escapeHtml(row.sector)}</strong>
          <span>${row.noteCount} nota(s)</span>
        </div>
        ${cells}
        <div class="closing-total-cell">
          <strong>${brl(row.totalValue)}</strong>
          <span>${row.noteCount} nota(s)</span>
        </div>
      </div>
    `;
  }).join("");

  const footerTotals = model.totalsByMonth.map((value) => `<div class="closing-footer-cell"><strong>${brl(value)}</strong></div>`).join("");
  return `
    <div class="closing-grid-head" role="row">
      <div class="closing-sticky-col closing-head-cell">Setor</div>
      ${headerMonths}
      <div class="closing-head-cell">Total</div>
    </div>
    ${body}
    <div class="closing-grid-row closing-grid-footer" role="row">
      <div class="closing-sticky-col closing-sector-cell">
        <strong>Total geral</strong>
        <span>${model.summary.noteCount} nota(s)</span>
      </div>
      ${footerTotals}
      <div class="closing-total-cell">
        <strong>${brl(model.summary.totalValue)}</strong>
        <span>${model.summary.noteCount} nota(s)</span>
      </div>
    </div>
  `;
}

function renderNotesList(drawerState) {
  if (drawerState.notesLoading && !drawerState.notes.length) {
    return '<div class="closing-drawer-skeleton"></div><div class="closing-drawer-skeleton"></div><div class="closing-drawer-skeleton"></div>';
  }

  if (drawerState.notesError) {
    return `
      <div class="empty">
        ${escapeHtml(drawerState.notesError)}
        <div class="inline-edit">
          <button type="button" data-action="retry-closing-notes">Tentar novamente</button>
        </div>
      </div>
    `;
  }

  if (!drawerState.notes.length) {
    return '<div class="empty">Nenhuma nota localizada para esta combinacao de setor, mes e loja.</div>';
  }

  const cards = drawerState.notes.map((note) => `
    <button
      type="button"
      class="closing-note-card ${drawerState.selectedNoteKey === note.noteKey ? "is-active" : ""}"
      data-action="select-closing-note"
      data-note-key="${escapeHtml(note.noteKey)}"
    >
      <div>
        <strong>NF ${escapeHtml(note.invoice)}</strong>
        <span>${escapeHtml(formatDate(note.date))} - ${escapeHtml(note.type)}</span>
      </div>
      <div class="cell-stack">
        ${buildStatusBadge(note.status)}
        <strong>${brl(note.totalValue)}</strong>
      </div>
    </button>
  `).join("");

  const loadMore = drawerState.hasMore
    ? `<button type="button" class="closing-more-btn" data-action="load-more-closing-notes">Carregar mais notas</button>`
    : "";

  return `${cards}${loadMore}`;
}

function renderNoteItems(drawerState) {
  const note = drawerState.notes.find((entry) => entry.noteKey === drawerState.selectedNoteKey);

  if (!note) {
    return '<div class="empty">Selecione uma nota para visualizar os produtos e salvar a conferencia.</div>';
  }

  if (drawerState.itemsLoading && !drawerState.noteItems.length) {
    return '<div class="closing-drawer-skeleton tall"></div>';
  }

  if (drawerState.itemsError) {
    return `
      <div class="empty">
        ${escapeHtml(drawerState.itemsError)}
        <div class="inline-edit">
          <button type="button" data-action="retry-closing-items">Tentar novamente</button>
        </div>
      </div>
    `;
  }

  const items = drawerState.noteItems.length
    ? drawerState.noteItems.map((item) => `
      <tr>
        <td>${item.itemIndex}</td>
        <td>${escapeHtml(item.product)}</td>
        <td>${num(item.quantity)}</td>
        <td>${brl(item.value)}</td>
        <td>${escapeHtml(item.reason || "Sem motivo")}</td>
      </tr>
    `).join("")
    : '<tr><td colspan="5">Nenhum produto retornado para esta nota.</td></tr>';

  return `
    <div class="closing-note-detail">
      <div class="closing-note-toolbar">
        <div class="cell-stack">
          <span class="label">Auditoria da nota</span>
          <strong>NF ${escapeHtml(note.invoice)} - ${brl(note.totalValue)}</strong>
        </div>
        ${buildStatusBadge(note.status)}
      </div>

      <div class="closing-form-grid">
        <label class="closing-field">
          <span>Status da nota</span>
          <select id="closingNoteStatus">${buildStatusOptions(note.status, false)}</select>
        </label>
        <label class="closing-field closing-field-grow">
          <span>Observacao da nota</span>
          <textarea id="closingNoteObservation" rows="4" placeholder="Descreva o motivo da conferencia ou da divergencia.">${escapeHtml(note.observation || "")}</textarea>
        </label>
      </div>

      <div class="inline-edit">
        <button type="button" data-action="save-closing-note" ${(drawerState.savingNote || !canPersistAudit(drawerState.selectedCell)) ? "disabled" : ""}>${drawerState.savingNote ? "Salvando..." : "Salvar nota"}</button>
      </div>
      ${canPersistAudit(drawerState.selectedCell) ? "" : '<div class="hint">Selecione uma loja e um tipo especificos para salvar a auditoria manual.</div>'}

      <div class="table-wrap closing-items-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Produto</th>
              <th>Qtd</th>
              <th>Valor</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>${items}</tbody>
        </table>
      </div>
    </div>
  `;
}

function parseCellDataset(element, basis) {
  return {
    entryId: element.dataset.entryId || null,
    store: element.dataset.store,
    basis,
    year: Number(element.dataset.year || 0),
    month: Number(element.dataset.month || 0),
    monthLabel: monthLongLabel(element.dataset.month),
    type: element.dataset.type,
    sector: element.dataset.sector,
    status: element.dataset.status || "pendente",
    totalValue: Number(element.dataset.totalValue || 0),
    noteCount: Number(element.dataset.noteCount || 0),
    observation: element.dataset.observation || ""
  };
}

export function createMonthlyClosingController({ refs, appState, setStatus, showToast }) {
  const state = {
    initialized: false,
    model: { rows: [], summary: { totalValue: 0, noteCount: 0, divergentCount: 0, pendingCount: 0, checkedCount: 0 }, totalsByMonth: [] },
    filters: {
      store: "TODAS",
      year: new Date().getFullYear(),
      type: "TODOS",
      status: "TODOS",
      basis: refs.basis?.value || "competence"
    },
    loadingGrid: false,
    gridError: "",
    selectedCell: null,
    drawerOpen: false,
    notes: [],
    notesPage: 0,
    hasMore: false,
    totalNotes: 0,
    notesLoading: false,
    notesError: "",
    selectedNoteKey: "",
    noteItems: [],
    itemsLoading: false,
    itemsError: "",
    savingCell: false,
    savingNote: false
  };

  function syncFilterOptions() {
    const stores = sortLabels(new Set(appState.items.map((item) => item.store).filter(Boolean)));
    const types = sortLabels(new Set(appState.items.map((item) => item.type).filter(Boolean)));
    const years = toYearList(appState.items);

    fillSelect(refs.closingStoreFilter, ["TODAS", ...stores], state.filters.store, (value) => value === "TODAS" ? "Todas as lojas" : value);
    fillSelect(refs.closingTypeFilter, ["TODOS", ...types], state.filters.type, (value) => value === "TODOS" ? "Todos os tipos" : value);
    fillSelect(refs.closingYearFilter, years, String(state.filters.year));
    fillSelect(refs.closingStatusFilter, ["TODOS", ...CLOSING_STATUS_OPTIONS.map((status) => status.value)], state.filters.status, (value) => {
      if (value === "TODOS") return "Todos os status";
      return statusMeta(value).label;
    });

    if (!years.includes(String(state.filters.year))) {
      state.filters.year = Number(years[years.length - 1] || new Date().getFullYear());
      refs.closingYearFilter.value = String(state.filters.year);
    }
  }

  function renderGrid() {
    refs.closingSummary.innerHTML = renderSummary(state.model.summary);

    if (state.loadingGrid && !state.model.rows.length) {
      refs.closingGrid.innerHTML = renderGridSkeleton();
      refs.closingState.innerHTML = "";
      return;
    }

    if (state.gridError && !state.model.rows.length) {
      refs.closingState.innerHTML = `
        <div class="status error">
          ${escapeHtml(state.gridError)}
          <div class="inline-edit">
            <button type="button" data-action="retry-closing-grid">Tentar novamente</button>
          </div>
        </div>
      `;
      refs.closingGrid.innerHTML = "";
      return;
    }

    refs.closingState.innerHTML = state.gridError
      ? `<div class="status warning">${escapeHtml(state.gridError)}</div>`
      : (!state.model.summary.noteCount
        ? `<div class="empty">Nenhum fechamento encontrado para os filtros atuais.<div class="inline-edit"><button type="button" data-action="clear-closing-filters">Limpar filtros</button></div></div>`
        : "");

    refs.closingGrid.innerHTML = renderGridTable(state.model);
  }

  function renderDrawer() {
    refs.closingDrawerBackdrop.hidden = !state.drawerOpen;
    refs.closingDrawer.hidden = !state.drawerOpen;
    refs.closingDrawer.classList.toggle("is-open", state.drawerOpen);

    if (!state.drawerOpen || !state.selectedCell) return;

    const cell = state.selectedCell;
    refs.closingDrawerTitle.textContent = `${cell.sector} - ${cell.monthLabel}`;
    refs.closingDrawerMeta.innerHTML = `
      <span>${escapeHtml(cell.store === "TODAS" ? "Todas as lojas" : cell.store)}</span>
      <span>${cell.year}</span>
      <span>${escapeHtml(cell.type === "TODOS" ? "Todos os tipos" : cell.type)}</span>
      <span>${brl(cell.totalValue)}</span>
    `;

    refs.closingDrawerBody.innerHTML = `
      <div class="closing-drawer-layout">
        <section class="closing-drawer-panel">
          <div class="closing-drawer-summary">
            <div class="summary-card">
              <div class="label">Valor da celula</div>
              <strong>${brl(cell.totalValue)}</strong>
            </div>
            <div class="summary-card">
              <div class="label">Notas</div>
              <strong>${cell.noteCount}</strong>
            </div>
            <div class="summary-card">
              <div class="label">Status atual</div>
              <strong>${statusMeta(cell.status).label}</strong>
            </div>
          </div>

          <div class="closing-form-grid">
            <label class="closing-field">
              <span>Status da celula</span>
              <select id="closingCellStatus">${buildStatusOptions(cell.status, true)}</select>
            </label>
            <label class="closing-field closing-field-grow">
              <span>Observacao da celula</span>
              <textarea id="closingCellObservation" rows="4" placeholder="Registre a justificativa operacional desta conferencia.">${escapeHtml(cell.observation || "")}</textarea>
            </label>
          </div>

          <div class="inline-edit">
            <button type="button" data-action="save-closing-cell" ${(state.savingCell || !canPersistAudit(cell)) ? "disabled" : ""}>${state.savingCell ? "Salvando..." : "Salvar celula"}</button>
          </div>
          ${canPersistAudit(cell) ? "" : '<div class="hint">Para salvar auditoria manual, selecione uma loja e um tipo especificos nos filtros.</div>'}

          <div class="closing-notes-head">
            <div>
              <span class="panel-tag">Notas do periodo</span>
              <h3>Notas da celula</h3>
              <p class="muted-note">${state.totalNotes} nota(s) encontradas para este recorte.</p>
            </div>
          </div>
          <div class="closing-notes-list">${renderNotesList(state)}</div>
        </section>

        <section class="closing-drawer-panel">
          <div class="closing-notes-head">
            <div>
              <span class="panel-tag">Produtos da nota</span>
              <h3>Detalhamento</h3>
              <p class="muted-note">Abra uma nota para conferir os produtos e concluir a auditoria.</p>
            </div>
          </div>
          ${renderNoteItems(state)}
        </section>
      </div>
    `;
  }

  function patchGridCell(updatedCell) {
    state.model.rows = state.model.rows.map((row) => {
      if (row.sector !== updatedCell.sector) return row;
      const months = row.months.map((cell) => cell.month === updatedCell.month ? { ...cell, ...updatedCell } : cell);
      return {
        ...row,
        months,
        totalValue: months.reduce((sum, cell) => sum + Number(cell.totalValue || 0), 0),
        noteCount: months.reduce((sum, cell) => sum + Number(cell.noteCount || 0), 0)
      };
    });
    state.model.summary = summarizeGrid(state.model.rows);
    state.model.totalsByMonth = CLOSING_MONTHS.map((month) => state.model.rows.reduce((sum, row) => sum + Number(row.months[month.number - 1].totalValue || 0), 0));
  }

  async function refreshGrid({ silent = false } = {}) {
    try {
      state.loadingGrid = true;
      if (!silent) state.gridError = "";
      renderGrid();
      const rows = await fetchMonthlyClosingGrid(state.filters);
      state.model = buildGridModel(rows, state.filters, appState.items);
      state.gridError = "";
      renderGrid();
    } catch (error) {
      console.error(error);
      state.gridError = error.userMessage || error.message || "Nao foi possivel carregar o fechamento mensal.";
      renderGrid();
    } finally {
      state.loadingGrid = false;
      renderGrid();
    }
  }

  async function loadCellNotes({ append = false } = {}) {
    if (!state.selectedCell) return;
    try {
      state.notesLoading = true;
      state.notesError = "";
      renderDrawer();
      const result = await fetchMonthlyClosingNotes(state.selectedCell, state.filters, {
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
      state.hasMore = result.hasMore;

      if (!state.selectedNoteKey && state.notes.length) {
        state.selectedNoteKey = state.notes[0].noteKey;
        await loadNoteItems(state.selectedNoteKey);
      }
    } catch (error) {
      console.error(error);
      state.notesError = error.userMessage || error.message || "Falha ao carregar as notas da celula.";
    } finally {
      state.notesLoading = false;
      renderDrawer();
    }
  }

  async function loadNoteItems(noteKey) {
    try {
      state.selectedNoteKey = noteKey;
      state.itemsLoading = true;
      state.itemsError = "";
      renderDrawer();
      state.noteItems = await fetchMonthlyClosingNoteItems(noteKey);
    } catch (error) {
      console.error(error);
      state.itemsError = error.userMessage || error.message || "Falha ao carregar os produtos da nota.";
      state.noteItems = [];
    } finally {
      state.itemsLoading = false;
      renderDrawer();
    }
  }

  function openCellFromElement(element) {
    state.selectedCell = parseCellDataset(element, state.filters.basis);
    state.drawerOpen = true;
    state.notes = [];
    state.totalNotes = 0;
    state.notesPage = 0;
    state.hasMore = false;
    state.notesError = "";
    state.selectedNoteKey = "";
    state.noteItems = [];
    state.itemsError = "";
    renderDrawer();
    loadCellNotes();
  }

  function closeDrawer() {
    state.drawerOpen = false;
    state.selectedCell = null;
    state.notes = [];
    state.noteItems = [];
    state.selectedNoteKey = "";
    renderDrawer();
  }

  async function saveCellAudit() {
    if (!state.selectedCell) return;
    if (!canPersistAudit(state.selectedCell)) {
      showToast("warning", "Selecione uma loja e um tipo especificos antes de salvar a auditoria.");
      return;
    }

    const statusField = document.getElementById("closingCellStatus");
    const observationField = document.getElementById("closingCellObservation");
    const nextStatus = statusField?.value || state.selectedCell.status;
    const nextObservation = observationField?.value || "";

    try {
      state.savingCell = true;
      renderDrawer();
      const result = await saveMonthlyClosingEntryAudit({
        cell: state.selectedCell,
        status: nextStatus,
        observation: nextObservation
      });

      state.selectedCell = { ...state.selectedCell, entryId: result.entryId, status: result.status, observation: result.observation };
      patchGridCell(state.selectedCell);
      invalidateMonthlyClosingCellCache(state.selectedCell, state.filters);
      renderGrid();
      renderDrawer();
      showToast("success", "Auditoria da celula salva com sucesso.");
    } catch (error) {
      console.error(error);
      showToast("error", error.userMessage || "Nao foi possivel salvar a celula.");
    } finally {
      state.savingCell = false;
      renderDrawer();
    }
  }

  async function saveNoteAudit() {
    if (!state.selectedCell || !state.selectedNoteKey) return;
    if (!canPersistAudit(state.selectedCell)) {
      showToast("warning", "Selecione uma loja e um tipo especificos antes de salvar a auditoria.");
      return;
    }

    const statusField = document.getElementById("closingNoteStatus");
    const observationField = document.getElementById("closingNoteObservation");
    const nextStatus = statusField?.value || "pendente";
    const nextObservation = observationField?.value || "";

    try {
      state.savingNote = true;
      renderDrawer();
      const noteResult = await saveMonthlyClosingNoteAudit({
        cell: state.selectedCell,
        noteKey: state.selectedNoteKey,
        status: nextStatus,
        observation: nextObservation
      });

      state.notes = state.notes.map((note) => note.noteKey === state.selectedNoteKey ? {
        ...note,
        status: noteResult.status,
        observation: noteResult.observation
      } : note);

      const derivedStatus = deriveCellStatus(state.selectedCell, state.notes);
      const entryResult = await saveMonthlyClosingEntryAudit({
        cell: { ...state.selectedCell, entryId: noteResult.entryId },
        status: derivedStatus,
        observation: state.selectedCell.observation
      });

      state.selectedCell = {
        ...state.selectedCell,
        entryId: entryResult.entryId,
        status: entryResult.status,
        observation: entryResult.observation
      };

      patchGridCell(state.selectedCell);
      invalidateMonthlyClosingCellCache(state.selectedCell, state.filters);
      renderGrid();
      renderDrawer();
      showToast("success", "Auditoria da nota salva com sucesso.");
    } catch (error) {
      console.error(error);
      showToast("error", error.userMessage || "Nao foi possivel salvar a nota.");
    } finally {
      state.savingNote = false;
      renderDrawer();
    }
  }

  function resetFilters() {
    state.filters.store = "TODAS";
    state.filters.type = "TODOS";
    state.filters.status = "TODOS";
    state.filters.year = Number(refs.closingYearFilter?.options?.[refs.closingYearFilter.options.length - 1]?.value || new Date().getFullYear());
    syncFilterOptions();
    refreshGrid();
  }

  function bindEvents() {
    if (state.initialized) return;
    state.initialized = true;

    [refs.closingStoreFilter, refs.closingYearFilter, refs.closingTypeFilter, refs.closingStatusFilter].forEach((element) => {
      element?.addEventListener("change", () => {
        state.filters.store = refs.closingStoreFilter.value;
        state.filters.year = Number(refs.closingYearFilter.value || new Date().getFullYear());
        state.filters.type = refs.closingTypeFilter.value;
        state.filters.status = refs.closingStatusFilter.value;
        state.filters.basis = refs.basis?.value || "competence";
        refreshGrid();
      });
    });

    refs.closingRefreshBtn?.addEventListener("click", () => refreshGrid());
    refs.closingClearBtn?.addEventListener("click", () => resetFilters());
    refs.closingGrid?.addEventListener("click", (event) => {
      const button = event.target.closest('[data-action="open-closing-cell"]');
      if (button) openCellFromElement(button);
    });

    refs.closingState?.addEventListener("click", (event) => {
      const action = event.target.closest("[data-action]");
      if (!action) return;
      if (action.dataset.action === "retry-closing-grid") refreshGrid();
      if (action.dataset.action === "clear-closing-filters") resetFilters();
    });

    refs.closingDrawerClose?.addEventListener("click", closeDrawer);
    refs.closingDrawerBackdrop?.addEventListener("click", closeDrawer);
    refs.closingDrawerBody?.addEventListener("click", async (event) => {
      const action = event.target.closest("[data-action]");
      if (!action) return;

      if (action.dataset.action === "select-closing-note") {
        await loadNoteItems(action.dataset.noteKey);
        return;
      }
      if (action.dataset.action === "load-more-closing-notes") {
        state.notesPage += 1;
        await loadCellNotes({ append: true });
        return;
      }
      if (action.dataset.action === "retry-closing-notes") {
        state.notesPage = 0;
        await loadCellNotes();
        return;
      }
      if (action.dataset.action === "retry-closing-items" && state.selectedNoteKey) {
        await loadNoteItems(state.selectedNoteKey);
        return;
      }
      if (action.dataset.action === "save-closing-cell") {
        await saveCellAudit();
        return;
      }
      if (action.dataset.action === "save-closing-note") {
        await saveNoteAudit();
      }
    });
  }

  return {
    bindEvents,
    syncFilterOptions,
    refresh: refreshGrid,
    closeDrawer,
    clearCache: clearMonthlyClosingCache,
    updateBasis(basis) {
      state.filters.basis = basis || "competence";
    }
  };
}
