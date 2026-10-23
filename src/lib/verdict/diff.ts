/**
 * What changed between two verdicts, and why. Pure, deterministic, and phrased from the numbers; it never claims
 * a scenario will sell more tickets, only what the arithmetic and the evidence did.
 */
import { money, pct } from "@/lib/deal/deal-math";
import type { Verdict } from "./verdict";

export type VerdictDiff = {
  status: { from: Verdict["status"]; to: Verdict["status"]; changed: boolean };
  breakEven: {
    from: number;
    to: number;
    deltaTickets: number;
    fromPct: number;
    toPct: number;
  };
  affinity: { from: string | null; to: string | null; changed: boolean };
  fixes: { from: string[]; to: string[] };
  lines: string[];
};

const affinityText = (v: Verdict) =>
  v.evidence.localAffinity
    ? `${v.evidence.localAffinity.label}, mean affinity rank ${v.evidence.localAffinity.mean}`
    : null;

export function diffVerdicts(base: Verdict, next: Verdict): VerdictDiff {
  const lines: string[] = [];
  const be = {
    from: base.deal.breakEvenTickets,
    to: next.deal.breakEvenTickets,
    deltaTickets: next.deal.breakEvenTickets - base.deal.breakEvenTickets,
    fromPct: base.deal.breakEvenCapacityPct,
    toPct: next.deal.breakEvenCapacityPct,
  };
  if (be.deltaTickets !== 0) {
    lines.push(
      `Break-even moves from ${be.from} to ${be.to} tickets (${pct(be.fromPct)} → ${pct(be.toPct)} of capacity) because fixed costs change from ${money(base.deal.totalFixedCost)} to ${money(next.deal.totalFixedCost)}.`,
    );
  } else {
    lines.push(
      `Break-even is unchanged at ${be.to} tickets (${pct(be.toPct)}): this scenario does not touch the money.`,
    );
  }

  const a = affinityText(base);
  const b = affinityText(next);
  const aff = { from: a, to: b, changed: a !== b };
  if (aff.changed) {
    const cityFrom =
      base.evidence.altMarket && next.evidence.localAffinity ? "" : "";
    lines.push(
      `Local affinity reads ${b ?? "no signal"} instead of ${a ?? "no signal"}${cityFrom}; this is cultural evidence for the new bill or market, not a sales figure.`,
    );
  } else if (
    next.evidence.coverage.some((c) => c.code === "BILL_OPENER_UNRESOLVED")
  ) {
    lines.push(
      "The market read is unchanged: the opener could not be evaluated as part of the bill.",
    );
  } else {
    lines.push(`Local affinity is unchanged: ${b ?? "no signal"}.`);
  }

  const fixes = {
    from: base.fixes.map((f) => f.kind),
    to: next.fixes.map((f) => f.kind),
  };
  const removed = fixes.from.filter((k) => !fixes.to.includes(k));
  const added = fixes.to.filter((k) => !fixes.from.includes(k));
  if (removed.length)
    lines.push(
      `No longer needed: ${removed.join(", ")} fix${removed.length > 1 ? "es" : ""}.`,
    );
  if (added.length)
    lines.push(
      `Now needed: ${added.join(", ")} fix${added.length > 1 ? "es" : ""}.`,
    );

  const status = {
    from: base.status,
    to: next.status,
    changed: base.status !== next.status,
  };
  lines.push(
    status.changed
      ? `Verdict changes from ${base.status.replace("_", " ")} to ${next.status.replace("_", " ")}.`
      : `Verdict stays ${next.status.replace("_", " ")}.`,
  );
  const stillCannot = next.cannotEstablish.length;
  if (stillCannot)
    lines.push(
      `${stillCannot} things still cannot be established either way (listed under Outside this check).`,
    );
  return { status, breakEven: be, affinity: aff, fixes, lines };
}
