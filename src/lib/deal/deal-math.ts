/**
 * Deterministic deal arithmetic. Pure functions, no I/O, no model.
 * Every number the product shows about money comes from here, against a versioned rulebook.
 */
import { RULES_VERSION, rules } from "@/lib/rules";

export type DealInput = {
  capacity: number;
  ticketPrice: number;
  guarantee: number;
  venueCost?: number;
  productionCost?: number;
  marketingBudget?: number;
  otherFixed?: number;
  sponsorOffset?: number;
  taxPct?: number;
  feesPct?: number;
};

export type HardRuleViolation = {
  code:
    | "CAPACITY_INVALID"
    | "PRICE_INVALID"
    | "NET_PER_TICKET_TOO_LOW"
    | "BREAK_EVEN_ABOVE_CAPACITY"
    | "BREAK_EVEN_ABOVE_REFUSAL_THRESHOLD";
  detail: string;
};

export type DealMath = {
  rulesVersion: string;
  inputs: Required<DealInput>;
  netPerTicket: number;
  totalFixedCost: number;
  breakEvenTickets: number;
  breakEvenCapacityPct: number;
  selloutNet: number;
  netAtPctSold: { pct: number; net: number }[];
  level: "ok" | "warn" | "refuse";
  violations: HardRuleViolation[];
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeDeal(input: DealInput): DealMath {
  const m = rules.money;
  const inputs: Required<DealInput> = {
    capacity: input.capacity,
    ticketPrice: input.ticketPrice,
    guarantee: input.guarantee,
    venueCost: input.venueCost ?? 0,
    productionCost: input.productionCost ?? 0,
    marketingBudget: input.marketingBudget ?? 0,
    otherFixed: input.otherFixed ?? 0,
    sponsorOffset: input.sponsorOffset ?? 0,
    taxPct: input.taxPct ?? m.defaultTaxPct,
    feesPct: input.feesPct ?? m.defaultFeesPct,
  };

  const violations: HardRuleViolation[] = [];
  if (
    !Number.isFinite(inputs.capacity) ||
    inputs.capacity <= 0 ||
    !Number.isInteger(inputs.capacity)
  ) {
    violations.push({
      code: "CAPACITY_INVALID",
      detail: `Capacity must be a positive whole number, got ${inputs.capacity}.`,
    });
  }
  if (!Number.isFinite(inputs.ticketPrice) || inputs.ticketPrice <= 0) {
    violations.push({
      code: "PRICE_INVALID",
      detail: `Ticket price must be positive, got ${inputs.ticketPrice}.`,
    });
  }

  const netPerTicket = round2(
    inputs.ticketPrice * (1 - inputs.taxPct - inputs.feesPct),
  );
  const totalFixedCost = round2(
    inputs.guarantee +
      inputs.venueCost +
      inputs.productionCost +
      inputs.marketingBudget +
      inputs.otherFixed -
      inputs.sponsorOffset,
  );

  if (netPerTicket < m.minNetPerTicket) {
    violations.push({
      code: "NET_PER_TICKET_TOO_LOW",
      detail: `Net per ticket after ${pct(inputs.taxPct)} tax and ${pct(inputs.feesPct)} fees is ${money(netPerTicket)}; the rulebook floor is ${money(m.minNetPerTicket)}.`,
    });
  }

  const safeNet = netPerTicket > 0 ? netPerTicket : Number.NaN;
  const breakEvenTickets =
    totalFixedCost <= 0 ? 0 : Math.ceil(totalFixedCost / safeNet);
  const capacity = inputs.capacity > 0 ? inputs.capacity : Number.NaN;
  const breakEvenCapacityPct = Number.isFinite(breakEvenTickets)
    ? breakEvenTickets / capacity
    : Number.NaN;

  if (Number.isFinite(breakEvenCapacityPct) && breakEvenCapacityPct > 1) {
    violations.push({
      code: "BREAK_EVEN_ABOVE_CAPACITY",
      detail: `Break-even is ${breakEvenTickets} tickets in a ${inputs.capacity}-cap room. A sellout loses money.`,
    });
  } else if (
    Number.isFinite(breakEvenCapacityPct) &&
    breakEvenCapacityPct > m.refuseAboveBreakEvenPct
  ) {
    violations.push({
      code: "BREAK_EVEN_ABOVE_REFUSAL_THRESHOLD",
      detail: `Break-even is ${pct(breakEvenCapacityPct)} of capacity; the rulebook refuses above ${pct(m.refuseAboveBreakEvenPct)} regardless of taste signal.`,
    });
  }

  const selloutNet = round2(inputs.capacity * netPerTicket - totalFixedCost);
  const netAtPctSold = [0.5, 0.65, 0.8, 1].map((p) => ({
    pct: p,
    net: round2(
      Math.floor(inputs.capacity * p) * netPerTicket - totalFixedCost,
    ),
  }));

  let level: DealMath["level"] = "ok";
  if (violations.length > 0) level = "refuse";
  else if (breakEvenCapacityPct > m.warnAboveBreakEvenPct) level = "warn";

  return {
    rulesVersion: RULES_VERSION,
    inputs,
    netPerTicket,
    totalFixedCost,
    breakEvenTickets,
    breakEvenCapacityPct: Number.isFinite(breakEvenCapacityPct)
      ? round4(breakEvenCapacityPct)
      : Number.NaN,
    selloutNet,
    netAtPctSold,
    level,
    violations,
  };
}

/** Re-run the math with an extra sponsor offset. Pure; the caller labels the offset as an assumption. */
export function withSponsorOffset(input: DealInput, offset: number): DealMath {
  return computeDeal({
    ...input,
    sponsorOffset: (input.sponsorOffset ?? 0) + offset,
  });
}

const round4 = (n: number) => Math.round(n * 10000) / 10000;
export const pct = (n: number) => `${Math.round(n * 1000) / 10}%`;
export const money = (n: number, exact = false) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: rules.money.currency,
    minimumFractionDigits: exact ? 2 : 0,
    maximumFractionDigits: exact ? 2 : 0,
  }).format(n);

/**
 * The largest guarantee, rounded down to $250, at which break-even sits at or under the rulebook's warning line.
 * This is arithmetic on the promoter's own numbers, not advice on what the act will accept. Returns null when no
 * positive guarantee gets there (the ticket price or room is the problem, not the guarantee) or when the offer
 * already clears the line.
 */
export function counterGuarantee(
  input: DealInput,
  targetPct: number = rules.money.warnAboveBreakEvenPct,
): { guarantee: number; deal: DealMath } | null {
  const base = computeDeal(input);
  if (!(base.netPerTicket > 0) || !Number.isFinite(base.breakEvenCapacityPct))
    return null;
  if (base.breakEvenCapacityPct <= targetPct) return null;
  const i = base.inputs;
  const tickets = Math.floor(targetPct * i.capacity);
  const otherFixed =
    i.venueCost +
    i.productionCost +
    i.marketingBudget +
    i.otherFixed -
    i.sponsorOffset;
  const raw = tickets * base.netPerTicket - otherFixed;
  const guarantee = Math.floor(raw / 250) * 250;
  if (guarantee <= 0 || guarantee >= i.guarantee) return null;
  return { guarantee, deal: computeDeal({ ...input, guarantee }) };
}
