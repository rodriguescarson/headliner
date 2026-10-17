/**
 * Deterministic parser for a one-line offer such as
 *   "Artist X · Austin, TX · 300 cap · $28 ticket · $3,500 guarantee + $1,200 room"
 * No model involved. Anything it cannot read is reported as missing, never guessed.
 */
import { z } from "zod";

export const OfferSchema = z.object({
  artist: z.string().trim().min(1),
  city: z.string().trim().min(1),
  capacity: z.number().int().positive(),
  ticketPrice: z.number().positive(),
  guarantee: z.number().nonnegative(),
  venueCost: z.number().nonnegative().default(0),
  productionCost: z.number().nonnegative().default(0),
  marketingBudget: z.number().nonnegative().default(0),
  date: z.string().optional(),
});
export type Offer = z.infer<typeof OfferSchema>;

export type ParsedOffer =
  | { ok: true; offer: Offer }
  | { ok: false; missing: string[]; partial: Partial<Offer> };

const num = (s: string) => Number(s.replace(/[$,]/g, ""));

export function parseOfferLine(line: string): ParsedOffer {
  const parts = line
    .split(/\s*[·|•]\s*|\s+-\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const partial: Partial<Offer> = {};
  const rest: string[] = [];

  for (const p of parts) {
    const cap = p.match(/^(\d[\d,]*)\s*(?:cap|capacity|seats?)$/i);
    const price = p.match(
      /^\$?(\d[\d,]*(?:\.\d+)?)\s*(?:ticket|tix|door|per ticket)$/i,
    );
    const guar = p.match(/\$?(\d[\d,]*(?:\.\d+)?)\s*(?:guarantee|gtd|fee)/i);
    const room = p.match(/\$?(\d[\d,]*(?:\.\d+)?)\s*(?:room|rent|venue|hall)/i);
    const prod = p.match(
      /\$?(\d[\d,]*(?:\.\d+)?)\s*(?:production|prod|sound|lights)/i,
    );
    const mkt = p.match(/\$?(\d[\d,]*(?:\.\d+)?)\s*(?:marketing|ads|promo)/i);
    if (cap) partial.capacity = num(cap[1]);
    else if (price) partial.ticketPrice = num(price[1]);
    else if (guar || room || prod || mkt) {
      // a segment can hold several money terms: "$3,500 guarantee + $1,200 room"
      if (guar) partial.guarantee = num(guar[1]);
      if (room) partial.venueCost = num(room[1]);
      if (prod) partial.productionCost = num(prod[1]);
      if (mkt) partial.marketingBudget = num(mkt[1]);
    } else rest.push(p);
  }
  if (rest[0]) partial.artist = rest[0];
  if (rest[1]) partial.city = rest[1];

  const result = OfferSchema.safeParse(partial);
  if (result.success) return { ok: true, offer: result.data };
  const missing = Array.from(
    new Set(result.error.issues.map((i) => String(i.path[0]))),
  );
  return { ok: false, missing, partial };
}
