const SUPABASE_URL = "https://khevuaohphrwhjasmbsy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_dof_x7F6Xt7zzLB-N0uf9Q_hm4STzvR";

// O banco oficial do sistema e o Supabase.
export const PRIMARY_DATA_SOURCE = "supabase";

export const TABLES = {
  notes: "loss_notes",
  items: "loss_items"
};

let client;

export function getSupabaseClient() {
  if (client) return client;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !window.supabase?.createClient) {
    const error = new Error("Configuracao do Supabase ausente.");
    error.userMessage = "O Supabase nao esta configurado. O banco e a fonte oficial do sistema.";
    throw error;
  }

  client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false }
  });

  return client;
}

export function getPrimaryDataSourceLabel() {
  return PRIMARY_DATA_SOURCE;
}
