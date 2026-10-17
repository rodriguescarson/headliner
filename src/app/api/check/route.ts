import { runCheck } from "@/lib/check";
import { guardJson, log } from "@/lib/security/guard";

export async function POST(request: Request) {
  const guard = await guardJson(request, {
    scope: "check",
    limit: 30,
    windowMs: 60_000,
  });
  if (!guard.ok) return guard.response;
  const b = guard.body as {
    line?: unknown;
    offer?: unknown;
    baseline?: unknown;
  };
  if (b.baseline === true) {
    const extra = await guardJson(
      new Request(request.url, { headers: request.headers }),
      { scope: "baseline", limit: 10, windowMs: 60_000 },
    );
    if (!extra.ok) return extra.response;
  }
  try {
    const result = await runCheck({
      line: typeof b.line === "string" ? b.line.slice(0, 500) : undefined,
      offer: b.offer,
      baseline: b.baseline === true,
    });
    return Response.json(result, { status: result.ok ? 200 : 422 });
  } catch (e) {
    log("error", "check_failed", {
      message: e instanceof Error ? e.message : "unknown",
    });
    return Response.json(
      { ok: false, error: "The check could not be completed." },
      { status: 500 },
    );
  }
}
