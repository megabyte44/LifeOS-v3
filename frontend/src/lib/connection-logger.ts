/**
 * Connection Logger
 *
 * Polls GET /health on startup and every 30 seconds.
 * Logs styled connection status to the browser console whenever state changes:
 *
 *   ✅ Backend CONNECTED  |  DB CONNECTED   @ 10:30:45
 *   ❌ Backend CONNECTED  |  DB DISCONNECTED @ 10:31:15
 *   ❌ Backend DISCONNECTED                  @ 10:31:45
 */

const POLL_INTERVAL_MS = 30_000; // 30 seconds
const HEALTH_ENDPOINT = '/api/health';

type ConnectionState = 'unknown' | 'up' | 'down';

interface HealthResponse {
  status: string;
  db: string;
  timestamp: string;
}

// Track previous state to only log on change
let prevBackend: ConnectionState = 'unknown';
let prevDb:      ConnectionState = 'unknown';

// ─── Styling ─────────────────────────────────────────────────────────────────

const S = {
  badge:    'font-weight:bold; padding:2px 6px; border-radius:4px; font-size:11px;',
  backendOk:   'background:#16a34a; color:#fff;',
  backendDown: 'background:#dc2626; color:#fff;',
  dbOk:        'background:#2563eb; color:#fff;',
  dbDown:      'background:#ea580c; color:#fff;',
  dim:         'color:#6b7280; font-size:11px;',
};

function ts(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

function logStatus(backend: ConnectionState, db: ConnectionState) {
  if (backend === 'up' && db === 'up') {
    console.log(
      `%c LifeOS %c ✅ Backend CONNECTED %c ✅ DB CONNECTED %c @ ${ts()}`,
      'font-weight:bold; color:#8a7ff2;',
      `${S.badge}${S.backendOk}`,
      `${S.badge}${S.dbOk}`,
      S.dim,
    );
  } else if (backend === 'up' && db === 'down') {
    console.warn(
      `%c LifeOS %c ✅ Backend CONNECTED %c ❌ DB DISCONNECTED %c @ ${ts()}`,
      'font-weight:bold; color:#8a7ff2;',
      `${S.badge}${S.backendOk}`,
      `${S.badge}${S.dbDown}`,
      S.dim,
    );
  } else {
    console.error(
      `%c LifeOS %c ❌ Backend DISCONNECTED %c @ ${ts()} — check if the server is running`,
      'font-weight:bold; color:#8a7ff2;',
      `${S.badge}${S.backendDown}`,
      S.dim,
    );
  }
}

// ─── Polling ─────────────────────────────────────────────────────────────────

async function check() {
  let backend: ConnectionState;
  let db: ConnectionState;

  try {
    const res = await fetch(HEALTH_ENDPOINT, {
      method: 'GET',
      signal: AbortSignal.timeout(5_000),
      cache: 'no-store',
    });

    if (res.ok) {
      const data: HealthResponse = await res.json();
      backend = 'up';
      db = data.db?.toUpperCase() === 'UP' ? 'up' : 'down';
    } else {
      backend = 'down';
      db = 'down';
    }
  } catch {
    backend = 'down';
    db = 'down';
  }

  // Only log when something changed
  if (backend !== prevBackend || db !== prevDb) {
    logStatus(backend, db);
    prevBackend = backend;
    prevDb = db;
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

let started = false;

export function startConnectionLogger() {
  if (typeof window === 'undefined') return; // SSR guard
  if (started) return;
  started = true;

  // Immediate first check
  check();

  // Then poll every 30 s
  setInterval(check, POLL_INTERVAL_MS);

  // Re-check instantly when the tab regains focus (catches wake-from-sleep)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
}
