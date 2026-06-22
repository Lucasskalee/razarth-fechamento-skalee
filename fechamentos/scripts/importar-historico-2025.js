#!/usr/bin/env node

/*
 * Importa o historico consolidado de fechamento de 2025 a partir da planilha
 * "material uso consumo e perdas lojas 2025.xlsx".
 *
 * Uso seguro:
 *   node scripts/importar-historico-2025.js --dry-run
 *   node scripts/importar-historico-2025.js --execute
 */

const fs = require("fs");
const path = require("path");

let XLSX;
try {
  XLSX = require("xlsx");
} catch (error) {
  console.error("Dependencia ausente: instale o leitor XLSX com `npm install xlsx`.");
  process.exit(1);
}

const YEAR = 2025;
const TABLE = "historical_closing_entries";
const SOURCE = "planilha_historica_excel";
const DETAIL_LEVEL = "consolidado_mensal";
const BASE_NOTES = "Importado do Excel histórico 2025";
const CORRECTED_TEXT_NOTE = "Valor corrigido de célula textual na planilha original; total anual da planilha pode não considerar este valor.";
const DEFAULT_FILE = "material uso consumo e perdas lojas 2025.xlsx";
const UPSERT_CONFLICT = "year,month_number,store_name,entry_type,sector";
const CHUNK_SIZE = 500;
const VALIDATION_TOLERANCE = 0.05;

const SHEETS = [
  {
    name: "PERDAS  SAIDAS SETORES (2025)",
    entryType: "perdas_saidas",
    sectorMap: new Map([
      ["PERDAS FLV", "FLV"],
      ["PERDAS ACOUGUE", "AÇOUGUE"],
      ["PERDAS PADARIA", "PADARIA"],
      ["PERDAS PRODUCAO PADARIA", "PRODUÇÃO PADARIA"],
      ["PERDAS FRIOS E CONGELADOS", "FRIOS E CONGELADOS"],
      ["PERDAS PAGAS", "PERDAS PAGAS"],
      ["PERDAS FURTOS", "FURTOS"],
      ["PERDAS BEBIDAS", "BEBIDAS"],
      ["PERDAS LOJA E DEPOSITO", "LOJA E DEPÓSITO"],
      ["SAIDA DE UM PARA OUTRO", "SAÍDA DE UM PARA OUTRO"]
    ])
  },
  {
    name: "MATERIAL USO CONSUMO",
    entryType: "uso_consumo",
    sectorMap: new Map([
      ["CONSUMO SETOR ACOUGUE", "AÇOUGUE"],
      ["CONSUMO SETOR FLV", "FLV"],
      ["CONSUMO SETOR PADARIA", "PADARIA"],
      ["CONSUMO SETOR PRODUCAO", "PRODUÇÃO"],
      ["CONSUMO SETOR FRENTE CX", "FRENTE CX"],
      ["CONSUMO SETOR ADMINISTRATIVO", "ADMINISTRATIVO"],
      ["CONSUMO SETOR FATIACAO", "FATIAÇÃO"],
      ["CONSUMO SETOR LOJA DEPOSITO", "LOJA / DEPÓSITO"]
    ])
  }
];

const MONTHS = new Map([
  ["JANEIRO", 1],
  ["FEVEREIRO", 2],
  ["MARCO", 3],
  ["MARÇO", 3],
  ["ABRIL", 4],
  ["MAIO", 5],
  ["JUNHO", 6],
  ["JULHO", 7],
  ["AGOSTO", 8],
  ["SETEMBRO", 9],
  ["OUTUBRO", 10],
  ["NOVEMBRO", 11],
  ["DEZEMBRO", 12]
]);

const IGNORED_COLUMNS = new Set(["MEDIA", "MÉDIA", "TOTAL", "MAXIMO", "MÁXIMO"]);
const STORE_MAP = new Map([
  ["LOJA 01", "SOL 1"],
  ["LOJA 1", "SOL 1"],
  ["LOJA 02", "SOL 2"],
  ["LOJA 2", "SOL 2"],
  ["LOJA 03", "SOL 3"],
  ["LOJA 3", "SOL 3"],
  ["LOJA 04", "SOL 4"],
  ["LOJA 4", "SOL 4"],
  ["LOJA 06", "SOL 6"],
  ["LOJA 6", "SOL 6"],
  ["LOJA 07", "SOL 7"],
  ["LOJA 7", "SOL 7"],
  ["CD", "CD"]
]);

function parseArgs(argv) {
  const args = {
    dryRun: true,
    file: null,
    force: false,
    includeCorrectedTextValues: false,
    debugDivergences: false,
    debugOnlyUnexplained: false,
    modeExplicit: false
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--execute") {
      args.dryRun = false;
      args.modeExplicit = true;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
      args.modeExplicit = true;
    }
    else if (arg === "--force") args.force = true;
    else if (arg === "--include-corrected-text-values") args.includeCorrectedTextValues = true;
    else if (arg === "--debug-divergences") args.debugDivergences = true;
    else if (arg === "--debug-only-unexplained") args.debugOnlyUnexplained = true;
    else if (arg === "--file") {
      index += 1;
      args.file = path.resolve(process.cwd(), argv[index] || "");
    } else if (arg.startsWith("--file=")) {
      args.file = path.resolve(process.cwd(), arg.slice("--file=".length));
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Argumento desconhecido: ${arg}`);
    }
  }

  if (args.includeCorrectedTextValues && !args.modeExplicit) args.dryRun = false;
  if (!args.file) args.file = resolveDefaultWorkbook();

  return args;
}

function normalizeFilename(value) {
  return textKey(value).replace(/\s+/g, " ");
}

function resolveDefaultWorkbook() {
  const exactCandidates = [
    path.resolve(process.cwd(), DEFAULT_FILE),
    path.resolve(process.cwd(), "scripts", DEFAULT_FILE)
  ];

  for (const candidate of exactCandidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  const searchDirs = [process.cwd(), path.resolve(process.cwd(), "scripts")];
  const expectedKey = normalizeFilename(DEFAULT_FILE);

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    const match = fs.readdirSync(dir).find((filename) => {
      return /\.xlsx$/i.test(filename) && normalizeFilename(filename) === expectedKey;
    });
    if (match) return path.resolve(dir, match);
  }

  return exactCandidates[0];
}

function printHelp() {
  console.log(`
Importacao do historico consolidado 2025

Opcoes:
  --dry-run          Mostra resumo e amostra sem gravar. Padrao.
  --execute          Grava no Supabase usando upsert.
  --force            Permite importar mesmo com validacoes divergentes.
  --include-corrected-text-values
                     Inclui valores monetarios corrigidos de celulas textuais.
  --debug-divergences
                     Mostra diagnostico por setor, mes e linhas ignoradas dos blocos divergentes.
  --debug-only-unexplained
                     No diagnostico, mostra apenas divergencias nao explicadas.
  --file <caminho>   Caminho do XLSX. Padrao: ${DEFAULT_FILE}

Variaveis de ambiente:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY
`);
}

function textKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s*\/\s*/g, " ")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function displayText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function firstTextCell(row) {
  for (const cell of row) {
    const text = displayText(cell);
    if (text) return text;
  }
  return "";
}

function normalizeStore(value) {
  const key = textKey(value);
  if (STORE_MAP.has(key)) return STORE_MAP.get(key);

  const lojaMatch = key.match(/\bLOJA\s*0?([1-9][0-9]?)\b/);
  if (lojaMatch) return STORE_MAP.get(`LOJA ${lojaMatch[1].padStart(2, "0")}`) || null;
  if (key === "CD") return "CD";
  return null;
}

function isStoreRow(row) {
  return row.some((cell) => normalizeStore(cell));
}

function storeFromRow(row) {
  for (const cell of row) {
    const store = normalizeStore(cell);
    if (store) return store;
  }
  return null;
}

function normalizeSector(value, sheetConfig) {
  const key = textKey(value);
  return sheetConfig.sectorMap.get(key) || null;
}

function isTotalRow(value) {
  const key = textKey(value);
  return key === "TOTAL" || key === "TOTAL GERAL" || key === "TOTAIS";
}

function isIgnoredColumn(value) {
  return IGNORED_COLUMNS.has(textKey(value));
}

function monthFromHeader(value) {
  const key = textKey(value);
  if (MONTHS.has(key)) return MONTHS.get(key);

  for (const [monthName, monthNumber] of MONTHS.entries()) {
    if (key.includes(monthName)) return monthNumber;
  }

  return null;
}

function parseHeader(row) {
  const months = new Map();
  const ignored = [];
  let totalColumn = null;

  row.forEach((cell, columnIndex) => {
    const monthNumber = monthFromHeader(cell);
    if (monthNumber) months.set(columnIndex, monthNumber);
    else if (isIgnoredColumn(cell)) {
      ignored.push(columnIndex);
      if (textKey(cell) === "TOTAL") totalColumn = columnIndex;
    }
  });

  return { months, ignored, totalColumn };
}

function findSectorCell(row, sheetConfig) {
  for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
    const raw = displayText(row[columnIndex]);
    if (!raw || monthFromHeader(raw)) continue;
    if (isTotalRow(raw)) return { raw, columnIndex };
    if (isIgnoredColumn(raw)) continue;
    if (normalizeSector(raw, sheetConfig) || isTotalRow(raw)) {
      return { raw, columnIndex };
    }
  }

  return { raw: "", columnIndex: -1 };
}

function isEmptyCell(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

function countSeparators(value) {
  return (value.match(/[.,]/g) || []).length;
}

function parseBrazilianMoney(value, context, corrections, meta = null, recordCorrection = true) {
  if (isEmptyCell(value)) return null;
  if (typeof value === "number") return Number(value.toFixed(2));

  const original = String(value).trim();
  if (!original) return null;

  const withoutSpaces = original.replace(/\s+/g, "");
  const sign = withoutSpaces.startsWith("-") ? -1 : 1;
  const numericText = withoutSpaces.replace(/[^\d.,-]/g, "").replace(/-/g, "");
  if (!numericText) return null;

  const separatorMatches = [...numericText.matchAll(/[.,]/g)];
  const lastSeparator = separatorMatches.at(-1);
  let normalized;
  let corrected = false;

  if (!lastSeparator) {
    normalized = numericText;
  } else {
    const decimalLength = numericText.length - lastSeparator.index - 1;
    const rawIntegerPart = numericText.slice(0, lastSeparator.index);
    let integerPart = rawIntegerPart.replace(/[.,]/g, "");
    const decimalPart = numericText.slice(lastSeparator.index + 1).replace(/[.,]/g, "");

    if (/^\d[.,]\d{2}$/.test(rawIntegerPart) && decimalLength === 2) {
      integerPart = `${integerPart}${integerPart.at(-1)}`;
      corrected = true;
    }

    normalized = `${integerPart || "0"}.${decimalPart}`;

    const hasMixedSeparators = numericText.includes(".") && numericText.includes(",");
    const hasRepeatedSeparators = countSeparators(numericText) > 1;
    const unusualDecimal = decimalLength !== 2;
    const nonStandardThousands = hasRepeatedSeparators && decimalLength === 2;
    corrected = hasMixedSeparators || nonStandardThousands || unusualDecimal || numericText !== original;
  }

  const amount = Number(normalized) * sign;
  if (!Number.isFinite(amount)) {
    console.warn(`[valor ignorado] Nao foi possivel converter "${original}" em ${context}.`);
    return null;
  }

  if (corrected && recordCorrection) {
    corrections.push({
      original,
      converted: Number(amount.toFixed(2)),
      context,
      sheet: meta?.sheet || "",
      store: meta?.store || "",
      entry_type: meta?.entryType || "",
      sector: meta?.sector || "",
      month: meta?.month || null
    });
  }

  return Number(amount.toFixed(2));
}

function partialReason(storeName, entryType, sector, monthNumber) {
  if (entryType === "uso_consumo" && storeName === "SOL 6" && sector === "LOJA / DEPÓSITO") {
    return "uso e consumo de LOJA 06 apenas com LOJA / DEPÓSITO";
  }
  if (storeName === "SOL 4" && monthNumber === 12) {
    return "LOJA 04 apenas em dezembro";
  }
  if (entryType === "perdas_saidas" && storeName === "CD" && sector === "SAÍDA DE UM PARA OUTRO") {
    return "CD apenas com SAÍDA DE UM PARA OUTRO";
  }
  return "";
}

function blockPartialReason(storeName, entryType, blockEntries) {
  if (entryType === "uso_consumo" && storeName === "SOL 6") {
    return "uso e consumo de LOJA 06";
  }
  if (storeName === "SOL 4") {
    return "LOJA 04 com dados apenas de dezembro";
  }
  if (
    entryType === "perdas_saidas" &&
    storeName === "CD" &&
    blockEntries.some((entry) => entry.sector === "SAÍDA DE UM PARA OUTRO")
  ) {
    return "CD apenas com saída de um para outro";
  }
  return "";
}

function roundMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function entryKey(entry) {
  return [
    entry.year,
    entry.month_number,
    entry.store_name,
    entry.entry_type,
    entry.sector
  ].join("|");
}

function blockKey(storeName, entryType) {
  return `${storeName}|${entryType}`;
}

function rawCellLabel(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function excelCellType(worksheet, rowIndex, columnIndex) {
  const ref = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
  return worksheet[ref]?.t || "";
}

function addIgnored(diagnostics, payload) {
  diagnostics.ignored.push(payload);
}

function makeValidation(sheetConfig, storeName, blockEntries, totalAmount, rowIndex, partial) {
  const calculated = roundMoney(blockEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0));
  const informed = totalAmount === null ? null : roundMoney(totalAmount);
  const difference = informed === null ? null : roundMoney(calculated - informed);
  const status = informed === null
    ? "SEM_TOTAL"
    : Math.abs(difference) <= VALIDATION_TOLERANCE
      ? "OK"
      : "DIVERGENTE";

  return {
    sheet: sheetConfig.name,
    store_name: storeName,
    entry_type: sheetConfig.entryType,
    calculated_total: calculated,
    informed_total: informed,
    difference,
    status,
    partial: Boolean(partial),
    partial_reason: partial || "",
    total_row: rowIndex + 1
  };
}

function rebuildValidationsForEntries(validations, entries) {
  const amountByBlock = new Map();
  entries.forEach((entry) => {
    const key = `${entry.store_name}|${entry.entry_type}`;
    amountByBlock.set(key, roundMoney((amountByBlock.get(key) || 0) + Number(entry.amount || 0)));
  });

  return validations.map((validation) => {
    const calculated = roundMoney(amountByBlock.get(`${validation.store_name}|${validation.entry_type}`) || 0);
    const informed = validation.informed_total;
    const difference = informed === null ? null : roundMoney(calculated - informed);
    const status = informed === null
      ? "SEM_TOTAL"
      : Math.abs(difference) <= VALIDATION_TOLERANCE
        ? "OK"
        : "DIVERGENTE";

    return {
      ...validation,
      calculated_total: calculated,
      difference,
      status
    };
  });
}

function appendNote(note, extra) {
  return String(note || "").includes(extra) ? note : [note, extra].filter(Boolean).join(" - ");
}

function markSectorDifferenceTextValues(entries, diagnostics, corrections) {
  const entryByKey = new Map(entries.map((entry) => [entryKey(entry), entry]));
  let marked = 0;

  diagnostics.sectors.forEach((sector) => {
    if (sector.informed_total === null) return;

    const calculated = roundMoney(sector.entry_keys.reduce((sum, key) => {
      const entry = entryByKey.get(key);
      return sum + Number(entry?.amount || 0);
    }, 0));
    const difference = roundMoney(calculated - sector.informed_total);
    if (Math.abs(difference) <= VALIDATION_TOLERANCE) return;

    const sectorCells = diagnostics.cells.filter((cell) => {
      return cell.store_name === sector.store_name &&
        cell.entry_type === sector.entry_type &&
        cell.sector === sector.sector &&
        cell.entry_key &&
        entryByKey.has(cell.entry_key);
    });

    const candidate = sectorCells.find((cell) => {
      return !cell.corrected_text_value &&
        cell.converted !== null &&
        Math.abs(Math.abs(Number(cell.converted)) - Math.abs(difference)) <= VALIDATION_TOLERANCE;
    });

    if (!candidate) return;

    const entry = entryByKey.get(candidate.entry_key);
    if (!entry || entry.corrected_text_value) return;

    entry.corrected_text_value = true;
    entry.notes = appendNote(entry.notes, CORRECTED_TEXT_NOTE);
    candidate.corrected_text_value = true;
    corrections.push({
      original: candidate.raw,
      converted: Number(entry.amount),
      context: `${sector.sheet} | ${sector.store_name} | ${sector.sector} | mes ${candidate.month} | diferenca do total do setor`,
      sheet: sector.sheet,
      store: sector.store_name,
      entry_type: sector.entry_type,
      sector: sector.sector,
      month: candidate.month,
      entry_key: candidate.entry_key,
      inferred_from_sector_difference: true
    });
    marked += 1;
  });

  return marked;
}

function parseSheet(worksheet, sheetConfig, corrections, partialBlocks, validations, diagnostics) {
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: false
  });

  const entries = [];
  let currentStore = null;
  let monthColumns = new Map();
  let totalColumn = null;
  let blockEntries = [];

  function closeBlockFromTotal(row, rowIndex) {
    const totalAmount = totalColumn !== null
      ? parseBrazilianMoney(
        row[totalColumn],
        `${sheetConfig.name} | ${currentStore} | TOTAL | linha ${rowIndex + 1}`,
        corrections,
        { sheet: sheetConfig.name, store: currentStore, entryType: sheetConfig.entryType, sector: "TOTAL", month: "TOTAL" }
      )
      : null;
    const partial = blockPartialReason(currentStore, sheetConfig.entryType, blockEntries);
    validations.push(makeValidation(sheetConfig, currentStore, blockEntries, totalAmount, rowIndex, partial));
    addIgnored(diagnostics, {
      sheet: sheetConfig.name,
      store_name: currentStore,
      entry_type: sheetConfig.entryType,
      row: rowIndex + 1,
      reason: "linha TOTAL",
      raw: firstTextCell(row)
    });
    blockEntries = [];
    monthColumns = new Map();
    totalColumn = null;
  }

  function closeBlockWithoutTotal(rowIndex) {
    if (!currentStore || !blockEntries.length) return;
    const partial = blockPartialReason(currentStore, sheetConfig.entryType, blockEntries);
    validations.push(makeValidation(sheetConfig, currentStore, blockEntries, null, rowIndex, partial));
    blockEntries = [];
    monthColumns = new Map();
    totalColumn = null;
  }

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    if (isStoreRow(row)) {
      closeBlockWithoutTotal(rowIndex - 1);
      currentStore = storeFromRow(row);
      monthColumns = new Map();
      totalColumn = null;
      blockEntries = [];
      continue;
    }

    const header = parseHeader(row);
    if (currentStore && header.months.size > 0) {
      monthColumns = header.months;
      totalColumn = header.totalColumn;
      header.ignored.forEach((columnIndex) => {
        addIgnored(diagnostics, {
          sheet: sheetConfig.name,
          store_name: currentStore,
          entry_type: sheetConfig.entryType,
          row: rowIndex + 1,
          column: columnIndex + 1,
          reason: "coluna fora de mês",
          raw: rawCellLabel(row[columnIndex])
        });
      });
      continue;
    }

    if (!currentStore || monthColumns.size === 0) {
      if (firstTextCell(row)) {
        addIgnored(diagnostics, {
          sheet: sheetConfig.name,
          store_name: currentStore || "",
          entry_type: sheetConfig.entryType,
          row: rowIndex + 1,
          reason: currentStore ? "coluna fora de mês" : "linha fora de bloco",
          raw: firstTextCell(row)
        });
      }
      continue;
    }

    const sectorCell = findSectorCell(row, sheetConfig);
    if (!sectorCell.raw) {
      addIgnored(diagnostics, {
        sheet: sheetConfig.name,
        store_name: currentStore,
        entry_type: sheetConfig.entryType,
        row: rowIndex + 1,
        reason: firstTextCell(row) ? "setor não reconhecido" : "linha vazia",
        raw: firstTextCell(row)
      });
      continue;
    }
    if (isTotalRow(sectorCell.raw)) {
      closeBlockFromTotal(row, rowIndex);
      continue;
    }

    const sector = normalizeSector(sectorCell.raw, sheetConfig);
    if (!sector) {
      addIgnored(diagnostics, {
        sheet: sheetConfig.name,
        store_name: currentStore,
        entry_type: sheetConfig.entryType,
        row: rowIndex + 1,
        reason: "setor não reconhecido",
        raw: sectorCell.raw
      });
      continue;
    }

    const sectorTotal = totalColumn !== null
      ? parseBrazilianMoney(
        row[totalColumn],
        `${sheetConfig.name} | ${currentStore} | ${sector} | TOTAL setor | linha ${rowIndex + 1}`,
        corrections,
        { sheet: sheetConfig.name, store: currentStore, entryType: sheetConfig.entryType, sector, month: "TOTAL_SETOR" },
        false
      )
      : null;
    const sectorDiagnostic = {
      sheet: sheetConfig.name,
      store_name: currentStore,
      entry_type: sheetConfig.entryType,
      sector,
      row: rowIndex + 1,
      informed_total: sectorTotal,
      entry_keys: []
    };
    diagnostics.sectors.push(sectorDiagnostic);

    for (const [columnIndex, monthNumber] of monthColumns.entries()) {
      const rawAmount = row[columnIndex];
      const correctionIndex = corrections.length;
      const amount = parseBrazilianMoney(
        rawAmount,
        `${sheetConfig.name} | ${currentStore} | ${sector} | mes ${monthNumber} | linha ${rowIndex + 1}`,
        corrections,
        { sheet: sheetConfig.name, store: currentStore, entryType: sheetConfig.entryType, sector, month: monthNumber }
      );

      if (amount === null) {
        if (!isEmptyCell(rawAmount)) {
          addIgnored(diagnostics, {
            sheet: sheetConfig.name,
            store_name: currentStore,
            entry_type: sheetConfig.entryType,
            row: rowIndex + 1,
            column: columnIndex + 1,
            reason: "valor inválido",
            raw: rawCellLabel(rawAmount)
          });
        }
        diagnostics.cells.push({
          sheet: sheetConfig.name,
          store_name: currentStore,
          entry_type: sheetConfig.entryType,
          sector,
          row: rowIndex + 1,
          month: monthNumber,
          raw: rawCellLabel(rawAmount),
          excel_type: excelCellType(worksheet, rowIndex, columnIndex),
          converted: null,
          corrected_text_value: false,
          entry_key: "",
          imported: false
        });
        continue;
      }

      const reason = partialReason(currentStore, sheetConfig.entryType, sector, monthNumber);
      if (reason) partialBlocks.add(`${currentStore} | ${sheetConfig.entryType} | ${sector} | ${reason}`);
      const correction = corrections.length > correctionIndex ? corrections[corrections.length - 1] : null;
      const notes = [BASE_NOTES];
      if (reason) notes.push("dados parciais");
      if (correction) notes.push(CORRECTED_TEXT_NOTE);

      const entry = {
        year: YEAR,
        month_number: monthNumber,
        store_name: currentStore,
        entry_type: sheetConfig.entryType,
        sector,
        amount,
        source: SOURCE,
        detail_level: DETAIL_LEVEL,
        notes: notes.join(" - "),
        corrected_text_value: Boolean(correction)
      };
      if (correction) {
        correction.entry_type = sheetConfig.entryType;
        correction.entry_key = entryKey(entry);
      }
      sectorDiagnostic.entry_keys.push(entryKey(entry));
      diagnostics.cells.push({
        sheet: sheetConfig.name,
        store_name: currentStore,
        entry_type: sheetConfig.entryType,
        sector,
        row: rowIndex + 1,
        month: monthNumber,
        raw: rawCellLabel(rawAmount),
        excel_type: excelCellType(worksheet, rowIndex, columnIndex),
        converted: amount,
        corrected_text_value: Boolean(correction),
        entry_key: entryKey(entry),
        imported: true
      });
      entries.push(entry);
      blockEntries.push(entry);
    }
  }

  closeBlockWithoutTotal(rows.length - 1);

  return entries;
}

function dedupeEntries(entries) {
  const byKey = new Map();
  for (const entry of entries) {
    byKey.set(entryKey(entry), entry);
  }
  return [...byKey.values()];
}

function printStoreSummary(entries, validations) {
  const partialByStoreType = new Map();
  validations.forEach((validation) => {
    if (validation.partial) {
      partialByStoreType.set(`${validation.store_name}|${validation.entry_type}`, validation.partial_reason || "PARCIAL");
    }
  });

  const summary = new Map();
  entries.forEach((entry) => {
    const store = entry.store_name;
    if (!summary.has(store)) {
      summary.set(store, {
        loja: store,
        registros: 0,
        perdas_saidas: 0,
        uso_consumo: 0,
        parcial: "NAO"
      });
    }
    const row = summary.get(store);
    row.registros += 1;
    row[entry.entry_type] += 1;
  });

  for (const row of summary.values()) {
    const reasons = [...partialByStoreType.entries()]
      .filter(([key]) => key.startsWith(`${row.loja}|`))
      .map(([, reason]) => reason);
    if (reasons.length) row.parcial = `PARCIAL: ${[...new Set(reasons)].join("; ")}`;
  }

  console.log("");
  console.log("Resumo por loja:");
  console.table([...summary.values()].sort((a, b) => a.loja.localeCompare(b.loja)));
}

function correctionSummaryByBlock(corrections) {
  const byBlock = new Map();
  corrections.forEach((item) => {
    if (!item.store || !item.sheet || item.month === "TOTAL") return;
    const entryType = item.entry_type || SHEETS.find((sheet) => sheet.name === item.sheet)?.entryType;
    if (!entryType) return;

    const key = `${item.store}|${entryType}`;
    if (!byBlock.has(key)) {
      byBlock.set(key, {
        amount: 0,
        count: 0
      });
    }

    const row = byBlock.get(key);
    row.amount = roundMoney(row.amount + Number(item.converted || 0));
    row.count += 1;
  });
  return byBlock;
}

function validationExplanation(validation, correctionBlocks) {
  if (validation.status !== "DIVERGENTE") return "";

  const correction = correctionBlocks.get(`${validation.store_name}|${validation.entry_type}`);
  if (!correction) return "";

  const matchesCorrection = Math.abs(Math.abs(validation.difference) - correction.amount) <= VALIDATION_TOLERANCE;
  const prefix = matchesCorrection
    ? "diferença bate com correções textuais"
    : "há correções textuais no bloco";

  return `${prefix}: ${correction.count} célula(s), R$ ${correction.amount.toFixed(2)}. Valor corrigido de célula textual na planilha original; total anual da planilha pode não considerar este valor.`;
}

function isValidationExplainedByCorrections(validation, correctionBlocks) {
  if (validation.status !== "DIVERGENTE") return false;
  const correction = correctionBlocks.get(`${validation.store_name}|${validation.entry_type}`);
  if (!correction) return false;
  return Math.abs(Math.abs(validation.difference) - correction.amount) <= VALIDATION_TOLERANCE;
}

function classifyDivergences(validations, corrections) {
  const correctionBlocks = correctionSummaryByBlock(corrections);
  const divergent = validations.filter((validation) => validation.status === "DIVERGENTE");
  const explained = divergent.filter((validation) => isValidationExplainedByCorrections(validation, correctionBlocks));
  const unexplained = divergent.filter((validation) => !isValidationExplainedByCorrections(validation, correctionBlocks));
  return { correctionBlocks, divergent, explained, unexplained };
}

function printCorrectedValueImpact(corrections, validations) {
  const validationByBlock = new Map(validations.map((validation) => [
    `${validation.store_name}|${validation.entry_type}`,
    validation
  ]));

  console.log("");
  console.log("Valores textuais corrigidos:");
  console.table(corrections
    .filter((item) => item.month !== "TOTAL")
    .map((item) => {
      const validation = validationByBlock.get(`${item.store}|${item.entry_type}`);
      const explained = validation
        ? isValidationExplainedByCorrections(validation, correctionSummaryByBlock(corrections))
        : false;
      return {
        aba: item.sheet,
        loja: item.store,
        tipo: item.entry_type,
        setor: item.sector,
        mes: item.month,
        valor_original: item.original,
        valor_convertido: item.converted.toFixed(2),
        impacto_na_divergencia: validation?.status === "DIVERGENTE"
          ? explained ? "explica a divergencia do bloco" : "contribui, mas nao explica sozinho"
          : "sem divergencia no bloco"
      };
    }));
}

function printValidations(validations, corrections) {
  const correctionBlocks = correctionSummaryByBlock(corrections);

  console.log("");
  console.log("Validacao de totais por bloco:");
  console.table(validations.map((validation) => ({
    loja: validation.store_name,
    tipo: validation.entry_type,
    total_calculado: validation.calculated_total.toFixed(2),
    total_planilha: validation.informed_total === null ? "sem TOTAL" : validation.informed_total.toFixed(2),
    diferenca: validation.difference === null ? "" : validation.difference.toFixed(2),
    status: validation.partial ? `${validation.status} / PARCIAL` : validation.status,
    observacao: validationExplanation(validation, correctionBlocks)
  })));
}

function printDivergenceGroups(validations, corrections) {
  const { explained, unexplained } = classifyDivergences(validations, corrections);

  console.log("");
  console.log(`Divergencias explicadas por celulas textuais corrigidas: ${explained.length}`);
  if (explained.length) {
    console.table(explained.map((validation) => ({
      loja: validation.store_name,
      tipo: validation.entry_type,
      diferenca: validation.difference.toFixed(2)
    })));
  }

  console.log(`Divergencias nao explicadas: ${unexplained.length}`);
  if (unexplained.length) {
    console.table(unexplained.map((validation) => ({
      loja: validation.store_name,
      tipo: validation.entry_type,
      diferenca: validation.difference.toFixed(2)
    })));
  }
}

function sectorRowsForValidation(validation, diagnostics, importEntries) {
  const currentBlockKey = blockKey(validation.store_name, validation.entry_type);
  const importEntryKeys = new Set(importEntries.map(entryKey));
  const entryByKey = new Map(importEntries.map((entry) => [entryKey(entry), entry]));
  return diagnostics.sectors
    .filter((sector) => blockKey(sector.store_name, sector.entry_type) === currentBlockKey)
    .map((sector) => {
      const calculated = roundMoney(sector.entry_keys.reduce((sum, key) => {
        const entry = entryByKey.get(key);
        return sum + Number(entry?.amount || 0);
      }, 0));
      const difference = sector.informed_total === null ? null : roundMoney(calculated - sector.informed_total);
      const status = sector.informed_total === null
        ? "SEM_TOTAL"
        : Math.abs(difference) <= VALIDATION_TOLERANCE ? "OK" : "DIVERGENTE";

      return {
        loja: sector.store_name,
        tipo: sector.entry_type,
        setor: sector.sector,
        soma_meses: calculated,
        total_setor_planilha: sector.informed_total,
        diferenca: difference,
        status
      };
    });
}

function monthRowsForValidation(validation, diagnostics, importEntries, divergentSectorNames = null) {
  const currentBlockKey = blockKey(validation.store_name, validation.entry_type);
  const importEntryKeys = new Set(importEntries.map(entryKey));
  return diagnostics.cells
    .filter((cell) => blockKey(cell.store_name, cell.entry_type) === currentBlockKey)
    .filter((cell) => !divergentSectorNames || divergentSectorNames.has(cell.sector))
    .map((cell) => ({
      setor: cell.sector,
      mes: cell.month,
      valor_bruto: cell.raw,
      tipo_excel: cell.excel_type,
      valor_convertido: cell.converted,
      correcao_textual: cell.corrected_text_value,
      importado: Boolean(cell.entry_key && importEntryKeys.has(cell.entry_key)),
      entry_key: cell.entry_key
    }));
}

function ignoredRowsForValidation(validation, diagnostics) {
  const currentBlockKey = blockKey(validation.store_name, validation.entry_type);
  return diagnostics.ignored
    .filter((item) => blockKey(item.store_name, item.entry_type) === currentBlockKey)
    .map((item) => ({
      linha: item.row,
      coluna: item.column || "",
      motivo: item.reason,
      valor: item.raw
    }));
}

function monthName(monthNumber) {
  const found = [...MONTHS.entries()].find(([, number]) => number === Number(monthNumber));
  return found?.[0] || "";
}

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function buildDivergenceExport(validations, diagnostics, importEntries, corrections) {
  const { explained, unexplained, divergent } = classifyDivergences(validations, corrections);
  const correctedTextValues = corrections
    .filter((item) => item.month !== "TOTAL")
    .map((item) => ({
      sheet: item.sheet,
      store_name: item.store,
      entry_type: item.entry_type,
      sector: item.sector,
      month_number: item.month,
      original_value: item.original,
      converted_amount: item.converted
    }));

  const sectorBreakdown = [];
  const monthBreakdown = [];
  const ignoredRows = [];
  const csvRows = [];

  divergent.forEach((validation) => {
    const sectors = sectorRowsForValidation(validation, diagnostics, importEntries);
    sectors.forEach((sector) => {
      sectorBreakdown.push({
        store_name: validation.store_name,
        entry_type: validation.entry_type,
        sector: sector.setor,
        sector_total_calculated: sector.soma_meses,
        sector_total_sheet: sector.total_setor_planilha,
        sector_difference: sector.diferenca,
        status: sector.status,
        block_difference: validation.difference
      });
    });

    const sectorByName = new Map(sectors.map((sector) => [sector.setor, sector]));
    monthRowsForValidation(validation, diagnostics, importEntries).forEach((cell) => {
      const sector = sectorByName.get(cell.setor);
      const row = {
        store_name: validation.store_name,
        entry_type: validation.entry_type,
        sector: cell.setor,
        month_number: cell.mes,
        month_name: monthName(cell.mes),
        raw_value: cell.valor_bruto,
        excel_cell_type: cell.tipo_excel,
        converted_amount: cell.valor_convertido,
        corrected_text_value: cell.correcao_textual,
        imported: cell.importado,
        ignored_reason: "",
        sector_total_calculated: sector?.soma_meses ?? null,
        sector_total_sheet: sector?.total_setor_planilha ?? null,
        sector_difference: sector?.diferenca ?? null,
        block_difference: validation.difference
      };
      monthBreakdown.push(row);
      csvRows.push(row);
    });

    ignoredRowsForValidation(validation, diagnostics).forEach((item) => {
      const row = {
        store_name: validation.store_name,
        entry_type: validation.entry_type,
        sector: "",
        month_number: "",
        month_name: "",
        raw_value: item.valor,
        excel_cell_type: "",
        converted_amount: "",
        corrected_text_value: false,
        imported: false,
        ignored_reason: item.motivo,
        sector_total_calculated: "",
        sector_total_sheet: "",
        sector_difference: "",
        block_difference: validation.difference,
        row_number: item.linha,
        column_number: item.coluna
      };
      ignoredRows.push(row);
      csvRows.push(row);
    });
  });

  return {
    summary: {
      generated_at: new Date().toISOString(),
      divergent_blocks: divergent.length,
      explained_divergences: explained.length,
      unexplained_divergences: unexplained.length,
      corrected_text_values: correctedTextValues.length
    },
    unexplainedDivergences: unexplained.map((validation) => ({
      store_name: validation.store_name,
      entry_type: validation.entry_type,
      calculated_total: validation.calculated_total,
      sheet_total: validation.informed_total,
      difference: validation.difference
    })),
    sectorBreakdown,
    monthBreakdown,
    ignoredRows,
    correctedTextValues,
    csvRows
  };
}

function writeDivergenceFiles(validations, diagnostics, importEntries, corrections) {
  const logsDir = path.resolve(process.cwd(), "logs");
  fs.mkdirSync(logsDir, { recursive: true });

  const jsonPath = path.join(logsDir, "historico-2025-divergencias.json");
  const csvPath = path.join(logsDir, "historico-2025-divergencias.csv");
  const payload = buildDivergenceExport(validations, diagnostics, importEntries, corrections);
  const { csvRows, ...jsonPayload } = payload;

  fs.writeFileSync(jsonPath, JSON.stringify(jsonPayload, null, 2), "utf8");

  const columns = [
    "store_name",
    "entry_type",
    "sector",
    "month_number",
    "month_name",
    "raw_value",
    "excel_cell_type",
    "converted_amount",
    "corrected_text_value",
    "imported",
    "ignored_reason",
    "sector_total_calculated",
    "sector_total_sheet",
    "sector_difference",
    "block_difference"
  ];
  const csv = [
    columns.join(","),
    ...csvRows.map((row) => columns.map((column) => csvEscape(row[column])).join(","))
  ].join("\n");
  fs.writeFileSync(csvPath, csv, "utf8");

  return { jsonPath, csvPath, summary: payload.summary };
}

function printDivergenceDiagnostics(validations, diagnostics, importEntries, corrections, options) {
  const { explained, unexplained } = classifyDivergences(validations, corrections);
  const divergentBlocks = options.debugOnlyUnexplained
    ? unexplained
    : validations.filter((validation) => validation.status === "DIVERGENTE");
  if (!divergentBlocks.length) return;

  console.log("");
  console.log(options.debugOnlyUnexplained
    ? "Diagnostico compacto de divergencias nao explicadas:"
    : "Diagnostico detalhado de divergencias:");

  divergentBlocks.forEach((validation) => {
    console.log("");
    console.log(`Bloco divergente: ${validation.store_name} | ${validation.entry_type}`);
    console.log(`Total calculado: ${validation.calculated_total.toFixed(2)} | Total planilha: ${validation.informed_total?.toFixed(2) || "sem TOTAL"} | Diferenca: ${validation.difference?.toFixed(2) || ""}`);

    const sectorRows = sectorRowsForValidation(validation, diagnostics, importEntries);
    const printableSectorRows = sectorRows
      .filter((sector) => !options.debugOnlyUnexplained || sector.status === "DIVERGENTE")
      .map((sector) => ({
        loja: sector.loja,
        tipo: sector.tipo,
        setor: sector.setor,
        soma_meses: sector.soma_meses.toFixed(2),
        total_setor_planilha: sector.total_setor_planilha === null ? "sem TOTAL" : sector.total_setor_planilha.toFixed(2),
        diferenca: sector.diferenca === null ? "" : sector.diferenca.toFixed(2),
        status: sector.status
      }));

    console.log("Detalhe por setor:");
    console.table(printableSectorRows);

    const divergentSectors = new Set(sectorRows
      .filter((sector) => sector.status === "DIVERGENTE")
      .map((sector) => sector.setor));

    const cellRows = monthRowsForValidation(validation, diagnostics, importEntries, divergentSectors)
      .map((cell) => ({
        setor: cell.setor,
        mes: cell.mes,
        valor_bruto: cell.valor_bruto,
        tipo_excel: cell.tipo_excel,
        valor_convertido: cell.valor_convertido === null ? "" : Number(cell.valor_convertido).toFixed(2),
        correcao_textual: cell.correcao_textual ? "SIM" : "NAO",
        importado: cell.importado ? "SIM" : "NAO"
      }));

    if (cellRows.length) {
      console.log("Valores mes a mes dos setores divergentes:");
      console.table(cellRows);
    }

    const ignoredRows = ignoredRowsForValidation(validation, diagnostics);

    if (ignoredRows.length && !options.debugOnlyUnexplained) {
      console.log("Linhas/celulas ignoradas no bloco:");
      console.table(ignoredRows);
    }
  });
}

function sampleRows(entries) {
  return entries.slice(0, 12).map((entry) => ({
    ano: entry.year,
    mes: entry.month_number,
    loja: entry.store_name,
    tipo: entry.entry_type,
    setor: entry.sector,
    valor: Number(entry.amount || 0).toFixed(2),
    obs: entry.corrected_text_value ? "texto corrigido" : entry.notes.includes("dados parciais") ? "parcial" : ""
  }));
}

function printSummary(entries, corrections, partialBlocks, validations, options, diagnostics) {
  const byType = entries.reduce((acc, entry) => {
    acc[entry.entry_type] = (acc[entry.entry_type] || 0) + 1;
    return acc;
  }, {});
  const { divergent } = classifyDivergences(validations, corrections);

  console.log("");
  console.log(options.dryRun ? "DRY-RUN: nenhum dado foi gravado." : "IMPORTACAO REAL.");
  console.log(`Valores corrigidos de texto incluidos: ${options.includeCorrectedTextValues ? "SIM" : "NAO"}`);
  console.log(`Registros importaveis nesta execucao: ${entries.length}`);
  console.log(`  perdas_saidas: ${byType.perdas_saidas || 0}`);
  console.log(`  uso_consumo: ${byType.uso_consumo || 0}`);
  console.log(`Registros corrigidos por formatacao textual: ${corrections.length}`);
  console.log(`Blocos parciais identificados: ${partialBlocks.size}`);
  console.log(`Blocos divergentes na validacao final: ${divergent.length}`);

  if (partialBlocks.size) {
    console.log("");
    console.log("Parciais:");
    [...partialBlocks].forEach((item) => console.log(`  - ${item}`));
  }

  if (corrections.length) printCorrectedValueImpact(corrections, validations);

  printStoreSummary(entries, validations);
  printValidations(validations, corrections);
  printDivergenceGroups(validations, corrections);
  if (options.debugDivergences) {
    printDivergenceDiagnostics(validations, diagnostics, entries, corrections, options);
    const files = writeDivergenceFiles(validations, diagnostics, entries, corrections);
    console.log("");
    console.log(`Arquivo JSON de diagnostico: ${files.jsonPath}`);
    console.log(`Arquivo CSV de diagnostico: ${files.csvPath}`);
    console.log(`Resumo JSON/CSV: divergencias nao explicadas=${files.summary.unexplained_divergences}, explicadas=${files.summary.explained_divergences}`);
  }

  console.log("");
  console.log("Amostra de registros convertidos:");
  console.table(sampleRows(entries));
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY.");
  }

  return { url: url.replace(/\/+$/, ""), key };
}

async function upsertEntries(entries) {
  const { url, key } = supabaseConfig();
  let imported = 0;

  for (let index = 0; index < entries.length; index += CHUNK_SIZE) {
    const chunk = entries.slice(index, index + CHUNK_SIZE).map((entry) => {
      const { corrected_text_value, ...row } = entry;
      return row;
    });
    const endpoint = `${url}/rest/v1/${TABLE}?on_conflict=${encodeURIComponent(UPSERT_CONFLICT)}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(chunk)
    });

    if (!response.ok) {
      const detail = await response.text();
      if (/unique|constraint|conflict|42P10/i.test(detail)) {
        throw new Error(
          [
            "O upsert falhou porque o banco precisa de uma constraint unica para o conflito pedido.",
            "Aplique no Supabase antes da importacao real:",
            "",
            "create unique index if not exists historical_closing_entries_unique_import",
            "on public.historical_closing_entries (year, month_number, store_name, entry_type, sector);",
            "",
            `Resposta do Supabase: ${detail}`
          ].join("\n")
        );
      }

      throw new Error(`Falha no upsert (${response.status}): ${detail}`);
    }

    imported += chunk.length;
    console.log(`Registros importados: ${imported}/${entries.length}`);
  }

  return imported;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!fs.existsSync(args.file)) {
    throw new Error(`Arquivo XLSX nao encontrado: ${args.file}`);
  }

  const workbook = XLSX.readFile(args.file, { cellDates: false });
  const corrections = [];
  const partialBlocks = new Set();
  const validations = [];
  const diagnostics = { sectors: [], cells: [], ignored: [] };
  const allEntries = [];

  for (const sheetConfig of SHEETS) {
    const worksheet = workbook.Sheets[sheetConfig.name];
    if (!worksheet) {
      throw new Error(`Aba nao encontrada: ${sheetConfig.name}`);
    }

    const sheetEntries = parseSheet(worksheet, sheetConfig, corrections, partialBlocks, validations, diagnostics);
    console.log(`${sheetConfig.name}: ${sheetEntries.length} registro(s) encontrado(s).`);
    allEntries.push(...sheetEntries);
  }

  const entries = dedupeEntries(allEntries);
  if (entries.length !== allEntries.length) {
    console.log(`Duplicidades internas removidas antes do upsert: ${allEntries.length - entries.length}`);
  }

  const inferredCorrections = markSectorDifferenceTextValues(entries, diagnostics, corrections);
  if (inferredCorrections) {
    console.log(`Correcoes textuais inferidas por diferenca de total do setor: ${inferredCorrections}`);
  }

  const importEntries = args.includeCorrectedTextValues
    ? entries
    : entries.filter((entry) => !entry.corrected_text_value);
  const finalValidations = rebuildValidationsForEntries(validations, importEntries);
  const skippedCorrectedCount = entries.length - importEntries.length;

  if (skippedCorrectedCount) {
    console.log(`Valores corrigidos de texto ${args.includeCorrectedTextValues ? "incluidos" : "ignorados nesta execucao"}: ${skippedCorrectedCount}`);
  }

  printSummary(importEntries, corrections, partialBlocks, finalValidations, args, diagnostics);

  if (args.dryRun) return;

  const { explained, unexplained, divergent } = classifyDivergences(finalValidations, corrections);
  const canImportWithCorrectedTextValues = args.includeCorrectedTextValues && divergent.length > 0 && unexplained.length === 0 && explained.length === divergent.length;
  if (divergent.length && !canImportWithCorrectedTextValues && !args.force) {
    throw new Error(
      [
        `Importacao bloqueada: ${divergent.length} bloco(s) com validacao DIVERGENTE.`,
        `Divergencias explicadas por texto corrigido: ${explained.length}.`,
        `Divergencias nao explicadas: ${unexplained.length}.`,
        "A importacao real so e liberada sem --force quando todas as divergencias forem explicadas por celulas textuais corrigidas e --include-corrected-text-values estiver presente."
      ].join("\n")
    );
  }

  const imported = await upsertEntries(importEntries);
  console.log("");
  console.log(`Importacao concluida. Registros importados/atualizados: ${imported}`);
}

main().catch((error) => {
  console.error("");
  console.error(`Erro: ${error.message}`);
  process.exit(1);
});
