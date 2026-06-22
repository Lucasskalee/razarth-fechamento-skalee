/**
 * services/notas.js
 * Camada de integração com dados reais de NF.
 *
 * Fluxo:
 *   searchNf(numero, allNotes) →
 *     1. Procura em memória (state.notes já carregado)
 *     2. Consulta Supabase direto (nota pode estar fora do filtro ativo)
 *
 * O parser atual guarda o emitente em `store`; para a tela de NF isso é o
 * fornecedor real que queremos exibir. Quando o schema ganhar `dest_name`,
 * este mapeamento pode ser refinado sem mudar a UI.
 */

import { getSupabaseClient, TABLES } from "../config/supabase.js";

// Mapa de inferência de código de loja a partir do nome completo
const STORE_PATTERNS = [
  { re: /\bCD\b/i, code: "CD" },
  { re: /SOL[\s-_]*7/i, code: "SOL7" },
  { re: /SOL[\s-_]*4/i, code: "SOL4" },
  { re: /SOL[\s-_]*3/i, code: "SOL3" },
  { re: /SOL[\s-_]*2/i, code: "SOL2" },
  { re: /SOL[\s-_]*1/i, code: "SOL1" }
];

function inferStoreCode(storeName) {
  const text = String(storeName || "").toUpperCase();
  const match = STORE_PATTERNS.find((entry) => entry.re.test(text));
  return match?.code || "SOL1";
}

function normalizeInvoice(value) {
  return String(value || "").replace(/\D/g, "");
}

function invoiceCandidates(value) {
  const normalized = normalizeInvoice(value);
  if (!normalized) return [];
  const trimmed = normalized.replace(/^0+/, "");
  const padded5 = normalized.padStart(5, "0");
  const padded6 = normalized.padStart(6, "0");
  return [...new Set([normalized, trimmed, padded5, padded6].filter(Boolean))];
}

/**
 * Normaliza uma linha do banco (loss_notes) para o contrato de nota.
 *
 * Campo "fornecedor": usa dest_name quando disponível (migration futura).
 * Por enquanto usa operation (natOp) que descreve o tipo de saída.
 *
 * @param {object} row
 * @returns {NotaReal}
 */
function mapRowToNota(row) {
  const store = row.store || "Nao identificada";
  return {
    // Identificação
    numeroNF: normalizeInvoice(row.invoice),
    chaveNfe: row.access_key || "",
    noteKey: row.note_key || "",
    // Fornecedor: o emitente salvo em store; dest_name fica preparado para o futuro
    fornecedor: row.store || row.dest_name || row.operation || row.type || "Operacao nao identificada",
    destNome: row.dest_name || null,
    operacao: row.operation || "",     // natOp
    // Localização
    loja: inferStoreCode(store),
    lojaOriginal: store,
    setor: row.sector || "Nao classificado",
    // Financeiro
    valor: Number(row.total_value || 0),
    totalItens: Number(row.item_count || 0),
    // Temporal
    data: row.emission_date || null,
    emissao: row.emission_date || null,
    competencia: row.competence_month || "",
    // Tipo
    tipo: row.type || "",
    displayType: row.display_type || row.type || "",
    itens: []
  };
}

/**
 * Converte nota do formato state.notes (mapeado via mapRowToNote)
 * para o contrato NotaReal.
 */
function stateNoteToNota(n) {
  return mapRowToNota({
    invoice: n.invoice,
    access_key: n.accessKey || "",
    note_key: n.key || n.noteKey || "",
    dest_name: n.destName || null,
    operation: n.operation || "",
    store: n.store,
    sector: n.sector,
    total_value: n.totalValue,
    emission_date: n.date,
    competence_month: n.competenceMonth,
    type: n.type,
    display_type: n.displayType || "",
    item_count: n.itemCount
  });
}

/**
 * Busca NF pelo número.
 *
 * @param {string} numero - Número da NF (só dígitos)
 * @param {Array}  allNotes - state.notes (já carregados em memória)
 * @returns {Promise<NotaReal[]|null>} - array de resultados ou null se não encontrado
 */
export async function searchNf(numero, allNotes = []) {
  const candidates = invoiceCandidates(numero);
  if (!candidates.length) return null;

  // 1. Busca em memória — nota já está no dashboard atual
  const inMemory = allNotes.filter((n) => candidates.includes(normalizeInvoice(n.invoice)) || candidates.includes(normalizeInvoice(n.accessKey)));
  if (inMemory.length) {
    return inMemory.map(stateNoteToNota);
  }

  // 2. Consulta Supabase direta — nota pode estar fora do filtro ativo
  try {
    const client = getSupabaseClient();
    const { data: exactMatch, error: exactError } = await client
      .from(TABLES.notes)
      .select(
        "note_key, access_key, invoice, store, emission_date, competence_month, " +
        "operation, type, display_type, sector, total_value, item_count"
      )
      .order("emission_date", { ascending: false })
      .in("invoice", candidates)
      .limit(20);

    if (exactError) {
      const wrapped = new Error(`Falha ao buscar NF ${candidates[0]} no banco.`);
      wrapped.userMessage = exactError.message || wrapped.message;
      throw wrapped;
    }

    let data = exactMatch || [];

    if (!data.length) {
      const accessCandidates = candidates.slice(0, 2);
      const { data: accessMatch, error: accessError } = await client
        .from(TABLES.notes)
        .select(
          "note_key, access_key, invoice, store, emission_date, competence_month, " +
          "operation, type, display_type, sector, total_value, item_count"
        )
        .or(accessCandidates.map((candidate) => `access_key.eq.${candidate}`).join(","))
        .order("emission_date", { ascending: false })
        .limit(20);

      if (accessError) {
        const wrapped = new Error(`Falha ao buscar NF ${candidates[0]} no banco.`);
        wrapped.userMessage = accessError.message || wrapped.message;
        throw wrapped;
      }

      data = accessMatch || [];
    }

    if (!data.length) return null;

    const notas = data.map(mapRowToNota);
    const noteKeys = [...new Set(notas.map((nota) => nota.noteKey).filter(Boolean))];
    if (noteKeys.length) {
      const { data: itemRows } = await client
        .from(TABLES.items)
        .select("note_key, product, quantity, unit_value, value, reason, sector")
        .in("note_key", noteKeys)
        .order("item_index", { ascending: true });
      const itemsByNote = new Map();
      (itemRows || []).forEach((item) => {
        const key = item.note_key;
        if (!itemsByNote.has(key)) itemsByNote.set(key, []);
        itemsByNote.get(key).push({
          produto: item.product || "Produto",
          quantidade: Number(item.quantity || 0),
          valorUnitario: Number(item.unit_value || 0),
          valor: Number(item.value || 0),
          setor: item.sector || "",
          motivo: item.reason || ""
        });
      });
      notas.forEach((nota) => {
        nota.itens = itemsByNote.get(nota.noteKey) || [];
        nota.totalItens = nota.itens.length || nota.totalItens;
      });
    }

    return notas;
  } catch (error) {
    if (!error.userMessage) error.userMessage = `Erro ao consultar NF ${invoice}.`;
    throw error;
  }
}

/**
 * Carrega os itens detalhados de uma nota pelo noteKey.
 *
 * @param {string} noteKey
 * @returns {Promise<ItemNota[]>}
 */
export async function loadNfItems(noteKey) {
  if (!noteKey) return [];
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(TABLES.items)
      .select("product, quantity, unit_value, value, reason, sector")
      .eq("note_key", noteKey)
      .order("item_index", { ascending: true });

    if (error) throw error;
    return (data || []).map((row) => ({
      produto: row.product || "Produto",
      quantidade: Number(row.quantity || 0),
      valorUnitario: Number(row.unit_value || 0),
      valor: Number(row.value || 0),
      setor: row.sector || "",
      motivo: row.reason || ""
    }));
  } catch (error) {
    console.error("[notas] Falha ao carregar itens:", error);
    return [];
  }
}
