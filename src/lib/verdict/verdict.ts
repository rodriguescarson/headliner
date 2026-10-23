/**
 * The decision layer. Order of authority:
 *   1. Deterministic deal math (rulebook) can refuse on its own.
 *   2. Missing evidence makes the product abstain rather than guess.
 *   3. Evidence can require a fix (opener, sponsor, market) before clearing.
 * The model never participates here.
 */
import {
  computeDeal,
  counterGuarantee,
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
  | {
      kind: "counter";
      title: string;
      detail: string;
      guarantee: number;
      offered: number;
      dealAtCounter: DealMath;
    }
  | {
      kind: "opener";
      title: string;
      detail: string;
      candidates: Candidate[];
      sharedTags?: string[];
    }
  | {
      kind: "sponsor";
      title: string;
      detail: string;
      candidates: Candidate[];
      assumption: { low: number; high: number; label: string };
      dealAtLow: DealMath;
      dealAtHigh: DealMath;
    }
  | {
      kind: "market";
      title: string;
      detail: string;
      altCity?: string;
      altAffinity?: CulturalEvidence["localAffinity"];
      sharedTags?: string[];
    };

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
    sponsorOffset: offer.sponsorOffset,
  };
}

/** The counter-offer, when one exists: arithmetic on the promoter's numbers, never a claim about what the act accepts. */
function counterFix(input: DealInput): Fix | null {
  const c = counterGuarantee(input);
  if (!c) return null;
  return {
    kind: "counter",
    title: "Counter the guarantee",
    detail: `At ${money(c.guarantee)} instead of ${money(input.guarantee)}, break-even drops to ${c.deal.breakEvenTickets} tickets (${pct(c.deal.breakEvenCapacityPct)}), inside the rulebook's ${pct(rules.money.warnAboveBreakEvenPct)} line. Whether the act takes it is a negotiation, not a number this check can know.`,
    guarantee: c.guarantee,
    offered: input.guarantee,
    dealAtCounter: c.deal,
  };
}

/**
 * Swap the market, but only toward a nearby metro that reads better on the same measure. Recommending a weaker
 * room would be worse than saying nothing.
 */
function marketFix(
  evidence: CulturalEvidence,
  affinity: CulturalEvidence["localAffinity"],
): Fix | null {
  const alt = evidence.altMarket;
  const altAff = alt?.localAffinity;
  if (!alt || !altAff || !affinity || altAff.mean <= affinity.mean) return null;
  return {
    kind: "market",
    title: "Swap the market",
    detail: `${alt.city} reads ${altAff.label} (mean affinity rank ${altAff.mean} across ${altAff.cells} cells) against ${affinity.mean} here. Same money, different room.`,
    altCity: alt.city,
    altAffinity: altAff,
    sharedTags: alt.sharedTags,
  };
}

/** Why no market swap is offered, stated as a reason so the promoter sees the comparison was made. */
function noBetterMarket(evidence: CulturalEvidence): string {
  const alt = evidence.altMarket;
  const here = evidence.localAffinity?.mean;
  if (!alt)
    return "No routing alternative is configured for this city, so no market swap was compared.";
  if (!alt.localAffinity)
    return `${alt.city} was checked but its heatmap is too sparse or unavailable; no claim is made about it.`;
  return `${alt.city} reads no better (mean affinity rank ${alt.localAffinity.mean} against ${here} here), so a market swap is not offered.`;
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
    const counter = counterFix(input);
    if (counter) fixes.push(counter);
    if (evidence.localAffinity?.label === "low") {
      const m = marketFix(evidence, evidence.localAffinity);
      if (m) fixes.push(m);
      else reasons.push(noBetterMarket(evidence));
    }
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
      (flag.code === "ENTITY_UNRESOLVED" ||
        flag.code === "HEATMAP_SPARSE" ||
        flag.code === "HEATMAP_FAILED")
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
      `Local affinity in ${offer.city}: mean affinity rank ${affinity.mean} (best cell ${affinity.max}) across ${affinity.cells} map cells, which the rulebook reads as ${affinity.label}.`,
    );

  if (weakMarket && evidence.openers.length > 0) {
    fixes.push({
      kind: "opener",
      title: "Change the bill",
      detail: `Local affinity is ${affinity?.label}. These local acts share audience with the headliner; a local opener is the cheapest way to bring the room.`,
      candidates: evidence.openers.slice(0, 5),
      sharedTags: evidence.openerSharedTags,
    });
  }
  if (tightMoney) {
    const counter = counterFix(input);
    if (counter) fixes.push(counter);
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
    const m = marketFix(evidence, affinity);
    if (m) fixes.push(m);
    else reasons.push(noBetterMarket(evidence));
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
