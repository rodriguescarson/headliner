/**
 * Thin, typed, traced client for the Qloo API.
 * - GET only (Qloo rejects JSON bodies on these routes).
 * - The key never leaves the server.
 * - Every call is recorded in a trace so the UI and the MCP view can show exactly what was asked.
 * - Parameter names follow docs.qloo.com; the ones marked UNVERIFIED are confirmed by scripts/verify-qloo.ts.
 */
import { type CacheStore, cacheKey, defaultCache } from "./cache";

export type QlooParams = Record<
  string,
  string | number | boolean | string[] | undefined
>;

export type TraceEntry = {
  id: number;
  path: string;
  params: Record<string, string>;
  status: number;
  ms: number;
  cached: boolean;
  ok: boolean;
  error?: string;
  resultCount?: number;
  /** Times this call was retried after HTTP 429. */
  retries?: number;
};

export type QlooResult<T = unknown> =
  | { ok: true; data: T; trace: TraceEntry }
  | { ok: false; trace: TraceEntry };

export const ENTITY = {
  artist: "urn:entity:artist",
  brand: "urn:entity:brand",
  place: "urn:entity:place",
  movie: "urn:entity:movie",
  tvShow: "urn:entity:tv_show",
  podcast: "urn:entity:podcast",
  heatmap: "urn:heatmap",
  demographics: "urn:demographics",
  tag: "urn:tag",
} as const;

/**
 * Qloo's hackathon tier allows 5 requests per second per key (x-second-ratelimit-* headers, measured
 * 2026-10-19). One pacer per process spaces request starts so a check's parallel calls never trip it, and a
 * 429 is retried after the one-second reset instead of being reported as missing evidence.
 */
const MIN_GAP_MS = 250;
const MAX_RETRIES = 3;
const pacer = globalThis as typeof globalThis & { __qlooNextSlot?: number };
async function takeSlot(): Promise<void> {
  const now = Date.now();
  const slot = Math.max(now, pacer.__qlooNextSlot ?? 0);
  pacer.__qlooNextSlot = slot + MIN_GAP_MS;
  if (slot > now) await new Promise((r) => setTimeout(r, slot - now));
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class QlooClient {
  readonly trace: TraceEntry[] = [];
  private seq = 0;
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = process.env.QLOO_BASE_URL ??
      "https://hackathon.api.qloo.com",
    private readonly cache: CacheStore = defaultCache(),
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    assertAllowedBaseUrl(baseUrl, fetchImpl !== fetch);
  }

  static fromEnv(): QlooClient | null {
    const key = process.env.QLOO_API_KEY;
    if (!key) return null;
    return new QlooClient(key);
  }

  private normalise(params: QlooParams): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined) continue;
      out[k] = Array.isArray(v) ? v.join(",") : String(v);
    }
    return out;
  }

  async get<T = unknown>(
    pathname: string,
    params: QlooParams = {},
  ): Promise<QlooResult<T>> {
    const p = this.normalise(params);
    const key = cacheKey(pathname, p);
    const started = performance.now();
    const entry: TraceEntry = {
      id: ++this.seq,
      path: pathname,
      params: p,
      status: 0,
      ms: 0,
      cached: false,
      ok: false,
    };
    this.trace.push(entry);

    const hit = (await this.cache.get(key)) as T | undefined;
    if (hit !== undefined) {
      entry.cached = true;
      entry.status = 200;
      entry.ok = true;
      entry.ms = Math.round(performance.now() - started);
      entry.resultCount = countResults(hit);
      return { ok: true, data: hit, trace: entry };
    }

    const url = `${this.baseUrl}${pathname}?${new URLSearchParams(p).toString()}`;
    try {
      let res: Response;
      let attempt = 0;
      for (;;) {
        // Injected fetches (tests) skip the pacer; the real API is paced.
        if (this.fetchImpl === fetch) await takeSlot();
        res = await this.fetchImpl(url, {
          headers: { "X-Api-Key": this.apiKey, Accept: "application/json" },
        });
        if (res.status !== 429 || attempt >= MAX_RETRIES) break;
        attempt += 1;
        const reset = Number(res.headers.get("x-second-ratelimit-reset"));
        await res.text().catch(() => "");
        await sleep(
          (Number.isFinite(reset) && reset > 0 ? reset * 1000 : 1000) +
            Math.floor(Math.random() * 200),
        );
      }
      if (attempt) entry.retries = attempt;
      entry.status = res.status;
      entry.ms = Math.round(performance.now() - started);
      const text = await res.text();
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        entry.error = `Non-JSON response: ${text.slice(0, 120)}`;
        return { ok: false, trace: entry };
      }
      if (!res.ok) {
        entry.error = summariseError(json) ?? `HTTP ${res.status}`;
        return { ok: false, trace: entry };
      }
      entry.ok = true;
      entry.resultCount = countResults(json);
      await this.cache.set(key, json);
      return { ok: true, data: json as T, trace: entry };
    } catch (e) {
      entry.ms = Math.round(performance.now() - started);
      entry.error = e instanceof Error ? e.message : String(e);
      return { ok: false, trace: entry };
    }
  }

  // ---- Lookup -------------------------------------------------------------

  /** /search resolves a name to entity ids. `types` uses the search endpoint's own vocabulary (e.g. "urn:entity:artist"). */
  search(query: string, types?: string[], take = 5) {
    return this.get("/search", { query, types, take });
  }

  /** /v2/tags resolves taste words (genres, cuisines) to tag ids. */
  tags(query: string, types?: string[], take = 10) {
    return this.get("/v2/tags", {
      "filter.query": query,
      "filter.tag.types": types,
      take,
    });
  }

  // ---- Insights -----------------------------------------------------------

  insights(params: QlooParams) {
    return this.get("/v2/insights", params);
  }

  /**
   * Geographic affinity within a city, one cell per geohash. Verified 2026-10-19: each cell's `affinity` is
   * rescaled within the response (its mean is 0.500 in every city), so it cannot compare cities;
   * `affinity_rank` varies by city and is the field Headliner reads.
   */
  heatmap(
    entityIds: string[],
    locationQuery: string,
    boundary: "urn:geohash" | "urn:entity:locality" = "urn:geohash",
  ) {
    return this.insights({
      "filter.type": ENTITY.heatmap,
      "signal.interests.entities": entityIds,
      "filter.location.query": locationQuery,
      "output.heatmap.boundary": boundary,
    });
  }

  demographics(entityIds: string[], locationQuery?: string) {
    return this.insights({
      "filter.type": ENTITY.demographics,
      "signal.interests.entities": entityIds,
      "signal.location.query": locationQuery,
    });
  }

  /** Artists with affinity to the headliner, local to the city, less popular than `popularityMax` (percentile 0..1). */
  openers(
    entityIds: string[],
    locationQuery: string,
    popularityMax: number,
    take = 10,
    type: string = ENTITY.artist,
  ) {
    return this.insights({
      "filter.type": type,
      "signal.interests.entities": entityIds,
      "signal.location.query": locationQuery,
      "filter.popularity.max": popularityMax,
      "filter.exclude.entities": entityIds,
      "feature.explainability": true,
      take,
    });
  }

  brands(entityIds: string[], locationQuery?: string, take = 10) {
    return this.insights({
      "filter.type": ENTITY.brand,
      "signal.interests.entities": entityIds,
      "signal.location.query": locationQuery,
      "feature.explainability": true,
      take,
    });
  }

  places(entityIds: string[], locationQuery: string, take = 10) {
    return this.insights({
      "filter.type": ENTITY.place,
      "signal.interests.entities": entityIds,
      "filter.location.query": locationQuery,
      "feature.explainability": true,
      take,
    });
  }

  /** Taste tags describing an entity set (taste analysis). */
  /** Taste tags for an entity, restricted to tags that describe that kind of entity (artist or person). */
  tasteTags(
    entityIds: string[],
    parentType: string = ENTITY.artist,
    take = 20,
  ) {
    return this.insights({
      "filter.type": ENTITY.tag,
      "signal.interests.entities": entityIds,
      "filter.parents.types": parentType,
      take,
    });
  }

  // ---- Analysis -----------------------------------------------------------

  compare(
    aEntityIds: string[],
    bEntityIds: string[],
    filterType: string = ENTITY.tag,
    take = 20,
  ) {
    return this.get("/v2/analysis/compare", {
      "a.signal.interests.entities": aEntityIds,
      "b.signal.interests.entities": bEntityIds,
      "filter.type": filterType,
      take,
    });
  }

  /** Time-series popularity. Path and params UNVERIFIED on the hackathon tier. */
  /** Trending needs a date window (verified 2026-10-19). Probe-only: it is not part of the verdict. */
  trending(entityId: string, type: string = ENTITY.artist, days = 30) {
    const end = new Date();
    const start = new Date(end.getTime() - days * 86_400_000);
    const day = (d: Date) => d.toISOString().slice(0, 10);
    return this.get("/v2/trending", {
      "signal.interests.entities": entityId,
      "filter.type": type,
      "filter.start_date": day(start),
      "filter.end_date": day(end),
    });
  }
}

/** The client only ever talks to Qloo over HTTPS. A misconfigured base URL must fail loudly, not leak the key elsewhere (OWASP A10). */
function assertAllowedBaseUrl(baseUrl: string, testMode: boolean) {
  const u = new URL(baseUrl);
  if (testMode) return;
  if (
    u.protocol !== "https:" ||
    !(u.hostname === "qloo.com" || u.hostname.endsWith(".qloo.com"))
  ) {
    throw new Error(
      `QLOO_BASE_URL must be an https qloo.com host, got ${baseUrl}`,
    );
  }
}

function countResults(json: unknown): number | undefined {
  if (!json || typeof json !== "object") return undefined;
  const r = (json as { results?: unknown }).results;
  if (Array.isArray(r)) return r.length;
  if (r && typeof r === "object") {
    for (const v of Object.values(r as Record<string, unknown>))
      if (Array.isArray(v)) return v.length;
  }
  return undefined;
}

function summariseError(json: unknown): string | undefined {
  if (!json || typeof json !== "object") return undefined;
  const j = json as Record<string, unknown>;
  const m = j.message ?? j.error ?? (j.errors as unknown[] | undefined)?.[0];
  return typeof m === "string"
    ? m
    : m
      ? JSON.stringify(m).slice(0, 200)
      : undefined;
}
