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

type Provider = "gateway" | "openrouter";

/** Which model route is configured: Vercel AI Gateway first, then OpenRouter. Null disables the control. */
export function baselineRoute(): { provider: Provider; model: string } | null {
  const model =
    process.env.HEADLINER_BASELINE_MODEL ?? "anthropic/claude-sonnet-5.5";
  if (process.env.AI_GATEWAY_API_KEY) return { provider: "gateway", model };
  if (process.env.OPENROUTER_API_KEY) return { provider: "openrouter", model };
  return null;
}

export function baselineModel(): string | null {
  return baselineRoute()?.model ?? null;
}

const SYSTEM =
  "You are a booking assistant with no access to any data source. Answer from general knowledge only. Name real acts and brands if you know them; if you do not know the local scene, say so in reasoning and return empty lists rather than inventing names.";
const promptFor = (offer: Offer) =>
  `Act: ${offer.artist}\nCity: ${offer.city}\nVenue capacity: ${offer.capacity}\n\nRate this act's local affinity in this city (low, mid, strong), list up to five local opening acts that share its audience, and up to five brands that could sponsor the show.`;

/**
 * OpenRouter speaks the OpenAI chat API. Plain fetch with a JSON schema response, validated by the same zod
 * schema as the gateway route, so both routes produce identical guesses for the comparison.
 */
function openRouterGenerator(model: string): BaselineGenerator {
  return async (offer) => {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "X-Title": "Headliner",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `${promptFor(offer)}\n\nReply with JSON only: {"localAffinity": "low"|"mid"|"strong", "openers": string[], "sponsors": string[], "reasoning": string (under 400 characters)}.`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };
    if (!res.ok)
      throw new Error(body.error?.message ?? `OpenRouter HTTP ${res.status}`);
    const text = body.choices?.[0]?.message?.content ?? "";
    const json = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ""));
    return BaselineSchema.parse({
      ...json,
      openers: (json.openers ?? []).slice(0, 5),
      sponsors: (json.sponsors ?? []).slice(0, 5),
      reasoning: String(json.reasoning ?? "").slice(0, 400),
    });
  };
}

export function makeGenerator(
  model: string,
  provider: Provider = "gateway",
): BaselineGenerator {
  if (provider === "openrouter") return openRouterGenerator(model);
  return async (offer) => {
    const { output } = await generateText({
      model,
      temperature: 0,
      output: Output.object({ schema: BaselineSchema }),
      system: SYSTEM,
      prompt: promptFor(offer),
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
  const route = baselineRoute();
  const model = route ? `${route.model} via ${route.provider}` : null;
  if (!generator && !route) {
    return {
      enabled: false,
      note: "Baseline disabled: no AI_GATEWAY_API_KEY or OPENROUTER_API_KEY configured.",
    };
  }
  try {
    const guess = await (
      generator ?? makeGenerator(route?.model as string, route?.provider)
    )(offer);
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
