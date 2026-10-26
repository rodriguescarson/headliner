import { describe, expect, it } from "vitest";
import { rules } from "@/lib/rules";
import {
  computeDeal,
  counterGuarantee,
  counterTicketPrice,
  withSponsorOffset,
} from "./deal-math";

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

describe("counterGuarantee", () => {
  const offer = {
    capacity: 1000,
    ticketPrice: 40,
    guarantee: 30_000,
    venueCost: 5_000,
  };
  it("finds the largest $250 step that brings break-even inside the warning line", () => {
    const c = counterGuarantee(offer);
    expect(c).not.toBeNull();
    expect(c?.guarantee ? c.guarantee % 250 : 1).toBe(0);
    expect(c?.deal.breakEvenCapacityPct).toBeLessThanOrEqual(
      rules.money.warnAboveBreakEvenPct,
    );
    // one more step up would cross the line
    const over = computeDeal({
      ...offer,
      guarantee: (c?.guarantee ?? 0) + 250,
    });
    expect(over.breakEvenCapacityPct).toBeGreaterThan(
      rules.money.warnAboveBreakEvenPct - 0.002,
    );
  });
  it("offers no counter when the deal already clears the line", () => {
    expect(counterGuarantee({ ...offer, guarantee: 5_000 })).toBeNull();
  });
  it("offers no counter when no positive guarantee can fix the room", () => {
    expect(
      counterGuarantee({
        capacity: 100,
        ticketPrice: 10,
        guarantee: 5_000,
        venueCost: 2_000,
      }),
    ).toBeNull();
  });
});

describe("counterTicketPrice", () => {
  // 600 cap, $32, $9,000 + $2,500: break-even 439 tickets (73.2%)
  const offer = {
    capacity: 600,
    ticketPrice: 32,
    guarantee: 9_000,
    venueCost: 2_500,
  };
  const warn = rules.money.warnAboveBreakEvenPct;
  it("finds the lowest whole-dollar price that brings break-even inside the warning line", () => {
    const p = counterTicketPrice(offer);
    expect(p).not.toBeNull();
    if (!p) return;
    expect(Number.isInteger(p.ticketPrice)).toBe(true);
    expect(p.ticketPrice).toBe(36);
    expect(p.deal.breakEvenCapacityPct).toBeLessThanOrEqual(warn);
    // a dollar less still sits above the line
    const under = computeDeal({ ...offer, ticketPrice: p.ticketPrice - 1 });
    expect(under.breakEvenCapacityPct).toBeGreaterThan(warn);
  });
  it("moves only the price: guarantee and costs stay as offered", () => {
    const p = counterTicketPrice(offer);
    expect(p?.deal.inputs.guarantee).toBe(offer.guarantee);
    expect(p?.deal.inputs.venueCost).toBe(offer.venueCost);
    expect(p?.deal.totalFixedCost).toBe(computeDeal(offer).totalFixedCost);
  });
  it("offers no raise when the deal already clears the line", () => {
    expect(counterTicketPrice({ ...offer, guarantee: 5_000 })).toBeNull();
  });
  it("offers no raise beyond the rulebook ceiling", () => {
    // 250 cap, $20, $6,000 + $1,200 needs $55 (+175%)
    const far = {
      capacity: 250,
      ticketPrice: 20,
      guarantee: 6_000,
      venueCost: 1_200,
    };
    expect(counterTicketPrice(far)).toBeNull();
    // the arithmetic has an answer; the ceiling is what withholds it
    expect(
      computeDeal({ ...far, ticketPrice: 55 }).breakEvenCapacityPct,
    ).toBeLessThanOrEqual(warn);
  });
  it("stays within the ceiling when it does suggest a raise", () => {
    // 800 cap, $30, $14,000 + $3,000: refused at 86.5%, $40 (+33%) clears the line
    const p = counterTicketPrice({
      capacity: 800,
      ticketPrice: 30,
      guarantee: 14_000,
      venueCost: 3_000,
    });
    expect(p?.ticketPrice).toBe(40);
    expect(p?.ticketPrice ?? 0).toBeLessThanOrEqual(
      30 * (1 + rules.money.maxTicketRaisePct),
    );
  });
  it("returns null for an invalid room instead of throwing", () => {
    expect(counterTicketPrice({ ...offer, capacity: 0 })).toBeNull();
  });
});
