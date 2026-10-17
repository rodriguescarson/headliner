/**
 * SAMPLE evidence used only when no Qloo key is configured.
 * It is illustrative and labelled as such on every screen. It is not Qloo data and must never be presented as such.
 * Unknown acts resolve to nothing on purpose, so the abstention path is exercised without a key.
 */
import type { Offer } from "@/lib/deal/offer-parser";
import { nearbyCity } from "@/lib/geo/nearby";
import type { CulturalEvidence } from "./evidence";

type SampleAct = {
  id: string;
  name: string;
  type: string;
  popularity: number;
  cities: Record<string, { mean: number; max: number; cells: number }>;
  openers: string[];
  sponsors: string[];
  places: string[];
  tags: string[];
};

const ACTS: SampleAct[] = [
  {
    id: "sample:act:indie-band",
    name: "Sample Indie Band",
    type: "artist",
    popularity: 0.62,
    cities: {
      "austin, tx": { mean: 0.71, max: 0.93, cells: 42 },
      "dallas, tx": { mean: 0.38, max: 0.66, cells: 37 },
      "chicago, il": { mean: 0.55, max: 0.81, cells: 58 },
    },
    openers: [
      "Sample Local Opener A",
      "Sample Local Opener B",
      "Sample Local Opener C",
    ],
    sponsors: [
      "Sample Regional Brewery",
      "Sample Record Store",
      "Sample Coffee Roaster",
    ],
    places: ["Sample Dive Bar", "Sample Late-Night Taqueria"],
    tags: ["indie rock", "shoegaze", "lo-fi", "craft beer", "vinyl"],
  },
  {
    id: "sample:act:touring-comic",
    name: "Sample Touring Comic",
    type: "person",
    popularity: 0.78,
    cities: {
      "denver, co": { mean: 0.24, max: 0.41, cells: 31 },
      "salt lake city, ut": { mean: 0.52, max: 0.77, cells: 22 },
      "atlanta, ga": { mean: 0.69, max: 0.9, cells: 49 },
    },
    openers: ["Sample Local Comic A", "Sample Local Comic B"],
    sponsors: ["Sample Sports Bar Chain", "Sample Streaming Service"],
    places: ["Sample Chicken & Waffles", "Sample Rooftop Bar"],
    tags: ["stand-up", "observational comedy", "sitcom", "podcasts"],
  },
];

const norm = (s: string) => s.trim().toLowerCase();

export function sampleEvidence(offer: Offer): CulturalEvidence {
  const act = ACTS.find((a) => norm(a.name) === norm(offer.artist));
  const base: CulturalEvidence = {
    source: "sample",
    sourceNote:
      "Sample data. No Qloo key is configured, so nothing here comes from Qloo.",
    entity: null,
    localAffinity: null,
    demographics: null,
    tasteTags: [],
    openers: [],
    sponsors: [],
    places: [],
    altMarket: null,
    coverage: [],
    trace: [],
  };
  if (!act) {
    base.coverage.push({
      code: "ENTITY_UNRESOLVED",
      ok: false,
      detail: `Sample mode knows only ${ACTS.map((a) => `"${a.name}"`).join(" and ")}. "${offer.artist}" did not resolve.`,
    });
    return base;
  }
  base.entity = {
    id: act.id,
    name: act.name,
    type: act.type,
    popularity: act.popularity,
  };
  base.coverage.push({
    code: "ENTITY_RESOLVED",
    ok: true,
    detail: `"${offer.artist}" resolved to ${act.name} (${act.id}).`,
  });
  const city = act.cities[norm(offer.city)];
  if (city) {
    base.localAffinity = {
      ...city,
      label: city.mean < 0.3 ? "low" : city.mean > 0.6 ? "strong" : "mid",
    };
    base.coverage.push({
      code: "HEATMAP_OK",
      ok: true,
      detail: `${city.cells} sample cells for ${offer.city}.`,
    });
  } else {
    base.coverage.push({
      code: "HEATMAP_SPARSE",
      ok: false,
      detail: `Sample mode has no cells for ${offer.city}.`,
    });
  }
  if (base.localAffinity?.label === "low") {
    const altName = nearbyCity(offer.city);
    const altCity = altName ? act.cities[norm(altName)] : undefined;
    if (altName) {
      base.altMarket = {
        city: altName,
        localAffinity: altCity
          ? {
              ...altCity,
              label:
                altCity.mean < 0.3
                  ? "low"
                  : altCity.mean > 0.6
                    ? "strong"
                    : "mid",
            }
          : null,
        sharedTags: act.tags.slice(0, 3),
      };
      base.coverage.push({
        code: "ALT_MARKET",
        ok: !!altCity,
        detail: altCity
          ? `${altName}: ${altCity.cells} sample cells, mean ${altCity.mean}.`
          : `${altName}: no sample cells.`,
      });
    }
  }
  base.demographics = {
    age: {
      "24_and_younger": 0.12,
      "25_to_29": 0.31,
      "30_to_34": 0.28,
      "35_to_44": 0.19,
      "45_to_54": 0.07,
      "55_and_older": 0.03,
    },
    gender: { male: 0.54, female: 0.46 },
  };
  base.coverage.push({
    code: "DEMOGRAPHICS_OK",
    ok: true,
    detail: "Sample age and gender distribution.",
  });
  base.openers = act.openers.map((n, i) => ({
    id: `sample:opener:${i}`,
    name: n,
    affinity: 0.8 - i * 0.1,
    popularity: act.popularity - 0.2 - i * 0.05,
  }));
  base.sponsors = act.sponsors.map((n, i) => ({
    id: `sample:brand:${i}`,
    name: n,
    affinity: 0.75 - i * 0.1,
  }));
  base.places = act.places.map((n, i) => ({
    id: `sample:place:${i}`,
    name: n,
    affinity: 0.7 - i * 0.1,
  }));
  base.tasteTags = act.tags;
  base.coverage.push({
    code: "OPENERS",
    ok: true,
    detail: `${base.openers.length} sample opener candidates.`,
  });
  base.coverage.push({
    code: "SPONSORS",
    ok: true,
    detail: `${base.sponsors.length} sample brand candidates.`,
  });
  return base;
}

export const SAMPLE_OFFERS: { label: string; line: string }[] = [
  {
    label: "Clears: strong local affinity, healthy break-even",
    line: "Sample Indie Band · Austin, TX · 300 cap · $28 ticket · $2,000 guarantee + $900 room",
  },
  {
    label: "Fix required: break-even too high, sponsor and opener fixes",
    line: "Sample Indie Band · Austin, TX · 300 cap · $28 ticket · $3,500 guarantee + $1,200 room",
  },
  {
    label: "Weak market: low affinity in Denver",
    line: "Sample Touring Comic · Denver, CO · 400 cap · $35 ticket · $5,000 guarantee + $1,500 room",
  },
  {
    label: "Refused: a sellout loses money",
    line: "Sample Indie Band · Chicago, IL · 250 cap · $20 ticket · $6,000 guarantee + $1,000 room",
  },
  {
    label: "Abstains: act unknown, no evidence",
    line: "Unknown Local Act · Austin, TX · 150 cap · $15 ticket · $500 guarantee",
  },
];
