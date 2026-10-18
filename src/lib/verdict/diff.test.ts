import { describe, expect, it } from "vitest";
import { parseOfferLine } from "@/lib/deal/offer-parser";
import { SAMPLE_OFFERS, sampleEvidence } from "@/lib/qloo/sample";
import { applyScenario } from "@/lib/scenario";
import { diffVerdicts } from "./diff";
import { decide } from "./verdict";

const offerOf = (line: string) => {
  const p = parseOfferLine(line);
  if (!p.ok) throw new Error("fixture");
  return p.offer;
};
const run = (o: ReturnType<typeof offerOf>) => decide(o, sampleEvidence(o));

describe("scenario compare", () => {
  it("sponsor offset lowers break-even and can clear a tight deal", () => {
    const base = offerOf(SAMPLE_OFFERS[1].line); // fix_required on money
    const next = applyScenario(base, { kind: "sponsor", sponsorOffset: 1500 });
    const d = diffVerdicts(run(base), run(next));
    expect(d.breakEven.deltaTickets).toBeLessThan(0);
    expect(d.status.from).toBe("fix_required");
    expect(d.status.to).toBe("cleared");
    expect(d.lines.join(" ")).toMatch(/fixed costs change/);
    expect(d.lines.join(" ")).not.toMatch(/will sell|forecast/i);
  });

  it("market swap changes the affinity read, never the money", () => {
    const base = offerOf(SAMPLE_OFFERS[2].line); // Denver weak
    const next = applyScenario(base, {
      kind: "market",
      city: "Salt Lake City, UT",
    });
    const d = diffVerdicts(run(base), run(next));
    expect(d.breakEven.deltaTickets).toBe(0);
    expect(d.affinity.changed).toBe(true);
    expect(d.affinity.to).toMatch(/mid/);
  });

  it("opener in sample mode is reported as not evaluable, not as a gain", () => {
    const base = offerOf(SAMPLE_OFFERS[2].line);
    const next = applyScenario(base, {
      kind: "opener",
      opener: "Sample Local Comic A",
    });
    const d = diffVerdicts(run(base), run(next));
    expect(d.affinity.changed).toBe(false);
    expect(d.lines.join(" ")).toMatch(/could not be evaluated/);
  });
});
