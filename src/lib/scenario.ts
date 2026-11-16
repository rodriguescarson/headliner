/**
 * A scenario is one deliberate change to the offer on the desk: swap the market, put an opener on the bill,
 * apply a sponsor offset, counter the guarantee, or raise the ticket price. The same deterministic check runs on the changed offer and the two verdicts are
 * compared. Nothing here forecasts; it re-runs the same arithmetic and the same evidence calls.
 */
import { z } from "zod";
import type { Offer } from "@/lib/deal/offer-parser";
import { SCENARIO_KIND, type ScenarioKind } from "@/lib/enums";

export const ScenarioSchema = z
  .object({
    kind: z.enum(SCENARIO_KIND),
    city: z.string().trim().min(2).max(80).optional(),
    opener: z.string().trim().min(1).max(120).optional(),
    sponsorOffset: z.number().nonnegative().max(1_000_000).optional(),
    guarantee: z.number().positive().max(10_000_000).optional(),
    ticketPrice: z.number().positive().max(100_000).optional(),
  })
  .refine(
    (s) =>
      s.kind === "market"
        ? !!s.city
        : s.kind === "opener"
          ? !!s.opener
          : s.kind === "guarantee"
            ? typeof s.guarantee === "number"
            : s.kind === "price"
              ? typeof s.ticketPrice === "number"
              : typeof s.sponsorOffset === "number",
    {
      message: "A scenario needs the field its kind changes.",
    },
  );
export type Scenario = z.infer<typeof ScenarioSchema>;

export function applyScenario(offer: Offer, scenario: Scenario): Offer {
  switch (scenario.kind) {
    case "market":
      return { ...offer, city: scenario.city as string };
    case "opener":
      return { ...offer, opener: scenario.opener };
    case "guarantee":
      return { ...offer, guarantee: scenario.guarantee as number };
    case "price":
      return { ...offer, ticketPrice: scenario.ticketPrice as number };
    case "sponsor":
      return {
        ...offer,
        sponsorOffset:
          (offer.sponsorOffset ?? 0) + (scenario.sponsorOffset as number),
      };
  }
}

export function describeScenario(scenario: Scenario): {
  kind: ScenarioKind;
  label: string;
} {
  switch (scenario.kind) {
    case "market":
      return { kind: "market", label: `Swap the market to ${scenario.city}` };
    case "opener":
      return { kind: "opener", label: `Put ${scenario.opener} on the bill` };
    case "guarantee":
      return {
        kind: "guarantee",
        label: `Counter at a ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(scenario.guarantee as number)} guarantee`,
      };
    case "price":
      return {
        kind: "price",
        label: `Raise the ticket to ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(scenario.ticketPrice as number)}`,
      };
    case "sponsor":
      return {
        kind: "sponsor",
        label: `Apply a ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(scenario.sponsorOffset as number)} sponsor offset`,
      };
  }
}
