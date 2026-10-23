/**
 * Key-day report: runs every pre-seeded offer through the same check the desk uses and prints the numbers the
 * Devpost write-up quotes. Live mode when QLOO_API_KEY is set, sample mode otherwise (and it says so).
 *   pnpm offers            # verdicts only
 *   pnpm offers --baseline # also the Without-Qloo control (needs AI_GATEWAY_API_KEY)
 * Output: a table on stdout and .cache/offers-<timestamp>.json (git-ignored). Nothing is hand-picked: every
 * offer in src/lib/offers.ts runs, failures included.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { runCheck } from "../src/lib/check";
import { VERDICT_STATUS } from "../src/lib/enums";
import { LIVE_OFFERS } from "../src/lib/offers";
import { SAMPLE_OFFERS } from "../src/lib/qloo/sample";

const withBaseline = process.argv.includes("--baseline");

function mean(xs: number[]): number | null {
  return xs.length
    ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length)
    : null;
}

async function main() {
  const live = Boolean(process.env.QLOO_API_KEY);
  const offers = live ? LIVE_OFFERS : SAMPLE_OFFERS;
  const rows: Record<string, unknown>[] = [];
  const openerOverlap: number[] = [];
  const sponsorOverlap: number[] = [];
  let affinityAgree = 0;
  let affinityCompared = 0;

  for (const o of offers) {
    const r = await runCheck({ line: o.line, baseline: withBaseline });
    if (!r.ok) {
      rows.push({ label: o.label, error: r.error, missing: r.missing });
      continue;
    }
    const v = r.verdict;
    const b = r.baseline?.overlap;
    if (b) {
      if (b.openers.pct !== null) openerOverlap.push(b.openers.pct);
      if (b.sponsors.pct !== null) sponsorOverlap.push(b.sponsors.pct);
      if (b.affinityAgrees !== null) {
        affinityCompared += 1;
        if (b.affinityAgrees) affinityAgree += 1;
      }
    }
    rows.push({
      label: o.label,
      act: r.offer.artist,
      city: r.offer.city,
      status: v.status,
      breakEvenPct: Number.isFinite(v.deal.breakEvenCapacityPct)
        ? Math.round(v.deal.breakEvenCapacityPct * 1000) / 10
        : null,
      affinity: v.evidence.localAffinity?.label ?? null,
      cells: v.evidence.localAffinity?.cells ?? 0,
      resolved: Boolean(v.evidence.entity),
      fixes: v.fixes.map((f) => f.kind),
      qlooCalls: v.evidence.trace.length,
      baselineOpenersPct: b?.openers.pct ?? null,
      baselineSponsorsPct: b?.sponsors.pct ?? null,
      baselineAffinity: r.baseline?.guess?.localAffinity ?? null,
      baselineOpeners: r.baseline?.guess?.openers ?? [],
      baselineSponsors: r.baseline?.guess?.sponsors ?? [],
      qlooOpeners: v.evidence.openers.slice(0, 5).map((o) => o.name),
      qlooSponsors: v.evidence.sponsors.slice(0, 5).map((o) => o.name),
      baselineNote: r.baseline?.note ?? null,
    });
  }

  const ok = rows.filter((r) => r.status);
  const count = Object.fromEntries(
    VERDICT_STATUS.map((s) => [s, ok.filter((r) => r.status === s).length]),
  );
  const summary = {
    mode: live ? "live" : "sample",
    offers: offers.length,
    errors: rows.length - ok.length,
    ...count,
    failAsWritten: (count.fix_required ?? 0) + (count.refused ?? 0),
    qlooCalls: ok.reduce((a, r) => a + (r.qlooCalls as number), 0),
    baseline: withBaseline
      ? {
          meanOpenerOverlapPct: mean(openerOverlap),
          meanSponsorOverlapPct: mean(sponsorOverlap),
          affinityAgreement: `${affinityAgree} of ${affinityCompared}`,
        }
      : "not run",
  };

  console.log(
    `Mode: ${summary.mode}${live ? "" : " (no QLOO_API_KEY; these are sample numbers, not for the write-up)"}`,
  );
  console.table(
    rows.map((r) => ({
      act: r.act ?? r.label,
      city: r.city ?? "",
      status: r.status ?? `ERROR ${r.error}`,
      "break-even %": r.breakEvenPct ?? "",
      affinity: r.affinity ?? "",
      cells: r.cells ?? "",
      fixes: Array.isArray(r.fixes) ? r.fixes.join(",") : "",
    })),
  );
  console.log(
    `${summary.failAsWritten} of ${summary.offers} offers fail as written; ${count.abstained} abstain; ${count.cleared} clear.`,
  );
  if (withBaseline) console.log("Without Qloo:", summary.baseline);

  await mkdir(".cache", { recursive: true });
  const out = `.cache/offers-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  await writeFile(out, JSON.stringify({ summary, rows }, null, 2));
  console.log(`Written to ${out} (git-ignored).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
