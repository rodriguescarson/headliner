/**
 * Day-one probe. Run the moment the hackathon key arrives:
 *   QLOO_API_KEY=... pnpm tsx scripts/verify-qloo.ts
 * It exercises every endpoint Headliner relies on against real acts and real cities, records the raw
 * response shapes to .cache/probe-<timestamp>.json (git-ignored) and prints a pass/fail table.
 * The numbers from this run, including the failures, go into the Devpost write-up. Nothing is hand-picked.
 */
import { writeFile } from "node:fs/promises";
import { ENTITY, QlooClient } from "../src/lib/qloo/client";
import { gatherEvidence } from "../src/lib/qloo/evidence";

const ACTS = [
  // mid-tier and large touring acts across genres; a mix so coverage gaps show up honestly
  "Cedric the Entertainer",
  "Japanese Breakfast",
  "Khruangbin",
  "Nate Bargatze",
  "Hannah Berner",
  "Turnstile",
  "Men I Trust",
  "Shane Gillis",
  "Leon Bridges",
  "Mannequin Pussy",
  "Sampha",
  "Jessie Reyez",
  "Bad Bunny",
  "Phoebe Bridgers",
  "Jinjer",
  // intentionally obscure or unindexed acts to test the abstention path
  "The Tuesday Night Basement Trio",
  "DJ Kettle Corn",
  "Ruhi & The Monsoon Choir",
  "Open Mic Finalist 2026",
  "Goan Garage Collective",
];
const CITIES = [
  "Austin, TX",
  "Chicago, IL",
  "Atlanta, GA",
  "Denver, CO",
  "Los Angeles, CA",
];

async function main() {
  const client = QlooClient.fromEnv();
  if (!client) throw new Error("QLOO_API_KEY is not set.");
  const report: Record<string, unknown> = {
    startedAt: new Date().toISOString(),
    baseUrl: process.env.QLOO_BASE_URL,
    acts: {},
  };

  // 1. Raw endpoint shapes on one well-known act, so the zod schemas can be hardened against reality.
  const probe = await client.search(ACTS[0], [
    ENTITY.artist,
    "urn:entity:person",
  ]);
  const first = probe.ok
    ? ((probe.data as { results?: { entity_id?: string; id?: string }[] })
        .results?.[0] ?? null)
    : null;
  const id = first?.entity_id ?? first?.id;
  report.rawShapes = {
    search: probe.ok ? probe.data : probe.trace,
    heatmap: id ? await client.heatmap([id], CITIES[0]) : "search failed",
    demographics: id
      ? await client.demographics([id], CITIES[0])
      : "search failed",
    openers: id ? await client.openers([id], CITIES[0], 0.9) : "search failed",
    brands: id ? await client.brands([id], CITIES[0]) : "search failed",
    places: id ? await client.places([id], CITIES[0]) : "search failed",
    tasteTags: id ? await client.tasteTags([id]) : "search failed",
    compare: id
      ? await client.compare([id], [id], ENTITY.tag)
      : "search failed",
    trending: id ? await client.trending(id) : "search failed",
  };

  // 2. Full evidence pass for every act in its first city, with the coverage flags Headliner would show.
  const rows: string[] = [];
  for (const [i, act] of ACTS.entries()) {
    const city = CITIES[i % CITIES.length];
    const ev = await gatherEvidence(
      new QlooClient(process.env.QLOO_API_KEY as string),
      {
        artist: act,
        city,
        capacity: 300,
        ticketPrice: 30,
        guarantee: 2500,
        venueCost: 0,
        productionCost: 0,
        marketingBudget: 0,
      },
    );
    (report.acts as Record<string, unknown>)[act] = {
      city,
      entity: ev.entity,
      localAffinity: ev.localAffinity,
      coverage: ev.coverage,
      openers: ev.openers.length,
      sponsors: ev.sponsors.length,
      places: ev.places.length,
      tags: ev.tasteTags.length,
      trace: ev.trace,
    };
    const gaps = ev.coverage.filter((c) => !c.ok).map((c) => c.code);
    rows.push(
      `${act.padEnd(34)} ${city.padEnd(16)} ${ev.entity ? "resolved " : "UNRESOLVED"} ${gaps.length ? `gaps: ${gaps.join(",")}` : "full coverage"}`,
    );
  }

  const out = `.cache/probe-${Date.now()}.json`;
  await writeFile(out, JSON.stringify(report, null, 2));
  console.log(rows.join("\n"));
  console.log(`\nRaw shapes and traces written to ${out} (git-ignored).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
