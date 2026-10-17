import { runCheck } from "@/lib/check";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Body must be JSON." },
      { status: 400 },
    );
  }
  if (!body || typeof body !== "object")
    return Response.json(
      { ok: false, error: "Body must be an object." },
      { status: 400 },
    );
  const b = body as { line?: unknown; offer?: unknown };
  const result = await runCheck({
    line: typeof b.line === "string" ? b.line.slice(0, 500) : undefined,
    offer: b.offer,
  });
  return Response.json(result, { status: result.ok ? 200 : 422 });
}
