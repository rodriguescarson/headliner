/**
 * Turns raw Qloo responses into CulturalEvidence: typed, with explicit coverage flags.
 * Qloo affinity is cultural evidence, never a ticket forecast. Anything missing is reported, not filled in.
 */
import { z } from "zod";
import type { Offer } from "@/lib/deal/offer-parser";
import { rules } from "@/lib/rules";
import { ENTITY, type QlooClient, type TraceEntry } from "./client";

export type Candidate = {
  id: string;
  name: string;
  affinity?: number;
  popularity?: number;
  explain?: { name: string; score: number }[];
  subtype?: string;
};

export type CoverageFlag = { code: string; ok: boolean; detail: string };

export type CulturalEvidence = {
  source: "live" | "sample" | "none";
  sourceNote: string;
  entity: {
    id: string;
    name: string;
    type: string;
    popularity?: number;
  } | null;
  localAffinity: {
    mean: number;
    max: number;
    cells: number;
    label: "low" | "mid" | "strong";
  } | null;
  demographics: {
    age: Record<string, number>;
    gender: Record<string, number>;
  } | null;
  tasteTags: string[];
  openers: Candidate[];
  sponsors: Candidate[];
  places: Candidate[];
  coverage: CoverageFlag[];
  trace: TraceEntry[];
};

// Loose schemas: Qloo returns full objects with many fields; we validate only what we read.
const Entity = z
  .object({
    entity_id: z.string().optional(),
    id: z.string().optional(),
    name: z.string(),
    type: z.string().optional(),
    subtype: z.string().optional(),
    popularity: z.number().optional(),
    query: z
      .object({
        affinity: z.number().optional(),
        explainability: z.unknown().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const SearchResponse = z.object({ results: z.array(Entity) }).passthrough();
const InsightsResponse = z
  .object({
    results: z.object({ entities: z.array(Entity).optional() }).passthrough(),
  })
  .passthrough();
const HeatmapResponse = z
  .object({
    results: z
      .object({
        heatmap: z
          .array(
            z
              .object({
                query: z
                  .object({ affinity: z.number().optional() })
                  .passthrough(),
              })
              .passthrough(),
          )
          .optional(),
      })
      .passthrough(),
  })
  .passthrough();
const DemographicsResponse = z
  .object({
    results: z
      .object({
        demographics: z
          .array(
            z
              .object({
                query: z
                  .object({
                    age: z.record(z.string(), z.number()).optional(),
                    gender: z.record(z.string(), z.number()).optional(),
                  })
                  .passthrough(),
              })
              .passthrough(),
          )
          .optional(),
      })
      .passthrough(),
  })
  .passthrough();
const TagsResponse = z
  .object({
    results: z
      .object({
        entities: z
          .array(z.object({ name: z.string() }).passthrough())
          .optional(),
      })
      .passthrough(),
  })
  .passthrough();

function toCandidate(e: z.infer<typeof Entity>): Candidate {
  const explainRaw = e.query?.explainability as
    | Record<string, unknown>
    | undefined;
  const explain: Candidate["explain"] = [];
  const sig = explainRaw?.["signal.interests.entities"];
  if (Array.isArray(sig)) {
    for (const s of sig as Record<string, unknown>[]) {
      if (typeof s.name === "string" && typeof s.score === "number")
        explain.push({ name: s.name, score: s.score });
    }
  }
  return {
    id: e.entity_id ?? e.id ?? e.name,
    name: e.name,
    affinity: e.query?.affinity,
    popularity: e.popularity,
    subtype: e.subtype,
    explain: explain.length ? explain : undefined,
  };
}

function affinityLabel(mean: number): "low" | "mid" | "strong" {
  if (mean < rules.evidence.lowAffinityBelow) return "low";
  if (mean > rules.evidence.strongAffinityAbove) return "strong";
  return "mid";
}

/** Live evidence gathering. Runs the independent calls in parallel; a failed branch becomes a coverage flag. */
export async function gatherEvidence(
  client: QlooClient,
  offer: Offer,
): Promise<CulturalEvidence> {
  const coverage: CoverageFlag[] = [];
  const ev: CulturalEvidence = {
    source: "live",
    sourceNote: "Live Qloo responses (cached server-side).",
    entity: null,
    localAffinity: null,
    demographics: null,
    tasteTags: [],
    openers: [],
    sponsors: [],
    places: [],
    coverage,
    trace: client.trace,
  };

  const search = await client.search(offer.artist, [
    ENTITY.artist,
    "urn:entity:person",
  ]);
  const parsed = search.ok ? SearchResponse.safeParse(search.data) : undefined;
  const top = parsed?.success ? parsed.data.results[0] : undefined;
  if (!top) {
    coverage.push({
      code: "ENTITY_UNRESOLVED",
      ok: false,
      detail: search.ok
        ? `Qloo /search returned no entity for "${offer.artist}".`
        : `Qloo /search failed: ${search.trace.error}.`,
    });
    return ev;
  }
  const id = top.entity_id ?? top.id ?? "";
  ev.entity = {
    id,
    name: top.name,
    type: top.type ?? top.subtype ?? "unknown",
    popularity: top.popularity,
  };
  coverage.push({
    code: "ENTITY_RESOLVED",
    ok: true,
    detail: `"${offer.artist}" resolved to ${top.name} (${id}).`,
  });

  const popularityMax =
    typeof top.popularity === "number"
      ? Math.max(0.05, top.popularity - 0.05)
      : 0.9;

  const [heat, demo, openers, brands, places, tags] = await Promise.all([
    client.heatmap([id], offer.city),
    client.demographics([id], offer.city),
    client.openers([id], offer.city, popularityMax),
    client.brands([id], offer.city),
    client.places([id], offer.city),
    client.tasteTags([id]),
  ]);

  const h = heat.ok ? HeatmapResponse.safeParse(heat.data) : undefined;
  const cells = h?.success ? (h.data.results.heatmap ?? []) : [];
  const affinities = cells
    .map((c) => c.query.affinity)
    .filter((a): a is number => typeof a === "number");
  if (affinities.length >= rules.evidence.minHeatmapCells) {
    const mean = affinities.reduce((s, a) => s + a, 0) / affinities.length;
    ev.localAffinity = {
      mean: round3(mean),
      max: round3(Math.max(...affinities)),
      cells: affinities.length,
      label: affinityLabel(mean),
    };
    coverage.push({
      code: "HEATMAP_OK",
      ok: true,
      detail: `${affinities.length} heatmap cells for ${offer.city}.`,
    });
  } else {
    coverage.push({
      code: "HEATMAP_SPARSE",
      ok: false,
      detail: heat.ok
        ? `Only ${affinities.length} heatmap cells for ${offer.city}; the rulebook needs ${rules.evidence.minHeatmapCells}.`
        : `Heatmap call failed: ${heat.trace.error}.`,
    });
  }

  const d = demo.ok ? DemographicsResponse.safeParse(demo.data) : undefined;
  const dq = d?.success ? d.data.results.demographics?.[0]?.query : undefined;
  if (dq?.age || dq?.gender) {
    ev.demographics = { age: dq.age ?? {}, gender: dq.gender ?? {} };
    coverage.push({
      code: "DEMOGRAPHICS_OK",
      ok: true,
      detail: "Age and gender affinity returned.",
    });
  } else {
    coverage.push({
      code: "DEMOGRAPHICS_MISSING",
      ok: false,
      detail: demo.ok
        ? "No demographic rows returned."
        : `Demographics call failed: ${demo.trace.error}.`,
    });
  }

  const take = (r: typeof openers) => {
    const p = r.ok ? InsightsResponse.safeParse(r.data) : undefined;
    return p?.success ? (p.data.results.entities ?? []).map(toCandidate) : [];
  };
  ev.openers = take(openers);
  ev.sponsors = take(brands);
  ev.places = take(places);
  coverage.push({
    code: "OPENERS",
    ok: ev.openers.length >= rules.evidence.minOpenerCandidates,
    detail: `${ev.openers.length} local artist candidates below the headliner's popularity.`,
  });
  coverage.push({
    code: "SPONSORS",
    ok: ev.sponsors.length >= rules.evidence.minSponsorCandidates,
    detail: `${ev.sponsors.length} brand candidates with affinity to the act.`,
  });

  const tg = tags.ok ? TagsResponse.safeParse(tags.data) : undefined;
  ev.tasteTags = tg?.success
    ? (tg.data.results.entities ?? []).map((t) => t.name).slice(0, 12)
    : [];

  return ev;
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;
