import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** null when Supabase is not configured: callers fall back to polling the API. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;

/** Subscribe to changes on `cases` (optionally one case). Returns an unsubscribe function. */
export function watchCases(onChange: () => void, caseId?: string): () => void {
  if (!supabase) return () => {};
  const ch = supabase
    .channel("cases-" + (caseId ?? "all") + Math.random().toString(36).slice(2))
    .on("postgres_changes", { event: "*", schema: "public", table: "cases", ...(caseId ? { filter: `id=eq.${caseId}` } : {}) }, onChange)
    .subscribe();
  return () => void supabase.removeChannel(ch);
}
