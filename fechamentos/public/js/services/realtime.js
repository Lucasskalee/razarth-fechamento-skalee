import { getSupabaseClient, TABLES } from "../config/supabase.js";
import { invalidateNfItemsCache } from "./notas.js";

export function getRealtimeImpact(payload) {
  const row = payload?.new || payload?.old || {};
  const noteKey = row.note_key || null;
  const date = row.emission_date ? new Date(row.emission_date) : null;
  return {
    table: payload?.table || "",
    event: payload?.event || "",
    noteKey,
    store: row.store || null,
    year: date && !Number.isNaN(date.getTime()) ? date.getUTCFullYear() : null,
    month: date && !Number.isNaN(date.getTime()) ? date.getUTCMonth() + 1 : null,
    caches: [
      ...(noteKey ? [`note-items:${noteKey}`, `note:${noteKey}`] : []),
      ...(row.store && date && !Number.isNaN(date.getTime())
        ? [`dashboard:${row.store}:${date.getUTCFullYear()}:${date.getUTCMonth() + 1}`]
        : ["dashboard:summary"])
    ]
  };
}

export function subscribeRealtime(onChange) {
  try {
    const client = getSupabaseClient();
    const channel = client
      .channel("gestao-perdas-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: TABLES.notes }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: TABLES.items }, (payload) => {
        const row = payload.new || payload.old;
        invalidateNfItemsCache(row?.note_key || null);
        onChange(payload);
      })
      .subscribe();

    return async () => {
      await client.removeChannel(channel);
    };
  } catch (error) {
    const wrapped = new Error("Nao foi possivel ativar o realtime do Supabase.");
    wrapped.userMessage = "Nao foi possivel ativar o realtime do Supabase.";
    wrapped.cause = error;
    throw wrapped;
  }
}
