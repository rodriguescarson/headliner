import { describe, expect, it } from "vitest";
import { computeDeal, withSponsorOffset } from "./deal-math";

const base = {
  capacity: 300,
  ticketPrice: 28,
  guarantee: 3500,
  venueCost: 1200,
};

describe("computeDeal", () => {
  it("computes break-even from fixed costs and net per ticket", () => {
    const d = computeDeal(base);
    // 28 * (1 - 0.08 - 0.10) = 22.96
    expect(d.netPerTicket).toBe(22.96);
    expect(d.totalFixedCost).toBe(4700);
    // ceil(4700 / 22.96) = 205
    expect(d.breakEvenTickets).toBe(205);
    expect(d.breakEvenCapacityPct).toBeCloseTo(205 / 300, 4);
    expect(d.level).toBe("warn");
    expect(d.violations).toEqual([]);
  });

  it("refuses when break-even exceeds the rulebook threshold", () => {
    const d = computeDeal({ ...base, guarantee: 5000 }); // 6200 / 22.96 = 271 of 300 = 90%
    expect(d.level).toBe("refuse");
    expect(d.violations.map((v) => v.code)).toContain(
      "BREAK_EVEN_ABOVE_REFUSAL_THRESHOLD",
    );
  });

  it("flags a deal where even a sellout loses money", () => {
    const d = computeDeal({ ...base, guarantee: 9000 });
    expect(d.violations.map((v) => v.code)).toContain(
      "BREAK_EVEN_ABOVE_CAPACITY",
    );
    expect(d.selloutNet).toBeLessThan(0);
  });

  it("rejects invalid capacity and price without throwing", () => {
    const d = computeDeal({ capacity: 0, ticketPrice: -1, guarantee: 100 });
    expect(d.level).toBe("refuse");
    expect(d.violations.map((v) => v.code)).toEqual(
      expect.arrayContaining([
        "CAPACITY_INVALID",
        "PRICE_INVALID",
        "NET_PER_TICKET_TOO_LOW",
      ]),
    );
    expect(Number.isNaN(d.breakEvenCapacityPct)).toBe(true);
  });

  it("clears a comfortable deal", () => {
    const d = computeDeal({
      capacity: 500,
      ticketPrice: 35,
      guarantee: 2500,
      venueCost: 1000,
    });
    expect(d.level).toBe("ok");
    expect(d.breakEvenCapacityPct).toBeLessThan(0.65);
  });

  it("applies a sponsor offset deterministically", () => {
    const before = computeDeal(base);
    const after = withSponsorOffset(base, 1000);
    expect(after.totalFixedCost).toBe(before.totalFixedCost - 1000);
    expect(after.breakEvenTickets).toBeLessThan(before.breakEvenTickets);
  });

  it("stamps the rulebook version on every result", () => {
    expect(computeDeal(base).rulesVersion).toMatch(
      /^headliner-rules@\d+\.\d+\.\d+$/,
    );
  });
});
