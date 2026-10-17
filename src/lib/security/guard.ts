/**
 * Shared request guard for the JSON APIs: same-origin check, body size cap, rate limit, structured logging.
 * The app has no accounts, so there is nothing to authorise; the guard bounds what an anonymous caller can spend.
 */
import { clientKey, rateLimit } from "./rate-limit";

const MAX_BODY_BYTES = 4096;

export type GuardOptions = { scope: string; limit: number; windowMs: number };

export async function guardJson(
  request: Request,
  opts: GuardOptions,
): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = null;
    }
    if (originHost !== host) {
      log("warn", "cross_origin_rejected", { scope: opts.scope });
      return {
        ok: false,
        response: Response.json(
          { ok: false, error: "Cross-origin requests are not accepted." },
          { status: 403 },
        ),
      };
    }
  }

  const rl = rateLimit(
    clientKey(request, opts.scope),
    opts.limit,
    opts.windowMs,
  );
  if (!rl.allowed) {
    log("warn", "rate_limited", {
      scope: opts.scope,
      resetInSeconds: rl.resetInSeconds,
    });
    return {
      ok: false,
      response: Response.json(
        {
          ok: false,
          error: `Too many requests. Try again in ${rl.resetInSeconds}s.`,
        },
        { status: 429, headers: { "Retry-After": String(rl.resetInSeconds) } },
      ),
    };
  }

  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_BODY_BYTES) {
    return {
      ok: false,
      response: Response.json(
        { ok: false, error: "Body too large." },
        { status: 413 },
      ),
    };
  }
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    return {
      ok: false,
      response: Response.json(
        { ok: false, error: "Body too large." },
        { status: 413 },
      ),
    };
  }
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    return {
      ok: false,
      response: Response.json(
        { ok: false, error: "Body must be JSON." },
        { status: 400 },
      ),
    };
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      ok: false,
      response: Response.json(
        { ok: false, error: "Body must be an object." },
        { status: 400 },
      ),
    };
  }
  return { ok: true, body };
}

/** Structured, PII-free security log line. */
export function log(
  level: "info" | "warn" | "error",
  event: string,
  fields: Record<string, string | number | boolean> = {},
) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
