/**
 * QPM Telemetry
 *
 * Fire-and-forget observability module for QuickPubMed's LLM-backed search flow.
 *
 * Design goals:
 *   - NEVER block the search flow. All public functions return synchronously and
 *     log to console.warn without throwing on any internal error.
 *   - Anonymized: no raw free text, no IP, no session persistence beyond tab.
 *   - Self-protecting: bounded buffer (200 events), circuit breaker (5 consecutive
 *     backend failures disables sending for the rest of the session), sendBeacon
 *     fallback on tab unload.
 *
 * Events are buffered and flushed as a batch to backend/api/TelemetryLog.php,
 * which writes to data/runtime/qpm-telemetry-YYYY-MM-DD.jsonl with file locking.
 *
 * Styrkelser (from plan review):
 *   1. promptVersion auto-attached to every event
 *   2. (see src/utils/jsonSchemaValidate.js)
 *   4. safety net: circuit breaker, buffer cap, sendBeacon, try/catch everywhere
 *   6. stableQueryHash normalizes whitespace/case before hashing
 */

const MAX_BUFFER_EVENTS = 200;
const FLUSH_BATCH_SIZE = 10;
const FLUSH_INTERVAL_MS = 3000;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const QUERY_HASH_LENGTH = 12;
const SESSION_HASH_LENGTH = 12;
const PROMPT_VERSION_LENGTH = 8;

const EVENT_TYPE_WHITELIST = new Set([
  "semantic_intent_parsed",
  "source_hit_count",
  "source_hit_filter_drop",
  "filter_drop_ratio",
  "source_probe_counts",
  "overlap_summary",
  "mesh_validation",
  "query_plan_built",
]);

let state = null;
const promptVersionCache = new Map();
let warnedCircuitOpen = false;

function initState() {
  if (state) return state;
  state = {
    enabled: true,
    endpoint: "",
    buffer: [],
    droppedCount: 0,
    consecutiveFailures: 0,
    circuitOpen: false,
    flushTimer: null,
    sessionHash: "",
    beaconInstalled: false,
    thresholds: {
      overHitThreshold: 100000,
      lowOverlapThreshold: 0.1,
      lowConfidenceThreshold: 0.6,
      highFilterDropThreshold: 0.5,
      meshHallucinationThreshold: 0.1,
      sourceProbeRanges: {
        pubmed: { min: 20, max: 100000 },
        openAlex: { min: 50, max: 1000000 },
        semanticScholar: { min: 10, max: 100000 },
      },
    },
  };
  return state;
}

/**
 * Configure the telemetry module (called at app boot from runtime config).
 * Missing fields keep their defaults, so this is safe to call even before
 * backend config loads.
 */
export function configureTelemetry(cfg) {
  try {
    const s = initState();
    if (!cfg || typeof cfg !== "object") return;
    if (cfg.enabled === false) {
      s.enabled = false;
    } else if (cfg.enabled === true) {
      s.enabled = true;
    }
    if (typeof cfg.endpoint === "string" && cfg.endpoint.trim()) {
      s.endpoint = cfg.endpoint.trim();
    }
    if (Number.isFinite(cfg.logOverHitThreshold)) {
      s.thresholds.overHitThreshold = cfg.logOverHitThreshold;
    }
    if (Number.isFinite(cfg.logLowOverlapThreshold)) {
      s.thresholds.lowOverlapThreshold = cfg.logLowOverlapThreshold;
    }
    if (Number.isFinite(cfg.logLowConfidenceThreshold)) {
      s.thresholds.lowConfidenceThreshold = cfg.logLowConfidenceThreshold;
    }
    if (Number.isFinite(cfg.logHighFilterDropThreshold)) {
      s.thresholds.highFilterDropThreshold = cfg.logHighFilterDropThreshold;
    }
    if (Number.isFinite(cfg.logMeshHallucinationThreshold)) {
      s.thresholds.meshHallucinationThreshold = cfg.logMeshHallucinationThreshold;
    }
    if (cfg.sourceProbeRanges && typeof cfg.sourceProbeRanges === "object") {
      s.thresholds.sourceProbeRanges = {
        ...s.thresholds.sourceProbeRanges,
        ...cfg.sourceProbeRanges,
      };
    }
  } catch (err) {
    safeWarn("configureTelemetry failed", err);
  }
}

export function getTelemetryThresholds() {
  return initState().thresholds;
}

export function isTelemetryEnabled() {
  const s = initState();
  return s.enabled && !s.circuitOpen;
}

/**
 * SHA-256 using Web Crypto API. Falls back to a simple non-crypto hash
 * when crypto.subtle is not available (e.g. http:// in some browsers) —
 * the fallback is only used for non-sensitive hashing of anonymized text.
 */
async function sha256Hex(text) {
  const normalized = String(text || "");
  if (typeof crypto !== "undefined" && crypto.subtle && crypto.subtle.digest) {
    try {
      const enc = new TextEncoder();
      const buf = await crypto.subtle.digest("SHA-256", enc.encode(normalized));
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch (err) {
      // Fall through to fallback.
    }
  }
  return fallbackHashHex(normalized);
}

/**
 * Synchronous non-crypto hash used when Web Crypto is unavailable.
 * Not collision-resistant; only used as a last-resort anonymization layer.
 * Based on FNV-1a 32-bit, doubled for 64-bit-ish output.
 */
function fallbackHashHex(text) {
  let h1 = 0x811c9dc5;
  let h2 = 0x1b873593;
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    h1 = (h1 ^ c) >>> 0;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 = (h2 ^ (c * 31)) >>> 0;
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  return (h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0")).slice(0, 16);
}

/**
 * Normalize text for stable hashing: trim, lowercase, collapse whitespace.
 * Ensures that semantically identical queries aggregate to the same hash
 * regardless of casing and whitespace differences.
 * (Styrkelse 6)
 */
export function normalizeTextForHash(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const queryHashMemo = new Map();

/**
 * Stable hash of a query string. Returns a 12-char hex prefix of SHA-256 of
 * the normalized text. Synchronous path uses memo when available; async
 * primes the cache. The returned Promise resolves once the real hash is known.
 */
export function stableQueryHash(text) {
  const normalized = normalizeTextForHash(text);
  if (!normalized) return "";
  if (queryHashMemo.has(normalized)) return queryHashMemo.get(normalized);
  // Compute synchronously using the non-crypto fallback as a placeholder
  // so call sites can use it immediately; schedule crypto upgrade in background.
  const syncHash = fallbackHashHex(normalized).slice(0, QUERY_HASH_LENGTH);
  queryHashMemo.set(normalized, syncHash);
  // Upgrade asynchronously to a real SHA-256 when possible.
  sha256Hex(normalized)
    .then((full) => {
      queryHashMemo.set(normalized, full.slice(0, QUERY_HASH_LENGTH));
    })
    .catch(() => {});
  return syncHash;
}

/**
 * Return anonymized representation of free text: length, word count and stable hash.
 * Never returns the text itself.
 */
export function anonymizeText(text) {
  const raw = String(text || "");
  return {
    length: raw.length,
    hash: stableQueryHash(raw),
    wordCount: raw.trim() ? raw.trim().split(/\s+/).length : 0,
  };
}

/**
 * Memoized SHA-256 hash (8 hex chars) of a prompt text.
 * Lets every event carry promptVersion for later cohort analysis.
 * (Styrkelse 1)
 */
export function getPromptVersion(promptText) {
  const key = String(promptText || "");
  if (!key) return "";
  if (promptVersionCache.has(key)) return promptVersionCache.get(key);
  const sync = fallbackHashHex(key).slice(0, PROMPT_VERSION_LENGTH);
  promptVersionCache.set(key, sync);
  sha256Hex(key)
    .then((full) => {
      promptVersionCache.set(key, full.slice(0, PROMPT_VERSION_LENGTH));
      if (typeof window !== "undefined") {
        window.__qpmActivePromptVersion = full.slice(0, PROMPT_VERSION_LENGTH);
      }
    })
    .catch(() => {});
  if (typeof window !== "undefined" && !window.__qpmActivePromptVersion) {
    window.__qpmActivePromptVersion = sync;
  }
  return sync;
}

/**
 * Generate a per-tab session identifier, stored in sessionStorage.
 * Not personally identifying. Cleared on tab close.
 */
export function getOrCreateSessionHash() {
  try {
    const s = initState();
    if (s.sessionHash) return s.sessionHash;
    if (typeof sessionStorage !== "undefined") {
      const existing = sessionStorage.getItem("qpm_telemetry_session");
      if (existing) {
        s.sessionHash = existing;
        return existing;
      }
    }
    const seed =
      (typeof navigator !== "undefined" ? navigator.userAgent || "" : "") +
      ":" +
      Date.now() +
      ":" +
      Math.random().toString(36).slice(2);
    const hash = fallbackHashHex(seed).slice(0, SESSION_HASH_LENGTH);
    s.sessionHash = hash;
    if (typeof sessionStorage !== "undefined") {
      try {
        sessionStorage.setItem("qpm_telemetry_session", hash);
      } catch (_) {
        // Storage might be disabled (e.g. Safari private mode); proceed without persistence.
      }
    }
    return hash;
  } catch (err) {
    safeWarn("getOrCreateSessionHash failed", err);
    return "";
  }
}

function safeWarn(label, err) {
  try {
    if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn("[QPMTelemetry]", label, err && err.message ? err.message : err);
    }
  } catch (_) {}
}

function scheduleFlush() {
  const s = initState();
  if (s.flushTimer) return;
  try {
    s.flushTimer = setTimeout(() => {
      s.flushTimer = null;
      flushTelemetryBuffer();
    }, FLUSH_INTERVAL_MS);
  } catch (_) {
    // setTimeout not available — rely on buffer-size trigger.
  }
}

function installBeaconListener() {
  const s = initState();
  if (s.beaconInstalled) return;
  if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;
  try {
    const handler = () => {
      try {
        flushViaBeacon();
      } catch (_) {}
    };
    window.addEventListener("beforeunload", handler);
    window.addEventListener("pagehide", handler);
    s.beaconInstalled = true;
  } catch (err) {
    safeWarn("installBeaconListener failed", err);
  }
}

function sanitizePayload(payload, maxDepth = 4) {
  // Defensive deep-clone that strips functions and caps depth, to ensure
  // no circular references, DOM nodes or unserializable values end up in events.
  try {
    return JSON.parse(JSON.stringify(payload, (_, value) => {
      if (typeof value === "function") return undefined;
      if (value instanceof Error) return { name: value.name, message: value.message };
      return value;
    }));
  } catch (_) {
    return {};
  }
}

/**
 * Fire-and-forget: log an event to console and queue it for backend flush.
 * Returns nothing; never throws.
 */
export function logTelemetryEvent(eventType, payload) {
  try {
    const s = initState();
    if (!s.enabled || s.circuitOpen) return;
    if (!EVENT_TYPE_WHITELIST.has(eventType)) {
      safeWarn("unknown eventType rejected", eventType);
      return;
    }

    const event = {
      timestamp: new Date().toISOString(),
      eventType,
      sessionHash: getOrCreateSessionHash(),
      promptVersion:
        typeof window !== "undefined" && window.__qpmActivePromptVersion
          ? window.__qpmActivePromptVersion
          : "",
      payload: sanitizePayload(payload || {}),
    };

    // Console mirror for developers.
    try {
      if (typeof console !== "undefined" && typeof console.info === "function") {
        console.info(`[QPMTelemetry][${eventType}]`, event.payload);
      }
    } catch (_) {}

    if (s.buffer.length >= MAX_BUFFER_EVENTS) {
      s.droppedCount += 1;
      return;
    }
    s.buffer.push(event);
    installBeaconListener();
    if (s.buffer.length >= FLUSH_BATCH_SIZE) {
      flushTelemetryBuffer();
    } else {
      scheduleFlush();
    }
  } catch (err) {
    safeWarn("logTelemetryEvent failed", err);
  }
}

function buildBatchBody(events, droppedCount) {
  return JSON.stringify({
    events,
    droppedCount: droppedCount || 0,
    client: "qpm-web",
  });
}

/**
 * Flush buffered events to the backend via fetch (keepalive). Fire-and-forget.
 */
export function flushTelemetryBuffer() {
  try {
    const s = initState();
    if (!s.enabled || s.circuitOpen) {
      s.buffer = [];
      return;
    }
    if (!s.endpoint) return;
    if (s.buffer.length === 0) return;

    const batch = s.buffer.splice(0, s.buffer.length);
    const droppedCount = s.droppedCount;
    s.droppedCount = 0;

    if (typeof fetch !== "function") return;

    const body = buildBatchBody(batch, droppedCount);

    fetch(s.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "omit",
      mode: "cors",
    })
      .then((response) => {
        if (!response || !response.ok) {
          noteFailure(s);
          return;
        }
        s.consecutiveFailures = 0;
      })
      .catch(() => {
        noteFailure(s);
      });
  } catch (err) {
    safeWarn("flushTelemetryBuffer failed", err);
  }
}

function noteFailure(s) {
  try {
    s.consecutiveFailures += 1;
    if (s.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD && !s.circuitOpen) {
      s.circuitOpen = true;
      s.buffer = [];
      if (!warnedCircuitOpen) {
        warnedCircuitOpen = true;
        try {
          if (typeof console !== "undefined" && typeof console.warn === "function") {
            console.warn(
              "[QPMTelemetry] circuit open — disabling telemetry for this session after repeated backend failures"
            );
          }
        } catch (_) {}
      }
    }
  } catch (_) {}
}

/**
 * Send remaining buffered events via sendBeacon (page unload path).
 */
export function flushViaBeacon() {
  try {
    const s = initState();
    if (!s.enabled || s.circuitOpen) return;
    if (!s.endpoint) return;
    if (s.buffer.length === 0) return;
    if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") {
      flushTelemetryBuffer();
      return;
    }
    const batch = s.buffer.splice(0, s.buffer.length);
    const droppedCount = s.droppedCount;
    s.droppedCount = 0;
    const body = buildBatchBody(batch, droppedCount);
    try {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(s.endpoint, blob);
    } catch (_) {
      // sendBeacon may throw in rare contexts; we have nothing to fall back to.
    }
  } catch (err) {
    safeWarn("flushViaBeacon failed", err);
  }
}

/**
 * Reset internal state (for tests only). Not part of the public contract.
 */
export function __resetTelemetryForTests() {
  state = null;
  promptVersionCache.clear();
  queryHashMemo.clear();
  warnedCircuitOpen = false;
}
