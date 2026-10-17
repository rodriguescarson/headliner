/**
 * The "Without Qloo" control. The same offer goes to a language model alone, with no cultural graph,
 * and we measure how much of what it names overlaps with what Qloo returned. This is the organisers' own
 * eligibility test ("if your submission would work the same without Qloo, you're building the wrong thing")
 * turned into a number. The model is only ever asked for names and a label; it never touches money.
 */
import { generateText, Output } from "ai";
import { z } from "zod";
import type { Offer } from "@/lib/deal/offer-parser";
import type { CulturalEvidence } from "@/lib/qloo/evidence";

export const BaselineSchema = z.object({
  localAffinity: z.enum(["low", "mid", "strong"]),
  openers: z.array(z.string()).max(5),
  sponsors: z.array(z.string()).max(5),
  reasoning: z.string().max(400),
});
export type BaselineGuess = z.infer<typeof BaselineSchema>;

export type BaselineComparison = {
  enabled: boolean;
  model?: string;
  note: string;
  guess?: BaselineGuess;
  overlap?: {
    affinityAgrees: boolean | null;
    openers: {
      shared: string[];
      modelOnly: string[];
      qlooOnly: string[];
      pct: number | null;
    };
    sponsors: {
      shared: string[];
      modelOnly: string[];
      qlooOnly: string[];
      pct: number | null;
    };
  };
};

export type BaselineGenerator = (offer: Offer) => Promise<BaselineGuess>;

export function baselineModel(): string | null {
  if (!process.env.AI_GATEWAY_API_KEY) return null;
  return process.env.HEADLINER_BASELINE_MODEL ?? "anthropic/claude-sonnet-5.5";
}

export function makeGenerator(model: string): BaselineGenerator {
  return async (offer) => {
    const { output } = await generateText({
      model,
      temperature: 0,
      output: Output.object({ schema: BaselineSchema }),
      system:
        "You are a booking assistant with no access to any data source. Answer from general knowledge only. Name real acts and brands if you know them; if you do not know the local scene, say so in reasoning and return empty lists rather than inventing names.",
      prompt: `Act: ${offer.artist}\nCity: ${offer.city}\nVenue capacity: ${offer.capacity}\n\nRate this act's local affinity in this city (low, mid, strong), list up to five local opening acts that share its audience, and up to five brands that could sponsor the show.`,
    });
    return output;
  };
}

const norm = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/^the\s+/, "");

function overlapOf(model: string[], qloo: string[]) {
  const m = new Map(model.map((x) => [norm(x), x]));
  const q = new Map(qloo.map((x) => [norm(x), x]));
  const shared = [...m.keys()]
    .filter((k) => q.has(k))
    .map((k) => q.get(k) as string);
  const modelOnly = [...m.keys()]
    .filter((k) => !q.has(k))
    .map((k) => m.get(k) as string);
  const qlooOnly = [...q.keys()]
    .filter((k) => !m.has(k))
    .map((k) => q.get(k) as string);
  const denom = new Set([...m.keys(), ...q.keys()]).size;
  return {
    shared,
    modelOnly,
    qlooOnly,
    pct: denom === 0 ? null : Math.round((shared.length / denom) * 1000) / 10,
  };
}

/** Pure: compares a model's guess with Qloo evidence. Exported for tests. */
export function compareBaseline(
  guess: BaselineGuess,
  evidence: CulturalEvidence,
): NonNullable<BaselineComparison["overlap"]> {
  return {
    affinityAgrees: evidence.localAffinity
      ? evidence.localAffinity.label === guess.localAffinity
      : null,
    openers: overlapOf(
      guess.openers,
      evidence.openers.map((c) => c.name),
    ),
    sponsors: overlapOf(
      guess.sponsors,
      evidence.sponsors.map((c) => c.name),
    ),
  };
}

export async function runBaseline(
  offer: Offer,
  evidence: CulturalEvidence,
  generator?: BaselineGenerator,
): Promise<BaselineComparison> {
  const model = baselineModel();
  if (!generator && !model) {
    return {
      enabled: false,
      note: "Baseline disabled: no AI_GATEWAY_API_KEY configured.",
    };
  }
  try {
    const guess = await (generator ?? makeGenerator(model as string))(offer);
    return {
      enabled: true,
      model: model ?? "test",
      note: "Same offer, model alone, no cultural graph. Overlap is Jaccard over normalised names.",
      guess,
      overlap: compareBaseline(guess, evidence),
    };
  } catch (e) {
    return {
      enabled: true,
      model: model ?? "test",
      note: `Baseline call failed: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}
