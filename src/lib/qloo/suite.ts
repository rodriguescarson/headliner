/**
 * The live endpoint suite: runs every Qloo endpoint Headliner depends on, once, against one well-known act,
 * and returns status, latency and result counts. Built for the judge who wants to see the API fire.
 */
import { ENTITY, QlooClient, type TraceEntry } from "./client";

export type SuiteResult = {
  mode: "live" | "sample";
  baseUrl: string;
  act: string;
  city: string;
  startedAt: string;
  steps: { name: string; trace: TraceEntry | null; note?: string }[];
};

export async function runSuite(
  act = "Khruangbin",
  city = "Austin, TX",
): Promise<SuiteResult> {
  const client = QlooClient.fromEnv();
  const base: SuiteResult = {
    mode: client ? "live" : "sample",
    baseUrl: process.env.QLOO_BASE_URL ?? "https://hackathon.api.qloo.com",
    act,
    city,
    startedAt: new Date().toISOString(),
    steps: [],
  };
  if (!client) {
    base.steps.push({
      name: "all",
      trace: null,
      note: "No Qloo key configured; nothing was called.",
    });
    return base;
  }
  const search = await client.search(act, [ENTITY.artist, "urn:entity:person"]);
  base.steps.push({ name: "GET /search", trace: search.trace });
  const first = search.ok
    ? ((search.data as { results?: { entity_id?: string; id?: string }[] })
        .results?.[0] ?? null)
    : null;
  const id = first?.entity_id ?? first?.id;
  if (!id) {
    base.steps.push({
      name: "remaining",
      trace: null,
      note: `"${act}" did not resolve; the remaining endpoints were not called.`,
    });
    return base;
  }
  const steps: [string, Promise<{ trace: TraceEntry }>][] = [
    ["GET /v2/tags", client.tags("indie")],
    ["GET /v2/insights urn:heatmap", client.heatmap([id], city)],
    ["GET /v2/insights urn:demographics", client.demographics([id], city)],
    [
      "GET /v2/insights urn:entity:artist (openers)",
      client.openers([id], city, 0.9),
    ],
    ["GET /v2/insights urn:entity:brand", client.brands([id], city)],
    ["GET /v2/insights urn:entity:place", client.places([id], city)],
    ["GET /v2/insights urn:tag (taste analysis)", client.tasteTags([id])],
    ["GET /v2/analysis/compare", client.compare([id], [id])],
    ["GET /v2/trending (UNVERIFIED path)", client.trending(id)],
  ];
  const results = await Promise.all(steps.map(([, p]) => p));
  for (const [i, r] of results.entries())
    base.steps.push({ name: steps[i][0], trace: r.trace });
  return base;
}
