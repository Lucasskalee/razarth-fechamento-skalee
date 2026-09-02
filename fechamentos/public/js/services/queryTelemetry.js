const enabled = () => Boolean(import.meta.env?.DEV)
  || (typeof location !== "undefined" && location.hostname === "localhost");

export async function observeQuery(label, queryPromise) {
  const startedAt = performance.now();
  const result = await queryPromise;
  if (enabled()) {
    const rows = Array.isArray(result?.data) ? result.data.length : 0;
    console.debug("[Supabase]", label, {
      durationMs: Math.round(performance.now() - startedAt),
      rows
    });
  }
  return result;
}
