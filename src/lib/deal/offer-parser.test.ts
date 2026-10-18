import { describe, expect, it } from "vitest";
import { parseOfferLine } from "./offer-parser";

describe("parseOfferLine", () => {
  it("reads the canonical offer line", () => {
    const r = parseOfferLine(
      "Artist X · Austin, TX · 300 cap · $28 ticket · $3,500 guarantee + $1,200 room",
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.offer).toMatchObject({
      artist: "Artist X",
      city: "Austin, TX",
      capacity: 300,
      ticketPrice: 28,
      guarantee: 3500,
      venueCost: 1200,
    });
  });

  it("reports what is missing instead of guessing", () => {
    const r = parseOfferLine("Some Band · Chicago · $30 ticket");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.missing).toEqual(
      expect.arrayContaining(["capacity", "guarantee"]),
    );
    expect(r.partial.artist).toBe("Some Band");
  });

  it("accepts pipes and dashes as separators", () => {
    const r = parseOfferLine(
      "Comic Y | Denver | 250 seats | $35 door | $2,000 gtd | $800 rent | $400 production",
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.offer.productionCost).toBe(400);
    expect(r.offer.venueCost).toBe(800);
  });
});
