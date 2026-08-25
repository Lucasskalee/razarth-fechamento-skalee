import { REASON_COLORS, REASONS, SECTOR_OPTIONS, brl, escapeHtml, formatDate, num } from "./classificacao.js";
import { currentFilterSummary } from "./filtros.js";

function renderEmpty(message) {
  return `<div class="empty">${message}</div>`;
}

const MONTH_KEYS = [
  ["jan", "Janeiro"],
  ["fev", "Fevereiro"],
  ["mar", "Marco"],
  ["abr", "Abril"],
  ["mai", "Maio"],
  ["jun", "Junho"],
  ["jul", "Julho"],
  ["ago", "Agosto"],
  ["set", "Setembro"],
  ["out", "Outubro"],
  ["nov", "Novembro"],
  ["dez", "Dezembro"]
];

function buildCompetenceMonthOptions(state, note) {
  const years = new Set([String(new Date().getFullYear())]);
  [...state.items, ...state.notes].forEach((entry) => {
    [entry.competenceMonth, entry.emissionMonth].forEach((month) => {
      const year = String(month || "").split("/")[1];
      if (year) years.add(year);
    });
    const date = new Date(entry.date || "");
    if (!Number.isNaN(date.getTime())) years.add(String(date.getFullYear()));
  });
  if (note?.competenceMonth) years.add(String(note.competenceMonth).split("/")[1]);
  return [...years]
    .filter(Boolean)
    .sort((a, b) => Number(a) - Number(b))
    .flatMap((year) => MONTH_KEYS.map(([key, label]) => ({ value: `${key}/${year}`, label: `${label}/${year}` })));
}

function getCssVar(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function chartThemeOptions() {
  const textColor = getCssVar("--text-soft", "#64748b");
  const gridColor = getCssVar("--line", "#dbe3ee");
  return {
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: textColor,
          usePointStyle: true,
          boxWidth: 10
        }
      }
    },
    scales: {
      x: {
        ticks: { color: textColor },
        grid: { color: gridColor }
      },
      y: {
        beginAtZero: true,
        ticks: { color: textColor },
        grid: { color: gridColor }
      }
    }
  };
}

function buildSliceDetails(items, groupBy) {
  const details = {};
  items.forEach((item) => {
    const key = groupBy(item);
    if (!details[key]) {
      details[key] = {
        value: 0,
        items: 0,
        quantity: 0,
        products: new Set(),
        notes: new Set(),
        invoices: new Set(),
        stores: new Set(),
        sectors: new Set()
      };
    }
    details[key].value += Number(item.value || 0);
    details[key].items += 1;
    details[key].quantity += Number(item.quantity || 0);
    details[key].products.add(item.product || "Produto");
    details[key].notes.add(item.noteKey);
    details[key].invoices.add(item.invoice || "-");
    details[key].stores.add(item.store || "-");
    details[key].sectors.add(item.sector || "-");
  });
  return details;
}

function buildDoughnutTooltipOptions(detailsByLabel, totalValue, singleNoteDetails) {
  return {
    tooltip: {
      callbacks: {
        title(context) {
          return context[0]?.label || "";
        },
        label(context) {
          const label = context.label || "";
          const value = Number(context.raw || 0);
          const details = detailsByLabel[label];
          const percent = totalValue ? ((value / totalValue) * 100).toFixed(1).replace(".", ",") : "0,0";
          const lines = [`Valor: ${brl(value)}`, `Participacao: ${percent}%`];
          if (details) {
            lines.push(`Itens: ${details.items}`);
            lines.push(`Quantidade: ${num(details.quantity)}`);
            lines.push(`Produtos: ${details.products.size}`);
          }
          return lines;
        },
        afterLabel(context) {
          if (!singleNoteDetails) return [];
          const label = context.label || "";
          const details = detailsByLabel[label];
          if (!details) return [];
          return [
            `NF: ${singleNoteDetails.invoice}`,
            `Loja: ${singleNoteDetails.store}`,
            `Setor: ${singleNoteDetails.sector}`,
            `Periodo: ${singleNoteDetails.month}`,
            `Lancamentos neste grupo: ${details.items}`
          ];
        }
      }
    }
  };
}

function chartLabelsFromMap(map) {
  const monthOrder = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };
  const chronology = (value) => {
    const normalized = String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const [monthLabel, yearLabel] = normalized.split("/");
    const month = monthOrder[monthLabel?.slice(0, 3)] || 0;
    const year = Number(yearLabel || 0);
    return (year * 100) + month;
  };
  return Object.keys(map).sort((a, b) => chronology(a) - chronology(b) || String(a).localeCompare(String(b), "pt-BR"));
}

function filterDashboardView(items, view = "all") {
  if (view === "all") return items;
  return items.filter((item) => {
    const normalizedType = String(item.type || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    if (view === "loss-exits") return normalizedType === "perdas" || normalizedType.includes("saida entre lojas");
    if (view === "usage") return normalizedType.includes("uso/consumo") || normalizedType.includes("uso e consumo");
    return true;
  });
}

export function normalizeSector(value) {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  if (!normalized || normalized === "nao classificado" || normalized === "sem setor") return "Sem setor";
  if (normalized === "acougue") return "Acougue";
  if (normalized === "producao padaria") return "Producao Padaria";
  if (normalized === "frios e congelados") return "Frios e Congelados";
  if (normalized === "flv") return "FLV";
  if (normalized === "loja deposito" || normalized === "loja/deposito") return "Loja/Deposito";
  if (normalized === "frente de caixa") return "Frente de Caixa";
  return normalized.split(" ").map((part) => part ? part[0].toUpperCase() + part.slice(1) : part).join(" ");
}

export function buildSectorSummary(items) {
  const sectorMap = new Map();
  const totalValue = items.reduce((sum, item) => sum + Number(item.value || 0), 0);

  items.forEach((item) => {
    const sector = normalizeSector(item.sector);
    if (!sectorMap.has(sector)) {
      sectorMap.set(sector, {
        sector,
        totalValue: 0,
        itemsCount: 0,
        notes: new Set(),
        pendingItems: 0
      });
    }

    const current = sectorMap.get(sector);
    current.totalValue += Number(item.value || 0);
    current.itemsCount += 1;
    current.notes.add(item.noteKey);
    if (!item.reason) current.pendingItems += 1;
  });

  return [...sectorMap.values()]
    .map((entry) => ({
      sector: entry.sector,
      totalValue: entry.totalValue,
      itemsCount: entry.itemsCount,
      notesCount: entry.notes.size,
      pendingItems: entry.pendingItems,
      percentage: totalValue ? (entry.totalValue / totalValue) * 100 : 0
    }))
    .sort((a, b) => b.totalValue - a.totalValue);
}

function getPendingSummary(items) {
  const pendingItems = items.filter((item) => !item.reason);
  const classifiedCount = items.length - pendingItems.length;
  const completionRate = items.length ? Math.round((classifiedCount / items.length) * 100) : 100;
  const noteMap = {};
  const sectorMap = {};
  const storeMap = {};
  const productMap = {};

  pendingItems.forEach((item) => {
    if (!noteMap[item.noteKey]) {
      noteMap[item.noteKey] = {
        count: 0,
        invoice: item.invoice,
        store: item.store,
        sector: item.sector
      };
    }
    noteMap[item.noteKey].count += 1;

    if (!sectorMap[item.sector]) sectorMap[item.sector] = { count: 0, value: 0 };
    sectorMap[item.sector].count += 1;
    sectorMap[item.sector].value += Number(item.value || 0);

    if (!storeMap[item.store]) storeMap[item.store] = { count: 0, value: 0 };
    storeMap[item.store].count += 1;
    storeMap[item.store].value += Number(item.value || 0);

    const product = (item.product || "Produto").trim() || "Produto";
    if (!productMap[product]) productMap[product] = { count: 0, value: 0 };
    productMap[product].count += 1;
    productMap[product].value += Number(item.value || 0);
  });

  return {
    pendingItems,
    pendingCount: pendingItems.length,
    classifiedCount,
    completionRate,
    notesWithPending: Object.keys(noteMap).length,
    topPendingNote: Object.values(noteMap).sort((a, b) => b.count - a.count)[0] || null,
    topPendingSector: Object.entries(sectorMap).sort((a, b) => b[1].count - a[1].count)[0] || null,
    topPendingStore: Object.entries(storeMap).sort((a, b) => b[1].count - a[1].count)[0] || null,
    topPendingProduct: Object.entries(productMap).sort((a, b) => b[1].count - a[1].count)[0] || null
  };
}

function buildReasonBadge(reason) {
  if (!reason) return '<span class="status-badge warning">Pendente</span>';
  return '<span class="status-badge success">Resolvido</span>';
}

function buildRowReasonCell(reason) {
  return `<div class="cell-stack">${buildReasonBadge(reason)}<span>${escapeHtml(reason || "Sem motivo")}</span></div>`;
}

function buildNoteDetails(items, basis) {
  const noteMap = {};
  items.forEach((item) => {
    if (!noteMap[item.noteKey]) {
      noteMap[item.noteKey] = {
        noteKey: item.noteKey,
        invoice: item.invoice || "-",
        store: item.store || "-",
        sector: item.sector || "-",
        month: basis === "competence" ? item.competenceMonth : item.emissionMonth,
        date: item.date || "",
        total: 0,
        loss: 0,
        usage: 0,
        items: 0,
        pending: 0
      };
    }
    noteMap[item.noteKey].total += Number(item.value || 0);
    noteMap[item.noteKey].items += 1;
    if (item.type === "Perdas") noteMap[item.noteKey].loss += Number(item.value || 0);
    if (item.type === "Uso/Consumo") noteMap[item.noteKey].usage += Number(item.value || 0);
    if (!item.reason) noteMap[item.noteKey].pending += 1;
  });

  return Object.values(noteMap).sort((a, b) =>
    (b.pending - a.pending)
    || String(b.date || "").localeCompare(String(a.date || ""))
    || String(a.invoice || "").localeCompare(String(b.invoice || ""), "pt-BR", { numeric: true })
  );
}

function renderStoreSummaryBySelectedSector(state, dashboardItems, refs) {
  const selectedSector = refs.sectorFilter.value;
  const allStores = [...new Set(state.items.map((item) => item.store).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));

  return allStores.map((storeName) => {
    const storeItems = dashboardItems.filter((item) => item.store === storeName);
    const losses = storeItems
      .filter((item) => item.type === "Perdas")
      .reduce((sum, item) => sum + Number(item.value || 0), 0);
    const usage = storeItems
      .filter((item) => item.type === "Uso/Consumo")
      .reduce((sum, item) => sum + Number(item.value || 0), 0);
    const total = storeItems.reduce((sum, item) => sum + Number(item.value || 0), 0);

    return `
      <div class="mini-item">
        <div class="cell-stack">
          <strong>${escapeHtml(storeName)}</strong>
          <span>Setor selecionado: ${escapeHtml(selectedSector)}</span>
        </div>
        <div class="cell-stack">
          <span>Perdas ${brl(losses)}</span>
          <span>Uso/Consumo ${brl(usage)}</span>
          <strong>Total ${brl(total)}</strong>
        </div>
      </div>
    `;
  }).join("");
}

function renderSectorChartSummary(sectorsSummary, refs) {
  if (!refs.sectorChartSummary) return;
  const topSector = sectorsSummary[0];
  if (!topSector) {
    refs.sectorChartSummary.innerHTML = renderEmpty("Nenhum dado por setor para o filtro atual.");
    return;
  }

  refs.sectorChartSummary.innerHTML = `
    <div class="summary-grid">
      <div class="summary-card">
        <div class="label">Setor lider</div>
        <strong>${escapeHtml(topSector.sector)}</strong>
      </div>
      <div class="summary-card">
        <div class="label">Valor</div>
        <strong>${brl(topSector.totalValue)}</strong>
      </div>
      <div class="summary-card">
        <div class="label">Participacao</div>
        <strong>${topSector.percentage.toFixed(1).replace(".", ",")}%</strong>
      </div>
      <div class="summary-card">
        <div class="label">Pendentes</div>
        <strong>${topSector.pendingItems}</strong>
      </div>
    </div>
    <div class="mini">
      ${sectorsSummary.slice(0, 6).map((entry) => `
        <div class="mini-item">
          <strong>${escapeHtml(entry.sector)}</strong>
          <span>${brl(entry.totalValue)} · ${entry.notesCount} nota(s) · ${entry.itemsCount} item(ns)</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderSectorChart(sectorsSummary, refs, chartTheme) {
  if (!refs.sectorChart) return null;
  if (refs.sectorChartEmpty) refs.sectorChartEmpty.hidden = sectorsSummary.length > 0;
  if (!sectorsSummary.length) return null;

  return new window.Chart(refs.sectorChart, {
    type: "bar",
    data: {
      labels: sectorsSummary.map((entry) => entry.sector),
      datasets: [{
        label: "Valor por setor",
        data: sectorsSummary.map((entry) => entry.totalValue),
        backgroundColor: sectorsSummary.map((_, index) => index === 0 ? getCssVar("--accent", "#0f5bd4") : getCssVar("--accent-2", "#18a0b7")),
        borderRadius: 10,
        barThickness: 18
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title(context) {
              return context[0]?.label || "";
            },
            label(context) {
              const current = sectorsSummary[context.dataIndex];
              if (!current) return "";
              return [
                `Valor: ${brl(current.totalValue)}`,
                `Itens: ${current.itemsCount}`,
                `Notas: ${current.notesCount}`,
                `Pendentes: ${current.pendingItems}`,
                `Participacao: ${current.percentage.toFixed(1).replace(".", ",")}%`
              ];
            }
          }
        }
      },
      scales: {
        x: chartTheme.scales.y,
        y: chartTheme.scales.x
      }
    }
  });
}

export function renderDashboard(state, refs) {
  const dashboardItems = filterDashboardView(state.filtered, state.dashboardView).filter((item) => item.type !== "Outros");
  const basis = refs.basis.value;
  const pendingSummary = getPendingSummary(dashboardItems);
  const sectorsSummary = buildSectorSummary(dashboardItems);
  const notesCount = new Set(dashboardItems.map((item) => item.noteKey)).size;
  const totalBankNotes = state.notes.length;
  const totalFilteredNotes = new Set(state.filtered.map((item) => item.noteKey)).size;
  const notesWithoutItems = state.notes.filter((note) => !note.items?.length).length;
  const total = dashboardItems.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const loss = dashboardItems.filter((item) => item.type === "Perdas").reduce((sum, item) => sum + Number(item.value || 0), 0);
  const usage = dashboardItems.filter((item) => item.type === "Uso/Consumo").reduce((sum, item) => sum + Number(item.value || 0), 0);
  const stores = {};
  dashboardItems.forEach((item) => {
    if (!stores[item.store]) stores[item.store] = { value: 0, pending: 0 };
    stores[item.store].value += Number(item.value || 0);
    if (!item.reason) stores[item.store].pending += 1;
  });
  const topStore = Object.entries(stores).sort((a, b) => b[1].value - a[1].value)[0];

  refs.kpiNotes.textContent = notesCount;
  refs.kpiTotal.textContent = brl(total);
  refs.kpiLoss.textContent = brl(loss);
  refs.kpiUsage.textContent = brl(usage);
  refs.kpiStore.textContent = topStore ? topStore[0] : "-";
  refs.kpiPending.textContent = String(pendingSummary.pendingCount);
  refs.kpiPendingMeta.textContent = pendingSummary.pendingCount ? `${pendingSummary.notesWithPending} nota(s) com pendencia no filtro atual` : "Nenhuma pendencia no filtro atual";
  refs.pendingKpiCard.classList.toggle("is-warning", pendingSummary.pendingCount > 0);
  refs.pendingKpiCard.classList.toggle("is-success", pendingSummary.pendingCount === 0);

  refs.pendingExecutive.classList.toggle("is-pending", pendingSummary.pendingCount > 0);
  refs.pendingExecutive.classList.toggle("is-clear", pendingSummary.pendingCount === 0);
  refs.pendingItemsCount.textContent = String(pendingSummary.pendingCount);
  refs.pendingNotesCount.textContent = String(pendingSummary.notesWithPending);
  refs.pendingCompletion.textContent = `${pendingSummary.completionRate}%`;

  console.log("[Dashboard] Total notas banco:", totalBankNotes);
  console.log("[Dashboard] Total notas carregadas:", state.notes.length);
  console.log("[Dashboard] Total notas filtradas:", totalFilteredNotes);
  console.log("[Dashboard] Total notas exibidas:", notesCount);
  console.log("[Dashboard] Filtros ativos:", {
    loja: refs.storeFilter.value,
    tipo: refs.typeFilter.value,
    setor: refs.sectorFilter.value,
    motivo: refs.reasonFilter.value,
    mes: refs.monthFilter.value,
    base: refs.basis.value,
    pendentes: refs.pendingOnlyBtn?.getAttribute("aria-pressed") === "true"
  });
  console.log("[Resumo por setor]", sectorsSummary);
  if (notesWithoutItems) {
    console.warn("[Dashboard] Notas sem itens associados:", notesWithoutItems);
  }

  if (pendingSummary.pendingCount > 0) {
    refs.pendingExecutiveTitle.textContent = "Pendencias exigem acao operacional";
    refs.pendingExecutiveText.textContent = "Os filtros atuais ainda possuem itens sem motivo. Priorize as notas e setores com maior pendencia.";
    refs.pendingExecutiveBadge.className = "status-badge warning";
    refs.pendingExecutiveBadge.textContent = "Atencao";
    if (pendingSummary.topPendingNote) {
      refs.pendingFocus.textContent = `NF ${pendingSummary.topPendingNote.invoice}`;
      refs.pendingFocusMeta.textContent = `${pendingSummary.topPendingNote.count} item(ns) pendente(s) em ${pendingSummary.topPendingNote.store} - ${pendingSummary.topPendingNote.sector}`;
    } else {
      refs.pendingFocus.textContent = "Prioridade em analise";
      refs.pendingFocusMeta.textContent = "Existem itens sem motivo no filtro atual.";
    }
  } else {
    refs.pendingExecutiveTitle.textContent = "Tudo classificado no filtro atual";
    refs.pendingExecutiveText.textContent = "Todos os itens do recorte atual ja possuem motivo definido. O painel esta operacionalmente resolvido.";
    refs.pendingExecutiveBadge.className = "status-badge success";
    refs.pendingExecutiveBadge.textContent = "Concluido";
    refs.pendingFocus.textContent = "Sem pendencias";
    refs.pendingFocusMeta.textContent = "Nao ha itens sem motivo nas lojas, setores e notas filtrados.";
  }

  refs.storesBody.innerHTML = refs.sectorFilter.value !== "TODOS"
    ? (renderStoreSummaryBySelectedSector(state, dashboardItems, refs) || renderEmpty("Nenhum XML importado ainda."))
    : Object.entries(stores).sort((a, b) => (b[1].pending - a[1].pending) || (b[1].value - a[1].value)).map(([storeName, info]) => {
      const storeItems = dashboardItems.filter((item) => item.store === storeName);
      const noteRows = buildNoteDetails(storeItems, basis).map((note) => {
        return `<div class="store-month-row"><div><strong>NF ${escapeHtml(note.invoice)}</strong><span>${escapeHtml(note.month || "Sem data")}</span></div><strong>${brl(note.total)}</strong><strong>${brl(note.loss)}</strong><strong>${brl(note.usage)}</strong><div class="cell-stack">${note.pending ? '<span class="status-badge warning">Pendentes</span>' : '<span class="status-badge success">Ok</span>'}<span>${note.pending} item(ns)</span></div></div>`;
      }).join("");
      return `<details class="sector-accordion"><summary><div><strong>${escapeHtml(storeName)}</strong><div class="sector-meta">${new Set(storeItems.map((item) => item.noteKey)).size} nota(s)</div></div><div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><span>${brl(info.value)}</span><span class="sector-meta">Perdas ${brl(storeItems.filter((item) => item.type === "Perdas").reduce((sum, item) => sum + Number(item.value || 0), 0))}</span><span class="sector-meta">Uso ${brl(storeItems.filter((item) => item.type === "Uso/Consumo").reduce((sum, item) => sum + Number(item.value || 0), 0))}</span>${info.pending ? `<span class="status-badge warning">${info.pending} pendente(s)</span>` : '<span class="status-badge success">Tudo classificado</span>'}</div></summary><div class="store-month-grid">${noteRows}</div></details>`;
    }).join("") || renderEmpty("Nenhum XML importado ainda.");

  const sectors = {};
  dashboardItems.forEach((item) => {
    if (!sectors[item.sector]) sectors[item.sector] = { total: 0, pending: 0, notes: new Set(), items: [] };
    sectors[item.sector].total += Number(item.value || 0);
    sectors[item.sector].notes.add(item.noteKey);
    sectors[item.sector].items.push(item);
    if (!item.reason) sectors[item.sector].pending += 1;
  });

  refs.sectorBox.innerHTML = Object.entries(sectors).sort((a, b) => (b[1].pending - a[1].pending) || (b[1].total - a[1].total)).map(([sectorName, data]) => {
    const notesMarkup = buildNoteDetails(data.items, basis).map((note) => {
      return `<div class="sector-reason"><div><strong>NF ${escapeHtml(note.invoice)}</strong><span>${escapeHtml(note.store)} - ${escapeHtml(note.month || "Sem data")}</span></div><div class="cell-stack">${note.pending ? `<span class="status-badge warning">${note.pending} pendente(s)</span>` : '<span class="status-badge success">Ok</span>'}<strong>${brl(note.total)}</strong></div></div>`;
    }).join("");
    return `<details class="sector-accordion"><summary><div><strong>${escapeHtml(sectorName)}</strong><div class="sector-meta">${data.notes.size} nota(s) no setor</div></div><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><span>${brl(data.total)}</span>${data.pending ? `<span class="status-badge warning">${data.pending} pendente(s)</span>` : '<span class="status-badge success">Resolvido</span>'}</div></summary><div class="sector-details">${notesMarkup}</div></details>`;
  }).join("") || renderEmpty("Nenhum XML importado ainda.");

  const productMap = {};
  dashboardItems.forEach((item) => {
    const key = (item.product || "Produto").trim() || "Produto";
    const monthValue = basis === "competence" ? item.competenceMonth : item.emissionMonth;
    if (!productMap[key]) productMap[key] = { value: 0, quantity: 0, items: 0, pending: 0, notes: new Set(), reasons: {}, stores: {} };
    productMap[key].value += Number(item.value || 0);
    productMap[key].quantity += Number(item.quantity || 0);
    productMap[key].items += 1;
    if (!item.reason) productMap[key].pending += 1;
    productMap[key].notes.add(item.noteKey);
    const reason = item.reason || "Sem motivo";
    productMap[key].reasons[reason] = (productMap[key].reasons[reason] || 0) + Number(item.value || 0);
    if (!productMap[key].stores[item.store]) productMap[key].stores[item.store] = { value: 0, quantity: 0, items: 0, pending: 0, notes: new Set(), months: {} };
    const store = productMap[key].stores[item.store];
    store.value += Number(item.value || 0);
    store.quantity += Number(item.quantity || 0);
    store.items += 1;
    if (!item.reason) store.pending += 1;
    store.notes.add(item.noteKey);
    if (!store.months[monthValue]) store.months[monthValue] = { value: 0, quantity: 0, items: 0, pending: 0, notes: {} };
    const monthInfo = store.months[monthValue];
    monthInfo.value += Number(item.value || 0);
    monthInfo.quantity += Number(item.quantity || 0);
    monthInfo.items += 1;
    if (!item.reason) monthInfo.pending += 1;
    if (!monthInfo.notes[item.noteKey]) monthInfo.notes[item.noteKey] = { invoice: item.invoice, value: 0, quantity: 0, items: 0, pending: 0 };
    monthInfo.notes[item.noteKey].value += Number(item.value || 0);
    monthInfo.notes[item.noteKey].quantity += Number(item.quantity || 0);
    monthInfo.notes[item.noteKey].items += 1;
    if (!item.reason) monthInfo.notes[item.noteKey].pending += 1;
  });

  refs.productRanking.innerHTML = Object.entries(productMap).sort((a, b) => (b[1].pending - a[1].pending) || (b[1].value - a[1].value)).slice(0, 15).map(([product, data], index) => {
    const topReason = Object.entries(data.reasons).sort((a, b) => b[1] - a[1])[0];
    const storesMarkup = Object.entries(data.stores).sort((a, b) => (b[1].pending - a[1].pending) || (b[1].value - a[1].value)).map(([storeName, storeData]) => {
      const monthsMarkup = chartLabelsFromMap(storeData.months).map((month) => {
        const monthData = storeData.months[month];
        const notesMarkup = Object.values(monthData.notes).sort((a, b) => (b.pending - a.pending) || (b.value - a.value)).map((note) => `<div class="sector-reason"><div><strong>NF ${escapeHtml(note.invoice)}</strong><span>${note.items} lancamento(s) - qtd ${num(note.quantity)}</span></div><div class="cell-stack">${note.pending ? `<span class="status-badge warning">${note.pending} pendente(s)</span>` : '<span class="status-badge success">Ok</span>'}<strong>${brl(note.value)}</strong></div></div>`).join("");
        return `<details class="sector-accordion"><summary><div><strong>${escapeHtml(month)}</strong><div class="sector-meta">${monthData.items} lancamento(s) - qtd ${num(monthData.quantity)}</div></div><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><span>${brl(monthData.value)}</span>${monthData.pending ? `<span class="status-badge warning">${monthData.pending} pendente(s)</span>` : '<span class="status-badge success">Ok</span>'}</div></summary><div class="sector-details">${notesMarkup}</div></details>`;
      }).join("");
      return `<details class="sector-accordion"><summary><div><strong>${escapeHtml(storeName)}</strong><div class="sector-meta">${storeData.notes.size} nota(s) - ${storeData.items} lancamento(s) - qtd ${num(storeData.quantity)}</div></div><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><strong>${brl(storeData.value)}</strong>${storeData.pending ? `<span class="status-badge warning">${storeData.pending} pendente(s)</span>` : '<span class="status-badge success">Resolvido</span>'}</div></summary><div class="sector-details">${monthsMarkup}</div></details>`;
    }).join("");
    return `<details class="sector-accordion"><summary><div style="display:flex;align-items:center;gap:12px"><div class="rank-pos">${index + 1}</div><div><strong>${escapeHtml(product)}</strong><div class="sector-meta">${data.notes.size} nota(s) - ${data.items} lancamento(s)</div></div></div><div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><span>${brl(data.value)}</span><span class="sector-meta">Qtd ${num(data.quantity)}</span><span class="sector-meta">Motivo ${escapeHtml(topReason ? topReason[0] : "-")}</span>${data.pending ? `<span class="status-badge warning">${data.pending} pendente(s)</span>` : '<span class="status-badge success">Tudo classificado</span>'}</div></summary><div class="sector-details">${storesMarkup}</div></details>`;
  }).join("") || renderEmpty("Nenhum produto no filtro atual.");

  renderSectorChartSummary(sectorsSummary, refs);
  renderCharts(state, refs, sectorsSummary, dashboardItems);
}

export function renderDashboardSummary(summary, refs) {
  refs.kpiNotes.textContent = String(summary.noteCount || 0);
  refs.kpiTotal.textContent = brl(summary.totalValue || 0);
  refs.kpiLoss.textContent = brl(summary.lossValue || 0);
  refs.kpiUsage.textContent = brl(summary.usageValue || 0);
  refs.kpiStore.textContent = summary.topStore || "-";
}

export function renderCharts(state, refs, sectorsSummary = buildSectorSummary(filterDashboardView(state.filtered, state.dashboardView).filter((item) => item.type !== "Outros")), sourceItems = null) {
  const chartItems = sourceItems || filterDashboardView(state.filtered, state.dashboardView).filter((item) => item.type !== "Outros");
  const basis = refs.basis.value;
  const focusedSector = refs.sectorFilter.value !== "TODOS";
  if (refs.temporalTag) refs.temporalTag.textContent = focusedSector ? `Analise temporal - ${refs.sectorFilter.value}` : "Analise temporal";
  const chartTheme = chartThemeOptions();
  const accent = getCssVar("--accent", "#0f5bd4");
  const accentAlt = getCssVar("--accent-2", "#18a0b7");
  const textStrong = getCssVar("--text", "#0f172a");
  const textSoft = getCssVar("--text-soft", "#94a3b8");
  const surface = getCssVar("--surface", "#ffffff");
  const totalValue = chartItems.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const noteKeys = [...new Set(chartItems.map((item) => item.noteKey))];
  const singleNoteDetails = noteKeys.length === 1 ? {
    invoice: chartItems[0]?.invoice || "-",
    store: chartItems[0]?.store || "-",
    sector: chartItems[0]?.sector || "-",
    month: basis === "competence" ? chartItems[0]?.competenceMonth || "-" : chartItems[0]?.emissionMonth || "-"
  } : null;
  if (state.monthChart) state.monthChart.destroy();
  if (state.typeChart) state.typeChart.destroy();
  if (state.sectorChart) state.sectorChart.destroy();
  if (!chartItems.length) {
    state.monthChart = null;
    state.typeChart = null;
    state.sectorChart = null;
    if (refs.sectorChartEmpty) refs.sectorChartEmpty.hidden = false;
    return;
  }

  if (focusedSector) {
    const monthMap = {}, typeMap = { Perdas: 0, "Uso/Consumo": 0 };
    chartItems.forEach((item) => {
      const month = basis === "competence" ? item.competenceMonth : item.emissionMonth;
      const normalizedType = String(item.type || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const value = Number(item.value || 0);
      if (!monthMap[month]) monthMap[month] = { Perdas: 0, "Uso/Consumo": 0 };
      if (normalizedType === "perdas") {
        monthMap[month].Perdas += value;
        typeMap.Perdas += value;
      }
      if (normalizedType === "uso/consumo" || normalizedType === "uso e consumo") {
        monthMap[month]["Uso/Consumo"] += value;
        typeMap["Uso/Consumo"] += value;
      }
    });
    const labels = chartLabelsFromMap(monthMap);
    const typeLabels = ["Perdas", "Uso/Consumo"];
    const focusedTypeItems = chartItems.filter((item) => {
      const normalizedType = String(item.type || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return normalizedType === "perdas" || normalizedType === "uso/consumo" || normalizedType === "uso e consumo";
    });
    const focusedTypeDetails = buildSliceDetails(focusedTypeItems, (item) => {
      const normalizedType = String(item.type || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return normalizedType === "perdas" ? "Perdas" : "Uso/Consumo";
    });
    const focusedTotal = typeMap.Perdas + typeMap["Uso/Consumo"];
    state.monthChart = new window.Chart(refs.monthChart, { type: "bar", data: { labels, datasets: [{ label: "Perdas", data: labels.map((label) => monthMap[label].Perdas || 0), backgroundColor: textStrong, borderRadius: 8 }, { label: "Uso/Consumo", data: labels.map((label) => monthMap[label]["Uso/Consumo"] || 0), backgroundColor: accent, borderRadius: 8 }] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, plugins: chartTheme.plugins, scales: chartTheme.scales } });
    state.typeChart = new window.Chart(refs.typeChart, { type: "doughnut", data: { labels: typeLabels, datasets: [{ data: typeLabels.map((type) => typeMap[type]), backgroundColor: [textStrong, accent], borderColor: surface, borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { ...chartTheme.plugins, ...buildDoughnutTooltipOptions(focusedTypeDetails, focusedTotal, singleNoteDetails) } } });
    state.sectorChart = renderSectorChart(sectorsSummary, refs, chartTheme);
    return;
  }

  const typeMap = {}, monthMap = {};
  chartItems.forEach((item) => {
    typeMap[item.type] = (typeMap[item.type] || 0) + item.value;
    const month = basis === "competence" ? item.competenceMonth : item.emissionMonth;
    if (!monthMap[month]) monthMap[month] = { Perdas: 0, "Uso/Consumo": 0, "Saída entre lojas": 0 };
    monthMap[month][item.type] = (monthMap[month][item.type] || 0) + item.value;
  });
  const labels = chartLabelsFromMap(monthMap);
  const typeDetails = buildSliceDetails(chartItems, (item) => item.type);
  state.monthChart = new window.Chart(refs.monthChart, { type: "bar", data: { labels, datasets: [{ label: "Perdas", data: labels.map((label) => monthMap[label].Perdas || 0), backgroundColor: textStrong, borderRadius: 8 }, { label: "Uso/Consumo", data: labels.map((label) => monthMap[label]["Uso/Consumo"] || 0), backgroundColor: accent, borderRadius: 8 }, { label: "Saida entre lojas", data: labels.map((label) => monthMap[label]["SaÃ­da entre lojas"] || 0), backgroundColor: accentAlt, borderRadius: 8 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: chartTheme.plugins, scales: chartTheme.scales } });
  state.typeChart = new window.Chart(refs.typeChart, { type: "doughnut", data: { labels: Object.keys(typeMap), datasets: [{ data: Object.values(typeMap), backgroundColor: [textStrong, accent, accentAlt], borderColor: surface, borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { ...chartTheme.plugins, ...buildDoughnutTooltipOptions(typeDetails, totalValue, singleNoteDetails) } } });
  state.sectorChart = renderSectorChart(sectorsSummary, refs, chartTheme);
}

export function renderItems(state, refs) {
  const query = refs.productSearch.value.trim().toLowerCase();
  const itemRows = query ? state.filtered.filter((item) => (item.product || "").toLowerCase().includes(query)) : state.filtered;
  refs.itemsBody.innerHTML = itemRows.map((item) => { const pending = !item.reason; return `<tr class="${pending ? "pending-row" : "resolved-row"}"><td>${formatDate(item.date)}</td><td>${escapeHtml(item.competenceMonth)}</td><td>${escapeHtml(item.store)}</td><td>${escapeHtml(item.type)}</td><td>${escapeHtml(item.sector)}</td><td>${escapeHtml(item.invoice)}</td><td>${escapeHtml(item.product)}</td><td>${num(item.quantity)}</td><td>${brl(item.value)}</td><td>${buildRowReasonCell(item.reason)}</td></tr>`; }).join("") || `<tr><td colspan="10">${renderEmpty(state.items.length ? "Nenhum item encontrado para esse filtro." : "Nenhum XML importado ainda.")}</td></tr>`;
  renderProductSummary(itemRows, query, refs);
}

function renderProductSummary(itemRows, query, refs) {
  if (!query) { refs.productSummary.innerHTML = renderEmpty("Pesquise um produto para ver resumo por periodo, notas e motivos."); return; }
  if (!itemRows.length) { refs.productSummary.innerHTML = renderEmpty("Nenhum produto encontrado para essa busca nos filtros atuais."); return; }
  const pendingSummary = getPendingSummary(itemRows);
  const noteCount = new Set(itemRows.map((item) => item.noteKey)).size;
  const storeCount = new Set(itemRows.map((item) => item.store)).size;
  const totalValue = itemRows.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const totalQty = itemRows.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const reasons = {};
  itemRows.forEach((item) => {
    const reason = item.reason || "Sem motivo";
    if (!reasons[reason]) reasons[reason] = { value: 0, items: 0, notes: new Set() };
    reasons[reason].value += Number(item.value || 0);
    reasons[reason].items += 1;
    reasons[reason].notes.add(item.noteKey);
  });
  const reasonRows = Object.entries(reasons).sort((a, b) => ((b[0] === "Sem motivo") - (a[0] === "Sem motivo")) || (b[1].value - a[1].value));
  refs.productSummary.innerHTML = `<div class="summary-grid"><div class="summary-card"><div class="label">Busca</div><strong>${escapeHtml(query)}</strong></div><div class="summary-card"><div class="label">Notas no periodo</div><strong>${noteCount}</strong></div><div class="summary-card"><div class="label">Quantidade total</div><strong>${num(totalQty)}</strong></div><div class="summary-card"><div class="label">Valor total</div><strong>${brl(totalValue)}</strong></div></div><div class="summary-grid"><div class="summary-card"><div class="label">Itens encontrados</div><strong>${itemRows.length}</strong></div><div class="summary-card"><div class="label">Lojas</div><strong>${storeCount}</strong></div><div class="summary-card"><div class="label">Pendentes</div><strong>${pendingSummary.pendingCount}</strong></div><div class="summary-card"><div class="label">Concluido</div><strong>${pendingSummary.completionRate}%</strong></div></div><div class="reason-list">${reasonRows.map(([reason, info]) => `<div class="reason-chip"><div><strong>${escapeHtml(reason)}</strong><div class="hint">${info.items} item(ns) - ${info.notes.size} nota(s)</div></div><div class="cell-stack">${reason === "Sem motivo" ? '<span class="status-badge warning">Pendencia</span>' : '<span class="status-badge success">Classificado</span>'}<strong>${brl(info.value)}</strong></div></div>`).join("")}</div>`;
}

export function renderClassification(state, refs) {
  const noteKey = refs.noteSelect.value;
  const note = state.notes.find((entry) => entry.key === noteKey);
  refs.selectAll.checked = false;
  if (!note) {
    refs.classBody.innerHTML = `<tr><td colspan="5">${renderEmpty("Selecione uma nota para comecar a classificacao.")}</td></tr>`;
    refs.noteSummary.innerHTML = renderEmpty("Nenhuma nota selecionada.");
    return;
  }
  refs.classBody.innerHTML = note.items.length
    ? note.items.map((item) => { const pending = !item.reason; return `<tr class="${pending ? "pending-row" : "resolved-row"}"><td><input type="checkbox" data-action="toggle-selected" data-id="${escapeHtml(item.id)}" ${item.selected ? "checked" : ""}></td><td><div class="cell-stack"><strong>${escapeHtml(item.product)}</strong>${buildReasonBadge(item.reason)}</div></td><td>${num(item.quantity)}</td><td>${brl(item.value)}</td><td><div class="cell-stack"><select class="${pending ? "pending-select" : "resolved-select"}" data-action="set-reason" data-id="${escapeHtml(item.id)}"><option value="">Selecionar</option>${REASONS.map((reason) => `<option value="${escapeHtml(reason)}" ${item.reason === reason ? "selected" : ""}>${escapeHtml(reason)}</option>`).join("")}</select><span class="row-meta">${pending ? "Item sem motivo definido" : "Motivo salvo"}</span></div></td></tr>`; }).join("")
    : `<tr><td colspan="5">${renderEmpty("Esta nota foi carregada, mas ainda nao possui itens associados no painel.")}</td></tr>`;
  refs.selectAll.checked = note.items.length > 0 && note.items.every((item) => item.selected);
  const pending = note.items.filter((item) => !item.reason).length;
  const completion = note.items.length ? Math.round(((note.items.length - pending) / note.items.length) * 100) : 100;
  const summaryAlert = !note.items.length
    ? '<div class="summary-alert warning"><strong>Itens nao carregados</strong><span>A nota existe no banco, mas nenhum item foi associado a ela no painel.</span></div>'
    : pending
      ? `<div class="summary-alert warning"><strong>${pending} item(ns) pendente(s)</strong><span>${completion}% da nota classificada. Priorize essa nota antes de fechar o recorte.</span></div>`
      : '<div class="summary-alert success"><strong>Nota concluida</strong><span>Todos os itens desta nota ja estao classificados.</span></div>';
  const monthOptions = buildCompetenceMonthOptions(state, note);
  refs.noteSummary.innerHTML = `${summaryAlert}<div class="mini-item"><strong>Loja</strong><span>${escapeHtml(note.store)}</span></div><div class="mini-item"><strong>Nota</strong><span>${escapeHtml(note.invoice)}</span></div><div class="mini-item"><strong>Tipo</strong><span>${escapeHtml(note.displayType || note.type)}</span></div><div class="mini-item"><strong>Emissao</strong><span>${escapeHtml(formatDate(note.date))}</span></div><div class="mini-item"><strong>Competencia atual</strong><span>${escapeHtml(note.competenceMonth || "-")}</span></div><div class="mini-item"><strong>Itens pendentes</strong><span>${pending}</span></div><div class="mini-item"><strong>Percentual classificado</strong><span>${completion}%</span></div><div class="mini-item editor"><strong>Mes de competencia</strong><div class="inline-edit"><select id="noteCompetenceMonthEdit">${monthOptions.map((month) => `<option value="${escapeHtml(month.value)}" ${note.competenceMonth === month.value ? "selected" : ""}>${escapeHtml(month.label)}</option>`).join("")}</select><button type="button" data-action="save-competence-month" data-note-key="${escapeHtml(note.key)}">Salvar mes</button></div><div class="hint">Use quando a nota foi lancada em atraso e precisa entrar em outro mes do fechamento.</div></div><div class="mini-item editor"><strong>Setor</strong><div class="inline-edit"><select id="noteSectorEdit">${SECTOR_OPTIONS.map((sector) => `<option value="${escapeHtml(sector)}" ${note.sector === sector ? "selected" : ""}>${escapeHtml(sector)}</option>`).join("")}</select><button type="button" data-action="save-sector" data-note-key="${escapeHtml(note.key)}">Salvar setor</button></div><div class="hint">Use esse ajuste quando a nota vier sem setor identificado ou com setor incorreto.</div></div><div class="mini-item"><strong>Operacao</strong><span>${escapeHtml(note.operation || "-")}</span></div><div class="mini-item editor"><strong>Acoes</strong><div class="inline-edit"><button type="button" class="danger-btn" data-action="remove-note" data-note-key="${escapeHtml(note.key)}">Excluir esta nota</button></div><div class="hint">A exclusao remove a nota e todos os seus itens do banco e do dashboard.</div></div>`;
}

function buildReportHtml(state, refs) {
  const reportItems = state.filtered.filter((item) => item.type !== "Outros");
  const basis = refs.basis.value;
  const notesCount = new Set(reportItems.map((item) => item.noteKey)).size;
  const total = reportItems.reduce((sum, item) => sum + item.value, 0);
  const losses = reportItems.filter((item) => item.type === "Perdas").reduce((sum, item) => sum + item.value, 0);
  const usage = reportItems.filter((item) => item.type === "Uso/Consumo").reduce((sum, item) => sum + item.value, 0);
  const stores = {}, sectors = {}, reasons = {}, months = {}, products = {};
  reportItems.forEach((item) => {
    stores[item.store] = (stores[item.store] || 0) + item.value;
    sectors[item.sector] = (sectors[item.sector] || 0) + item.value;
    const reason = item.reason || "Sem motivo";
    reasons[reason] = (reasons[reason] || 0) + item.value;
    const month = basis === "competence" ? item.competenceMonth : item.emissionMonth;
    if (!months[month]) months[month] = { total: 0, notes: new Set(), losses: 0, usage: 0 };
    months[month].total += item.value;
    months[month].notes.add(item.noteKey);
    if (item.type === "Perdas") months[month].losses += item.value;
    if (item.type === "Uso/Consumo") months[month].usage += item.value;
    const product = (item.product || "Produto").trim() || "Produto";
    if (!products[product]) products[product] = { value: 0, quantity: 0, notes: new Set(), stores: {} };
    products[product].value += item.value;
    products[product].quantity += Number(item.quantity || 0);
    products[product].notes.add(item.noteKey);
    products[product].stores[item.store] = (products[product].stores[item.store] || 0) + item.value;
  });
  const topStore = Object.entries(stores).sort((a, b) => b[1] - a[1])[0];
  const topSector = Object.entries(sectors).sort((a, b) => b[1] - a[1])[0];
  const topReason = Object.entries(reasons).sort((a, b) => b[1] - a[1])[0];
  const monthRows = chartLabelsFromMap(months).map((month) => { const data = months[month]; return `<tr><td>${escapeHtml(month)}</td><td>${data.notes.size}</td><td>${brl(data.losses)}</td><td>${brl(data.usage)}</td><td>${brl(data.total)}</td></tr>`; }).join("");
  const sectorRows = Object.entries(sectors).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([sector, value]) => `<tr><td>${escapeHtml(sector)}</td><td>${brl(value)}</td><td>${total ? ((value / total) * 100).toFixed(1).replace(".", ",") + "%" : "0,0%"}</td></tr>`).join("");
  const reasonRows = Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([reason, value]) => `<tr><td>${escapeHtml(reason)}</td><td>${brl(value)}</td><td>${total ? ((value / total) * 100).toFixed(1).replace(".", ",") + "%" : "0,0%"}</td></tr>`).join("");
  const productRows = Object.entries(products).sort((a, b) => b[1].value - a[1].value).slice(0, 15).map(([product, data], index) => { const topStoreName = Object.entries(data.stores).sort((a, b) => b[1] - a[1])[0]; return `<tr><td>${index + 1}</td><td>${escapeHtml(product)}</td><td>${data.notes.size}</td><td>${num(data.quantity)}</td><td>${brl(data.value)}</td><td>${escapeHtml(topStoreName ? topStoreName[0] : "-")}</td></tr>`; }).join("");
  const filters = currentFilterSummary(refs).map((filter) => `<span class="chip"><strong>${escapeHtml(filter.label)}:</strong> ${escapeHtml(filter.value)}</span>`).join("") || '<span class="chip">Sem filtros específicos</span>';
  const generatedAt = new Date().toLocaleString("pt-BR");
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatorio Sistema Controle de Fechamentos Razarth</title><style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;font-family:Segoe UI,Tahoma,sans-serif;color:#122033;background:#eef3f9}.page{width:100%;max-width:190mm;margin:0 auto;background:#fff;box-shadow:0 10px 30px rgba(15,23,42,.08);overflow:hidden}.hero{padding:24px 26px;background:linear-gradient(135deg,#081a3a 0%,#133b73 55%,#e8f0ff 160%);color:#fff}.hero h1{margin:0;font-size:28px;line-height:1.08}.hero p{margin:10px 0 0;color:rgba(255,255,255,.82);font-size:13px;line-height:1.5}.stamp{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.stamp-box{padding:12px 14px;border:1px solid rgba(255,255,255,.18);border-radius:18px;background:rgba(255,255,255,.08);min-width:165px;text-align:right}.content{padding:20px 26px 28px}.chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px}.chip{padding:8px 10px;border-radius:999px;background:#edf4ff;border:1px solid #cfe0ff;font-size:12px;color:#17325c}.section{margin-top:18px;break-inside:avoid}.section h2{margin:0 0 10px;font-size:16px;color:#102546}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.card{padding:14px 16px;border-radius:18px;background:linear-gradient(180deg,#fbfdff 0%,#f4f8ff 100%);border:1px solid #dbe5f3;break-inside:avoid}.card .label{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#5b6f90}.card .value{margin-top:8px;font-size:24px;font-weight:800;color:#0f172a}.card .meta{margin-top:8px;font-size:12px;color:#62748f}.split{display:grid;grid-template-columns:1.15fr .85fr;gap:14px;align-items:start}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{padding:10px 12px;border-bottom:1px solid #e6ecf5;text-align:left;font-size:12px;vertical-align:top;overflow-wrap:anywhere}th{background:#f5f8fc;color:#46607f;font-weight:700}.table-card{border:1px solid #dbe5f3;border-radius:18px;overflow:hidden;background:#fff;break-inside:avoid}.summary-band{display:grid;grid-template-columns:1.2fr .8fr .8fr;gap:12px;margin-top:14px}.highlight{padding:16px;border-radius:20px;background:#0f172a;color:#fff;break-inside:avoid}.highlight .small{font-size:12px;color:rgba(255,255,255,.74)}.highlight strong{display:block;margin-top:6px;font-size:22px}.foot{margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;display:flex;justify-content:space-between;gap:12px}</style></head><body><div class="page"><div class="hero"><div class="stamp"><div><h1>Sistema Controle de Fechamentos Razarth</h1><p>Documento executivo gerado a partir do filtro atual do dashboard.</p></div><div class="stamp-box"><div style="font-size:11px;opacity:.8">Gerado em</div><div style="margin-top:6px;font-weight:700">${escapeHtml(generatedAt)}</div></div></div></div><div class="content"><div class="chips">${filters}</div><div class="grid"><div class="card"><div class="label">Notas</div><div class="value">${notesCount}</div><div class="meta">Quantidade no recorte filtrado</div></div><div class="card"><div class="label">Valor total</div><div class="value">${brl(total)}</div><div class="meta">Soma consolidada do filtro</div></div><div class="card"><div class="label">Perdas</div><div class="value">${brl(losses)}</div><div class="meta">Volume classificado como perdas</div></div><div class="card"><div class="label">Uso/Consumo</div><div class="value">${brl(usage)}</div><div class="meta">Volume de uso interno</div></div></div><div class="summary-band"><div class="highlight"><div class="small">Loja com maior impacto</div><strong>${escapeHtml(topStore ? topStore[0] : "-")}</strong><div class="small">${topStore ? brl(topStore[1]) : "Sem dados"}</div></div><div class="highlight" style="background:#17325c"><div class="small">Setor dominante</div><strong>${escapeHtml(topSector ? topSector[0] : "-")}</strong><div class="small">${topSector ? brl(topSector[1]) : "Sem dados"}</div></div><div class="highlight" style="background:#1e3a8a"><div class="small">Motivo dominante</div><strong>${escapeHtml(topReason ? topReason[0] : "-")}</strong><div class="small">${topReason ? brl(topReason[1]) : "Sem dados"}</div></div></div><div class="section"><h2>Movimentacao por mes</h2><div class="table-card"><table><thead><tr><th>Mes</th><th>Notas</th><th>Perdas</th><th>Uso/Consumo</th><th>Total</th></tr></thead><tbody>${monthRows || '<tr><td colspan="5">Sem dados</td></tr>'}</tbody></table></div></div><div class="section split"><div><h2>Ranking de produtos</h2><div class="table-card"><table><thead><tr><th>#</th><th>Produto</th><th>Notas</th><th>Qtd</th><th>Valor</th><th>Loja lider</th></tr></thead><tbody>${productRows || '<tr><td colspan="6">Sem dados</td></tr>'}</tbody></table></div></div><div><h2>Distribuicao por setor</h2><div class="table-card"><table><thead><tr><th>Setor</th><th>Valor</th><th>Peso</th></tr></thead><tbody>${sectorRows || '<tr><td colspan="3">Sem dados</td></tr>'}</tbody></table></div><div class="section"><h2>Distribuicao por motivo</h2><div class="table-card"><table><thead><tr><th>Motivo</th><th>Valor</th><th>Peso</th></tr></thead><tbody>${reasonRows || '<tr><td colspan="3">Sem dados</td></tr>'}</tbody></table></div></div></div></div><div class="foot"><span>Sistema Controle de Fechamentos Razarth</span><span>Use Imprimir &gt; Salvar em PDF para gerar o arquivo final.</span></div></div></div><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));<\/script></body></html>`;
}

export function openPrintReport(state, refs) {
  if (!state.filtered.length) throw new Error("Carregue ou filtre dados antes de gerar o relatório.");
  const reportWindow = window.open("about:blank", "_blank");
  if (!reportWindow) throw new Error("Não foi possível abrir a janela do relatório.");
  reportWindow.document.open();
  reportWindow.document.write(buildReportHtml(state, refs));
  reportWindow.document.close();
  reportWindow.focus();
}

export function exportJson(state) {
  if (!state.items.length) throw new Error("Não há dados para exportar.");
  const blob = new Blob([JSON.stringify({ itens: state.items }, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "sistema_controle_fechamentos_razarth.json";
  link.click();
}

export function exportCsv(state) {
  if (!state.filtered.length) throw new Error("Não há dados filtrados para exportar.");
  const rows = [["emissao", "competencia", "loja", "tipo", "setor", "nota", "produto", "qtd", "valor", "motivo"], ...state.filtered.map((item) => [item.date, item.competenceMonth, item.store, item.type, item.sector, item.invoice, item.product, item.quantity, item.value, item.reason || ""])];
  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "sistema_controle_fechamentos_razarth.csv";
  link.click();
}





