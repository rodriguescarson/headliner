import { parseOfferLine } from "@/lib/deal/offer-parser";
import { jobStore } from "@/lib/jobs/store";
import { ScenarioSchema } from "@/lib/scenario";
import { guardJson } from "@/lib/security/guard";

/** Enqueue a check. Validation happens here so a bad line fails fast instead of occupying the queue. */
export async function POST(request: Request) {
  const guard = await guardJson(request, {
    scope: "check",
    limit: 30,
    windowMs: 60_000,
  });
  if (!guard.ok) return guard.response;
  const b = guard.body as {
    line?: unknown;
    baseline?: unknown;
    scenario?: unknown;
  };
  const line = typeof b.line === "string" ? b.line.slice(0, 500) : "";
  const parsed = parseOfferLine(line);
  if (!parsed.ok)
    return Response.json(
      {
        ok: false,
        error: "Could not read the offer line.",
        missing: parsed.missing,
      },
      { status: 422 },
    );
  if (b.baseline === true) {
    const extra = await guardJson(
      new Request(request.url, { headers: request.headers }),
      { scope: "baseline", limit: 10, windowMs: 60_000 },
    );
    if (!extra.ok) return extra.response;
  }
  let scenario: ReturnType<typeof ScenarioSchema.parse> | undefined;
  if (b.scenario !== undefined) {
    const sc = ScenarioSchema.safeParse(b.scenario);
    if (!sc.success)
      return Response.json(
        { ok: false, error: "Scenario invalid." },
        { status: 422 },
      );
    scenario = sc.data;
  }
  const job = await jobStore().enqueue({
    line,
    baseline: b.baseline === true,
    scenario,
  });
  return Response.json(
    { ok: true, id: job.id, status: job.status },
    { status: 202 },
  );
}
