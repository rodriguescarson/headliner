import { describe, expect, it } from "vitest";
import { parseOfferLine } from "@/lib/deal/offer-parser";
import { LIVE_OFFERS } from "@/lib/offers";
import { SAMPLE_OFFERS, sampleEvidence } from "@/lib/qloo/sample";
import { rules } from "@/lib/rules";
import { decide } from "./verdict";

const run = (line: string) => {
  const p = parseOfferLine(line);
  if (!p.ok) throw new Error(`fixture does not parse: ${p.missing.join(",")}`);
  return decide(p.offer, sampleEvidence(p.offer));
};

describe("decide (sample evidence)", () => {
  it("clears a healthy deal in a strong market", () => {
    const v = run(SAMPLE_OFFERS[0].line);
    expect(v.status).toBe("cleared");
    expect(v.fixes).toEqual([]);
  });

  it("requires a sponsor fix when money is tight and labels the amount as an assumption", () => {
    const v = run(SAMPLE_OFFERS[1].line);
    expect(v.status).toBe("fix_required");
    const sponsor = v.fixes.find((f) => f.kind === "sponsor");
    expect(sponsor).toBeDefined();
    if (sponsor?.kind !== "sponsor") return;
    expect(sponsor.assumption.label).toMatch(/not a quote/i);
    expect(sponsor.dealAtHigh.breakEvenTickets).toBeLessThan(
      v.deal.breakEvenTickets,
    );
  });

  it("flags a weak market with opener and market fixes", () => {
    const v = run(SAMPLE_OFFERS[2].line);
    expect(v.status).toBe("fix_required");
    expect(v.fixes.map((f) => f.kind)).toEqual(
      expect.arrayContaining(["opener", "market"]),
    );
  });

  it("names the alternative market with its own evidence, never a forecast", () => {
    const v = run(SAMPLE_OFFERS[2].line);
    const market = v.fixes.find((f) => f.kind === "market");
    expect(market).toBeDefined();
    if (market?.kind !== "market") return;
    expect(market.altCity).toBe("Salt Lake City, UT");
    expect(market.altAffinity?.cells).toBeGreaterThan(0);
    expect(market.detail).not.toMatch(
      /tickets? will|forecast|guarantee(d)? to sell/i,
    );
  });

  it("refuses on money before looking at taste", () => {
    const v = run(SAMPLE_OFFERS[3].line);
    expect(v.status).toBe("refused");
    expect(v.deal.violations.length).toBeGreaterThan(0);
  });

  it("abstains when the act cannot be resolved", () => {
    const v = run(SAMPLE_OFFERS[4].line);
    expect(v.status).toBe("abstained");
    expect(v.abstentions.map((a) => a.code)).toContain("ENTITY_UNRESOLVED");
    expect(v.evidence.source).toBe("sample");
  });

  it("always lists what the signal cannot establish", () => {
    const v = run(SAMPLE_OFFERS[0].line);
    expect(v.cannotEstablish).toContain("actual_ticket_sales");
  });

  it("never recommends swapping to a market that reads worse", () => {
    const p = parseOfferLine(SAMPLE_OFFERS[2].line);
    if (!p.ok) throw new Error("fixture");
    const ev = sampleEvidence(p.offer);
    if (!ev.localAffinity || !ev.altMarket?.localAffinity)
      throw new Error("fixture lacks alt");
    ev.altMarket.localAffinity = {
      ...ev.altMarket.localAffinity,
      mean: ev.localAffinity.mean - 0.05,
    };
    const v = decide(p.offer, ev);
    expect(v.fixes.some((f) => f.kind === "market")).toBe(false);
    expect(v.reasons.join(" ")).toMatch(/reads no better/);
  });

  it("gives a refused deal a counter-offer instead of a dead end", () => {
    const v = run(SAMPLE_OFFERS[3].line);
    expect(v.status).toBe("refused");
    const counter = v.fixes.find((f) => f.kind === "counter");
    expect(counter).toBeDefined();
    if (counter?.kind !== "counter") return;
    expect(counter.guarantee).toBeLessThan(counter.offered);
    expect(counter.detail).toMatch(/negotiation/);
  });

  it("offers a ticket-price raise on tight money and says demand at that price is unknown", () => {
    const v = run(SAMPLE_OFFERS[1].line); // fix_required on money at $28
    expect(v.status).toBe("fix_required");
    const price = v.fixes.find((f) => f.kind === "price");
    expect(price).toBeDefined();
    if (price?.kind !== "price") return;
    expect(price.offered).toBe(28);
    expect(price.ticketPrice).toBe(30);
    expect(price.dealAtPrice.breakEvenCapacityPct).toBeLessThanOrEqual(
      rules.money.warnAboveBreakEvenPct,
    );
    expect(price.detail).toMatch(/not something this check can know/);
    expect(price.detail).not.toMatch(/will sell|will pay|forecast/i);
  });

  it("offers a ticket-price raise on a refused deal when it fits under the ceiling", () => {
    const turnstile = LIVE_OFFERS.find((o) => o.line.startsWith("Turnstile"));
    const v = run(turnstile?.line ?? "");
    expect(v.status).toBe("refused");
    const price = v.fixes.find((f) => f.kind === "price");
    expect(price?.kind === "price" && price.ticketPrice).toBe(40);
  });

  it("offers no ticket-price raise when the price would have to jump past the ceiling", () => {
    const leon = LIVE_OFFERS.find((o) => o.line.startsWith("Leon Bridges"));
    const v = run(leon?.line ?? "");
    expect(v.status).toBe("refused");
    expect(v.fixes.some((f) => f.kind === "price")).toBe(false);
  });

  it("offers no ticket-price raise on a deal that clears", () => {
    const v = run(SAMPLE_OFFERS[0].line);
    expect(v.fixes.some((f) => f.kind === "price")).toBe(false);
  });
});
