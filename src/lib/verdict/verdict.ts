/**
 * The decision layer. Order of authority:
 *   1. Deterministic deal math (rulebook) can refuse on its own.
 *   2. Missing evidence makes the product abstain rather than guess.
 *   3. Evidence can require a fix (opener, sponsor, market) before clearing.
 * The model never participates here.
 */
import {
  computeDeal,
  type DealInput,
  type DealMath,
  money,
  pct,
  withSponsorOffset,
} from "@/lib/deal/deal-math";
import type { Offer } from "@/lib/deal/offer-parser";
import type { Candidate, CulturalEvidence } from "@/lib/qloo/evidence";
import { RULES_VERSION, rules } from "@/lib/rules";

export type VerdictStatus =
  | "cleared"
  | "fix_required"
  | "refused"
  | "abstained";

export type Fix =
  | { kind: "opener"; title: string; detail: string; candidates: Candidate[] }
  | {
      kind: "sponsor";
      title: string;
      detail: string;
      candidates: Candidate[];
      assumption: { low: number; high: number; label: string };
      dealAtLow: DealMath;
      dealAtHigh: DealMath;
    }
  | { kind: "market"; title: string; detail: string };

export type Verdict = {
  status: VerdictStatus;
  headline: string;
  reasons: string[];
  deal: DealMath;
  evidence: CulturalEvidence;
  abstentions: { code: string; message: string }[];
  fixes: Fix[];
  cannotEstablish: string[];
  rulesVersion: string;
  generatedAt: string;
};

export function toDealInput(offer: Offer): DealInput {
  return {
    capacity: offer.capacity,
    ticketPrice: offer.ticketPrice,
    guarantee: offer.guarantee,
    venueCost: offer.venueCost,
    productionCost: offer.productionCost,
    marketingBudget: offer.marketingBudget,
  };
}

export function decide(offer: Offer, evidence: CulturalEvidence): Verdict {
  const input = toDealInput(offer);
  const deal = computeDeal(input);
  const reasons: string[] = [];
  const abstentions: Verdict["abstentions"] = [];
  const fixes: Fix[] = [];
  const base = {
    deal,
    evidence,
    cannotEstablish: rules.cannotEstablish,
    rulesVersion: RULES_VERSION,
    generatedAt: new Date().toISOString(),
  };

  // 1. Money first.
  if (deal.level === "refuse") {
    for (const v of deal.violations) reasons.push(v.detail);
    return {
      ...base,
      status: "refused",
      headline: `Refused as written: ${deal.violations[0]?.code.replaceAll("_", " ").toLowerCase()}.`,
      reasons,
      abstentions,
      fixes,
    };
  }
  reasons.push(
    `Break-even is ${deal.breakEvenTickets} of ${deal.inputs.capacity} tickets (${pct(deal.breakEvenCapacityPct)}) at ${money(deal.netPerTicket, true)} net per ticket.`,
  );

  // 2. Evidence coverage. No entity or no local signal means we do not pretend to know the market.
  if (evidence.source === "none") {
    abstentions.push({
      code: "NO_EVIDENCE_SOURCE",
      message:
        "No Qloo key and no sample act matched, so there is no cultural evidence to check.",
    });
  }
  for (const flag of evidence.coverage) {
    if (
      !flag.ok &&
      (flag.code === "ENTITY_UNRESOLVED" || flag.code === "HEATMAP_SPARSE")
    ) {
      abstentions.push({ code: flag.code, message: flag.detail });
    }
  }
  if (abstentions.length > 0) {
    return {
      ...base,
      status: "abstained",
      headline:
        "Abstained: the deal math holds, but cultural signal cannot be established for this act in this city.",
      reasons,
      abstentions,
      fixes,
    };
  }

  // 3. Fixes. Sponsor offset is an assumption from the rulebook, labelled as such; never a quote.
  const affinity = evidence.localAffinity;
  const weakMarket = affinity?.label === "low";
  const tightMoney = deal.level === "warn";
  if (affinity)
    reasons.push(
      `Local affinity in ${offer.city}: mean ${affinity.mean}, max ${affinity.max} across ${affinity.cells} cells (${affinity.label}).`,
    );

  if (weakMarket && evidence.openers.length > 0) {
    fixes.push({
      kind: "opener",
      title: "Change the bill",
      detail: `Local affinity is ${affinity?.label}. These local acts share audience with the headliner; a local opener is the cheapest way to bring the room.`,
      candidates: evidence.openers.slice(0, 5),
    });
  }
  if (tightMoney && evidence.sponsors.length > 0) {
    const a = rules.assumptions.sponsorActivationUsd;
    fixes.push({
      kind: "sponsor",
      title: "Offset the guarantee",
      detail: `Break-even sits at ${pct(deal.breakEvenCapacityPct)}. A local brand activation would lower it; the amounts below are the rulebook's illustrative range, not a quote.`,
      candidates: evidence.sponsors.slice(0, 5),
      assumption: a,
      dealAtLow: withSponsorOffset(input, a.low),
      dealAtHigh: withSponsorOffset(input, a.high),
    });
  }
  if (weakMarket) {
    fixes.push({
      kind: "market",
      title: "Consider another routing city",
      detail:
        "Run the same offer against a nearby city and compare the two. (City comparison lands with the live key.)",
    });
  }

  if (fixes.length > 0) {
    return {
      ...base,
      status: "fix_required",
      headline: weakMarket
        ? `Not cleared: ${offer.city} shows ${affinity?.label} affinity for this act. Fix the bill or the market before the hold confirms.`
        : `Not cleared: break-even at ${pct(deal.breakEvenCapacityPct)} is above the ${pct(rules.money.warnAboveBreakEvenPct)} comfort line.`,
      reasons,
      abstentions,
      fixes,
    };
  }

  return {
    ...base,
    status: "cleared",
    headline: `Cleared: ${pct(deal.breakEvenCapacityPct)} to break even and ${affinity?.label ?? "unknown"} local affinity.`,
    reasons,
    abstentions,
    fixes,
  };
}
