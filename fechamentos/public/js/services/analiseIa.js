import { getSupabaseClient } from "../config/supabase.js";

export async function requestClosingAnalysis(payload) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getSession();
  if (error || !data?.session?.access_token) {
    const authError = new Error("Sua sessao expirou. Entre novamente para usar a IA.");
    authError.userMessage = authError.message;
    throw authError;
  }

  const response = await fetch("/api/analisar-fechamento", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const requestError = new Error(body.error || "Nao foi possivel gerar a analise por IA.");
    requestError.userMessage = requestError.message;
    throw requestError;
  }

  return body;
}

export async function requestClosingChat(payload, question, history = []) {
  return requestClosingAnalysis({ ...payload, question, history });
}
