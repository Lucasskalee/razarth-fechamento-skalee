import { getSupabaseClient, TABLES } from "../config/supabase.js";

export function subscribeRealtime(onChange) {
  try {
    const client = getSupabaseClient();
    const channel = client
      .channel("gestao-perdas-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: TABLES.notes }, onChange)
      .on("postgres_changes", { event: "*", schema: "public", table: TABLES.items }, onChange)
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
