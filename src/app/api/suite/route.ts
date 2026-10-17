import { runSuite } from "@/lib/qloo/suite";
import { guardJson, log } from "@/lib/security/guard";

export async function POST(request: Request) {
  const guard = await guardJson(request, {
    scope: "suite",
    limit: 5,
    windowMs: 60_000,
  });
  if (!guard.ok) return guard.response;
  const body = guard.body as { act?: unknown; city?: unknown };
  const act =
    typeof body.act === "string" && body.act.trim()
      ? body.act.trim().slice(0, 80)
      : undefined;
  const city =
    typeof body.city === "string" && body.city.trim()
      ? body.city.trim().slice(0, 80)
      : undefined;
  try {
    return Response.json(await runSuite(act, city));
  } catch (e) {
    log("error", "suite_failed", {
      message: e instanceof Error ? e.message : "unknown",
    });
    return Response.json(
      { ok: false, error: "The suite could not be completed." },
      { status: 500 },
    );
  }
}
