import { REASONS, sortLabels } from "./classificacao.js";

function fillSelect(select, values) {
  const currentValue = select.value;
  select.innerHTML = "";
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
  if (values.includes(currentValue)) select.value = currentValue;
}

export function buildNoteOptions(state, refs) {
  const selected = refs.noteSelect.value;
  const noteStore = refs.noteStoreFilter.value;
  const noteMonth = refs.noteMonthFilter.value;
  const basis = refs.basis.value;
  const order = ["Perdas", "Uso/Consumo", "Saída entre lojas", "Outros"];

  const scopedNotes = state.notes.filter((note) => {
    const sample = note.items[0];
    const monthValue = basis === "competence"
      ? (sample?.competenceMonth || note.competenceMonth)
      : (sample?.emissionMonth || note.emissionMonth);
    if (noteStore !== "TODAS" && note.store !== noteStore) return false;
    if (noteMonth !== "TODOS" && monthValue !== noteMonth) return false;
    return true;
  });

  const stores = sortLabels(new Set(scopedNotes.map((note) => note.store)));
  const html = ['<option value="">Selecione uma nota</option>'];

  stores.forEach((store) => {
    const storeNotes = scopedNotes.filter((note) => note.store === store);
    order.forEach((type) => {
      const typeNotes = storeNotes.filter((note) => note.type === type);
      if (!typeNotes.length) return;
      html.push(`<optgroup label="${store} - ${type}">`);
      typeNotes
        .sort((a, b) => String(a.invoice).localeCompare(String(b.invoice), "pt-BR", { numeric: true }))
        .forEach((note) => {
          const sample = note.items[0];
          const monthValue = basis === "competence"
            ? (sample?.competenceMonth || note.competenceMonth)
            : (sample?.emissionMonth || note.emissionMonth);
          const pendingCount = note.items.filter((item) => !item.reason).length;
          const pendingLabel = pendingCount ? ` - ${pendingCount} pend.` : "";
          html.push(`<option value="${note.key}">NF ${note.invoice} · ${monthValue || "Sem data"} · ${note.sector} · ${note.displayType || note.type}${pendingLabel}</option>`);
        });
      html.push("</optgroup>");
    });
  });

  refs.noteSelect.innerHTML = html.join("");
  if (selected && scopedNotes.some((note) => note.key === selected)) refs.noteSelect.value = selected;
}

export function refreshFilters(state, refs) {
  const stores = sortLabels(new Set(state.items.map((item) => item.store)));
  const types = sortLabels(new Set(state.items.map((item) => item.type)));
  const sectors = sortLabels(new Set(state.items.map((item) => item.sector)));
  const baseMonths = refs.basis.value === "competence" ? state.items.map((item) => item.competenceMonth) : state.items.map((item) => item.emissionMonth);
  const months = sortLabels(new Set(baseMonths));

  fillSelect(refs.storeFilter, ["TODAS", ...stores]);
  fillSelect(refs.typeFilter, ["TODOS", ...types]);
  fillSelect(refs.sectorFilter, ["TODOS", ...sectors]);
  fillSelect(refs.reasonFilter, ["TODOS", "SEM", ...REASONS]);
  fillSelect(refs.monthFilter, ["TODOS", ...months]);
  fillSelect(refs.noteStoreFilter, ["TODAS", ...sortLabels(new Set(state.notes.map((note) => note.store)))]);
  fillSelect(refs.noteMonthFilter, ["TODOS", ...months]);

  refs.applyAll.innerHTML = '<option value="">Aplicar para todos</option>' + REASONS.map((reason) => `<option>${reason}</option>`).join("");
  refs.applySelected.innerHTML = '<option value="">Aplicar para selecionados</option>' + REASONS.map((reason) => `<option>${reason}</option>`).join("");

  buildNoteOptions(state, refs);
}

export function applyFilters(state, refs) {
  const store = refs.storeFilter.value;
  const type = refs.typeFilter.value;
  const sector = refs.sectorFilter.value;
  const reason = refs.reasonFilter.value;
  const month = refs.monthFilter.value;
  const basis = refs.basis.value;
  const pendingOnly = refs.pendingOnlyBtn?.getAttribute("aria-pressed") === "true";

  return state.items.filter((item) => {
    const monthValue = basis === "competence" ? item.competenceMonth : item.emissionMonth;
    if (store !== "TODAS" && item.store !== store) return false;
    if (type !== "TODOS" && item.type !== type) return false;
    if (sector !== "TODOS" && item.sector !== sector) return false;
    if (reason === "SEM" && item.reason) return false;
    if (reason !== "TODOS" && reason !== "SEM" && item.reason !== reason) return false;
    if (month !== "TODOS" && monthValue !== month) return false;
    if (pendingOnly && item.reason) return false;
    return true;
  });
}

export function currentFilterSummary(refs) {
  const entries = [["Loja", refs.storeFilter], ["Tipo", refs.typeFilter], ["Setor", refs.sectorFilter], ["Motivo", refs.reasonFilter], ["Mês", refs.monthFilter], ["Base", refs.basis]];

  const summary = entries.map(([label, element]) => {
    let value = element.value;
    if (element === refs.basis) value = value === "competence" ? "Competencia" : "Emissao";
    if (value === "TODAS" || value === "TODOS") return null;
    if (value === "SEM") value = "Sem motivo";
    return { label, value };
  }).filter(Boolean);

  if (refs.pendingOnlyBtn?.getAttribute("aria-pressed") === "true") {
    summary.push({ label: "Pendencia", value: "Somente pendentes" });
  }

  return summary;
}
