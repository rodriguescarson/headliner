/**
 * Turns raw Qloo responses into CulturalEvidence: typed, with explicit coverage flags.
 * Qloo affinity is cultural evidence, never a ticket forecast. Anything missing is reported, not filled in.
 */
import { z } from "zod";
import type { Offer } from "@/lib/deal/offer-parser";
import { nearbyCity } from "@/lib/geo/nearby";
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
  /** Tags shared by the headliner and the top opener, from /v2/analysis/compare. */
  openerSharedTags?: string[];
  openers: Candidate[];
  sponsors: Candidate[];
  places: Candidate[];
  altMarket: {
    city: string;
    localAffinity: CulturalEvidence["localAffinity"];
    sharedTags: string[];
  } | null;
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
    types: z.array(z.string()).optional(),
    subtype: z.string().optional(),
    popularity: z.number().optional(),
    properties: z
      .object({ aliases: z.array(z.string()).optional() })
      .passthrough()
      .optional(),
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
                  .object({
                    affinity: z.number().optional(),
                    affinity_rank: z.number().optional(),
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
        tags: z
          .array(
            z
              .object({ name: z.string(), subtype: z.string().optional() })
              .passthrough(),
          )
          .optional(),
      })
      .passthrough(),
  })
  .passthrough();

/**
 * Tag families worth showing a promoter. Ethnicity and language tags are dropped on purpose: a booking tool
 * should not describe an act's audience by ethnicity. Payment and hotel tags are irrelevant to a show.
 */
const SHOWN_TAG_FAMILIES = [
  "style",
  "music",
  "genre",
  "category",
  "keyword",
  "occupation",
];
/** People (comics, hosts) also carry tags from their books and shows; genre tags mislead there. */
const PERSON_TAG_FAMILIES = ["style", "category", "keyword", "occupation"];
function tagNames(
  res: { ok: boolean; data?: unknown },
  limit: number,
  families: string[] = SHOWN_TAG_FAMILIES,
): string[] {
  const t = res.ok ? TagsResponse.safeParse(res.data) : undefined;
  if (!t?.success) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of t.data.results.tags ?? []) {
    const family = (tag.subtype ?? "").split(":")[2] ?? "";
    if (!families.includes(family)) continue;
    const name = tag.name.trim().replace(/\s+/g, " ");
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
    if (out.length >= limit) break;
  }
  return out;
}

/** Normalised for matching: case, accents, punctuation, "&" and a leading "the" do not distinguish acts. */
export function normaliseActName(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^the /, "");
}

/**
 * Qloo /search returns its nearest matches even for names it does not know ("Goan Garage Collective" comes back
 * as Animal Collective). Headliner accepts only an exact normalised match on the name or a listed alias.
 */
export function pickExactEntity<T extends z.infer<typeof Entity>>(
  query: string,
  results: T[],
): T | undefined {
  const q = normaliseActName(query);
  return results.find(
    (r) =>
      normaliseActName(r.name) === q ||
      (r.properties?.aliases ?? []).some((a) => normaliseActName(a) === q),
  );
}

const entityType = (e: z.infer<typeof Entity>) =>
  e.types?.[0] ?? e.subtype ?? e.type ?? "unknown";

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

export function affinityLabel(mean: number): "low" | "mid" | "strong" {
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
    altMarket: null,
    coverage,
    trace: client.trace,
  };

  const search = await client.search(
    offer.artist,
    [ENTITY.artist, "urn:entity:person"],
    5,
  );
  const parsed = search.ok ? SearchResponse.safeParse(search.data) : undefined;
  const results = parsed?.success ? parsed.data.results : [];
  const top = pickExactEntity(offer.artist, results);
  if (!top) {
    const nearest = results[0]?.name;
    coverage.push({
      code: "ENTITY_UNRESOLVED",
      ok: false,
      detail: !search.ok
        ? `Qloo /search failed: ${search.trace.error}.`
        : nearest
          ? `Qloo has no exact match for "${offer.artist}". Its closest result was "${nearest}", a different act, so no evidence is borrowed from it.`
          : `Qloo /search returned no entity for "${offer.artist}".`,
    });
    return ev;
  }
  const id = top.entity_id ?? top.id ?? "";
  ev.entity = {
    id,
    name: top.name,
    type: entityType(top),
    popularity: top.popularity,
  };
  coverage.push({
    code: "ENTITY_RESOLVED",
    ok: true,
    detail: `"${offer.artist}" resolved to ${top.name} (${entityType(top).replace("urn:entity:", "")}, ${id}).`,
  });

  const popularityMax =
    typeof top.popularity === "number"
      ? Math.max(0.05, top.popularity - 0.05)
      : 0.9;
  // Comedians and podcasters resolve as persons; their openers are persons too.
  const openerType = entityType(top).includes("person")
    ? "urn:entity:person"
    : ENTITY.artist;
  // A scenario can put an opener on the bill; the combined bill becomes the signal for the market reads.
  let billIds = [id];
  if (offer.opener) {
    const o = await client.search(
      offer.opener,
      [ENTITY.artist, "urn:entity:person"],
      5,
    );
    const op = o.ok ? SearchResponse.safeParse(o.data) : undefined;
    const first = op?.success
      ? pickExactEntity(offer.opener, op.data.results)
      : undefined;
    const oid = first?.entity_id ?? first?.id;
    if (oid) {
      billIds = [id, oid];
      coverage.push({
        code: "BILL_OPENER_RESOLVED",
        ok: true,
        detail: `Opener "${offer.opener}" resolved to ${first?.name} (${oid}); market reads use the combined bill.`,
      });
    } else {
      coverage.push({
        code: "BILL_OPENER_UNRESOLVED",
        ok: false,
        detail: `Opener "${offer.opener}" did not resolve; market reads use the headliner alone.`,
      });
    }
  }

  const [heat, demo, openers, brands, places, tags] = await Promise.all([
    client.heatmap(billIds, offer.city),
    client.demographics(billIds, offer.city),
    client.openers([id], offer.city, popularityMax, 10, openerType),
    client.brands([id], offer.city),
    client.places([id], offer.city),
    client.tasteTags([id], openerType),
  ]);

  const affinities = heatmapAffinities(heat);
  if (affinities.length >= rules.evidence.minHeatmapCells) {
    ev.localAffinity = summariseAffinity(affinities);
    coverage.push({
      code: "HEATMAP_OK",
      ok: true,
      detail: `${affinities.length} heatmap cells for ${offer.city}, mean affinity rank ${ev.localAffinity.mean}.`,
    });
  } else if (!heat.ok) {
    coverage.push({
      code: "HEATMAP_FAILED",
      ok: false,
      detail: `The Qloo heatmap call for ${offer.city} failed (${heat.trace.error ?? `HTTP ${heat.trace.status}`}), so local affinity is unknown, not low. Run the check again.`,
    });
  } else {
    coverage.push({
      code: "HEATMAP_SPARSE",
      ok: false,
      detail: `Only ${affinities.length} heatmap cells for ${offer.city}; the rulebook needs ${rules.evidence.minHeatmapCells}.`,
    });
  }

  // Routing alternative: only worth the calls when the primary market reads weak.
  const alt = nearbyCity(offer.city);
  if (alt && ev.localAffinity && ev.localAffinity.label === "low") {
    const altHeat = await client.heatmap([id], alt);
    const altAff = heatmapAffinities(altHeat);
    ev.altMarket = {
      city: alt,
      localAffinity:
        altAff.length >= rules.evidence.minHeatmapCells
          ? summariseAffinity(altAff)
          : null,
      sharedTags: [],
    };
    coverage.push({
      code: "ALT_MARKET",
      ok: ev.altMarket.localAffinity !== null,
      detail: ev.altMarket.localAffinity
        ? `${alt}: ${altAff.length} heatmap cells, mean affinity rank ${ev.altMarket.localAffinity.mean}.`
        : altHeat.ok
          ? `${alt}: heatmap too sparse to compare (${altAff.length} cells).`
          : `${alt}: heatmap call failed (${altHeat.trace.error ?? `HTTP ${altHeat.trace.status}`}).`,
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
  const failed = (r: typeof openers) =>
    r.ok ? null : (r.trace.error ?? `HTTP ${r.trace.status}`);
  coverage.push({
    code: "OPENERS",
    ok: ev.openers.length >= rules.evidence.minOpenerCandidates,
    detail: failed(openers)
      ? `Opener lookup failed (${failed(openers)}); no claim either way.`
      : `${ev.openers.length} local ${openerType.endsWith("person") ? "comics" : "acts"} below the headliner's popularity share its audience.`,
  });
  coverage.push({
    code: "SPONSORS",
    ok: ev.sponsors.length >= rules.evidence.minSponsorCandidates,
    detail: failed(brands)
      ? `Brand lookup failed (${failed(brands)}); no claim either way.`
      : `${ev.sponsors.length} brand candidates with affinity to the act.`,
  });

  // Why the top opener fits: the taste tags it shares with the headliner.
  if (ev.openers[0]) {
    const cmp = await client.compare([id], [ev.openers[0].id], ENTITY.tag, 20);
    ev.openerSharedTags = tagNames(cmp, 6);
  }

  ev.tasteTags = tagNames(
    tags,
    12,
    openerType.endsWith("person") ? PERSON_TAG_FAMILIES : SHOWN_TAG_FAMILIES,
  );

  return ev;
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

function heatmapAffinities(
  res: Awaited<ReturnType<QlooClient["heatmap"]>>,
): number[] {
  const h = res.ok ? HeatmapResponse.safeParse(res.data) : undefined;
  const cells = h?.success ? (h.data.results.heatmap ?? []) : [];
  // affinity is rescaled per response (mean 0.500 everywhere); affinity_rank is comparable across cities.
  return cells
    .map((c) => c.query.affinity_rank)
    .filter((a): a is number => typeof a === "number");
}

function summariseAffinity(
  affinities: number[],
): NonNullable<CulturalEvidence["localAffinity"]> {
  const mean = affinities.reduce((s, a) => s + a, 0) / affinities.length;
  return {
    mean: round3(mean),
    max: round3(Math.max(...affinities)),
    cells: affinities.length,
    label: affinityLabel(mean),
  };
}
