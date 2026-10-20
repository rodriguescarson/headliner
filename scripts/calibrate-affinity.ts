/**
 * Calibrates the rulebook's affinity cut-offs against the real API instead of picking them by hand.
 *   pnpm calibrate
 * Every real act in the probe list is resolved (exact name only), then its heatmap is read in every probe city.
 * For each act-city pair the score is the mean affinity_rank across map cells, the same number a check shows.
 * Prints the distribution and its tertiles; writes the raw pairs to .cache/calibration-<ts>.json (git-ignored).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { ENTITY, QlooClient } from "../src/lib/qloo/client";
import { pickExactEntity } from "../src/lib/qloo/evidence";

const ACTS = [
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
];
const CITIES = [
  "Austin, TX",
  "Chicago, IL",
  "Atlanta, GA",
  "Denver, CO",
  "Los Angeles, CA",
];

type Row = {
  act: string;
  city: string;
  cells: number;
  meanRank: number | null;
};

const q = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))];
};
const r3 = (n: number) => Math.round(n * 1000) / 1000;

async function main() {
  const client = QlooClient.fromEnv();
  if (!client) throw new Error("QLOO_API_KEY is not set.");
  const rows: Row[] = [];
  for (const act of ACTS) {
    const s = await client.search(act, [ENTITY.artist, "urn:entity:person"], 5);
    const results = s.ok
      ? ((s.data as { results?: { name: string; entity_id?: string }[] })
          .results ?? [])
      : [];
    const e = pickExactEntity(act, results);
    if (!e?.entity_id) {
      console.log(`${act}: no exact entity, skipped`);
      continue;
    }
    for (const city of CITIES) {
      const h = await client.heatmap([e.entity_id], city);
      const cells = h.ok
        ? ((
            h.data as {
              results?: { heatmap?: { query?: { affinity_rank?: number } }[] };
            }
          ).results?.heatmap ?? [])
        : [];
      const ranks = cells
        .map((c) => c.query?.affinity_rank)
        .filter((x): x is number => typeof x === "number");
      rows.push({
        act,
        city,
        cells: ranks.length,
        meanRank: ranks.length
          ? r3(ranks.reduce((a, b) => a + b, 0) / ranks.length)
          : null,
      });
    }
  }
  const scores = rows
    .map((r) => r.meanRank)
    .filter((x): x is number => x !== null);
  const summary = {
    pairs: rows.length,
    scored: scores.length,
    min: r3(Math.min(...scores)),
    p33: r3(q(scores, 1 / 3)),
    median: r3(q(scores, 0.5)),
    p67: r3(q(scores, 2 / 3)),
    max: r3(Math.max(...scores)),
    minCells: Math.min(...rows.map((r) => r.cells)),
    failed: rows.filter((r) => r.meanRank === null).length,
    calls: client.trace.length,
    retries: client.trace.reduce((a, t) => a + (t.retries ?? 0), 0),
  };
  console.table(rows);
  console.log(summary);
  await mkdir(".cache", { recursive: true });
  const out = `.cache/calibration-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  await writeFile(out, JSON.stringify({ summary, rows }, null, 2));
  console.log(`Written to ${out} (git-ignored).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
