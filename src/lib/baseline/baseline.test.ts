import { describe, expect, it } from "vitest";
import { parseOfferLine } from "@/lib/deal/offer-parser";
import { SAMPLE_OFFERS, sampleEvidence } from "@/lib/qloo/sample";
import { compareBaseline, runBaseline } from "./baseline";

const offer = (() => {
  const p = parseOfferLine(SAMPLE_OFFERS[0].line);
  if (!p.ok) throw new Error("fixture");
  return p.offer;
})();

describe("baseline comparison", () => {
  it("measures overlap case-insensitively and ignores a leading 'the'", () => {
    const ev = sampleEvidence(offer);
    const o = compareBaseline(
      {
        localAffinity: "strong",
        openers: ["the sample local opener a", "Made Up Band"],
        sponsors: [],
        reasoning: "",
      },
      ev,
    );
    expect(o.affinityAgrees).toBe(true);
    expect(o.openers.shared).toEqual(["Sample Local Opener A"]);
    expect(o.openers.modelOnly).toEqual(["Made Up Band"]);
    expect(o.openers.qlooOnly).toHaveLength(2);
    // 1 shared over 4 distinct names
    expect(o.openers.pct).toBe(25);
    expect(o.sponsors.pct).toBe(0);
  });

  it("returns null percentages when neither side names anything", () => {
    const ev = sampleEvidence({ ...offer, artist: "Nobody" });
    const o = compareBaseline(
      { localAffinity: "low", openers: [], sponsors: [], reasoning: "" },
      ev,
    );
    expect(o.affinityAgrees).toBeNull();
    expect(o.openers.pct).toBeNull();
  });

  it("is disabled without a gateway key and says so", async () => {
    const r = await runBaseline(offer, sampleEvidence(offer));
    expect(r.enabled).toBe(false);
    expect(r.note).toMatch(/AI_GATEWAY_API_KEY/);
  });

  it("runs with an injected generator and reports a failure without throwing", async () => {
    const ok = await runBaseline(offer, sampleEvidence(offer), async () => ({
      localAffinity: "mid",
      openers: [],
      sponsors: ["Sample Record Store"],
      reasoning: "x",
    }));
    expect(ok.enabled).toBe(true);
    expect(ok.overlap?.sponsors.shared).toEqual(["Sample Record Store"]);
    const failed = await runBaseline(offer, sampleEvidence(offer), async () => {
      throw new Error("boom");
    });
    expect(failed.note).toMatch(/boom/);
  });
});
