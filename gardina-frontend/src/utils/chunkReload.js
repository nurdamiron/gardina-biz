// After a deploy the hashed chunk filenames change. A tab still running the
// previous index.html then fails to import an old lazy chunk (it's gone from
// the server and from the service-worker precache) with errors like
// "Failed to fetch dynamically imported module" or a "MIME type text/html"
// module error (the SPA rewrite serves index.html for the missing .js).
//
// The fix is to reload once: the fresh index.html references the new chunk
// names, so everything lines up again. We guard against reload loops so a
// genuinely broken deploy surfaces the error instead of reloading forever.

const RELOAD_KEY = 'gardina:chunk-reload-at';
const RELOAD_WINDOW_MS = 15000;

export function isChunkLoadError(error) {
  const msg = String(error?.message || error || '');
  return (
    /failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /importing a module script failed/i.test(msg) ||
    /loading chunk \d+ failed/i.test(msg) ||
    (/mime type/i.test(msg) && /module/i.test(msg))
  );
}

// Reloads the page once within RELOAD_WINDOW_MS. Returns true if it triggered a
// reload, false if it was suppressed (already reloaded recently — let the error
// show so we don't loop on a broken build).
export function reloadOnceForChunkError() {
  if (typeof window === 'undefined') return false;
  let last = 0;
  try { last = parseInt(sessionStorage.getItem(RELOAD_KEY) || '0', 10); } catch { /* noop */ }
  const now = Date.now();
  if (now - last < RELOAD_WINDOW_MS) return false;
  try { sessionStorage.setItem(RELOAD_KEY, String(now)); } catch { /* noop */ }
  window.location.reload();
  return true;
}
