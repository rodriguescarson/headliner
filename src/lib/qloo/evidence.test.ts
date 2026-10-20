import { describe, expect, it } from "vitest";
import { MemoryCache } from "./cache";
import { ENTITY, QlooClient } from "./client";
import { gatherEvidence } from "./evidence";

/**
 * Live-path test with a fake fetch. The response shapes here are the ones the client is written against;
 * scripts/verify-qloo.ts hardens them against the real API on key day.
 */
function fakeQloo(opts: {
  heatCells: Record<string, number[]>;
  resolve?: boolean | "near-miss";
  heatStatus?: number;
  rateLimitFirst?: number;
}) {
  let limited = opts.rateLimitFirst ?? 0;
  const calls: string[] = [];
  const fetchImpl: typeof fetch = async (input) => {
    const url = new URL(String(input));
    calls.push(`${url.pathname}?${url.searchParams.toString()}`);
    const q = url.searchParams;
    const json = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: {
          "Content-Type": "application/json",
          "x-second-ratelimit-reset": "0.01",
        },
      });
    if (limited > 0) {
      limited -= 1;
      return json({ message: "Too Many Requests" }, 429);
    }
    if (url.pathname === "/search") {
      return json({
        results:
          opts.resolve === false
            ? []
            : opts.resolve === "near-miss"
              ? [
                  {
                    entity_id: "E9",
                    name: "Act Won Collective",
                    types: ["urn:entity:artist"],
                    popularity: 0.9,
                  },
                ]
              : [
                  {
                    entity_id: "E1",
                    name: "Act One",
                    types: ["urn:entity:artist"],
                    popularity: 0.7,
                  },
                ],
      });
    }
    if (url.pathname === "/v2/analysis/compare")
      return json({
        results: {
          tags: [
            { name: "indie rock", subtype: "urn:tag:genre:music" },
            { name: "shoegaze", subtype: "urn:tag:genre:music" },
          ],
        },
      });
    const type = q.get("filter.type");
    if (type === ENTITY.heatmap) {
      if (opts.heatStatus) return json({ message: "boom" }, opts.heatStatus);
      const city = q.get("filter.location.query") ?? "";
      const cells = opts.heatCells[city] ?? [];
      // Real shape: affinity is rescaled per response; affinity_rank carries the signal.
      return json({
        results: {
          heatmap: cells.map((r) => ({
            location: { geohash: "9v6kpyn" },
            query: { affinity: 0.5, affinity_rank: r },
          })),
        },
      });
    }
    if (type === ENTITY.demographics)
      return json({
        results: {
          demographics: [
            {
              entity_id: "E1",
              query: { age: { "25_to_29": 0.4 }, gender: { male: 0.5 } },
            },
          ],
        },
      });
    if (type === ENTITY.tag)
      return json({
        results: {
          tags: [
            { name: "indie rock", subtype: "urn:tag:genre:music" },
            { name: "Example Group", subtype: "urn:tag:ethnicity:qloo" },
            { name: "Discover", subtype: "urn:tag:credit_card:place" },
          ],
        },
      });
    return json({
      results: {
        entities: [
          {
            entity_id: "X",
            name: "Candidate",
            popularity: 0.3,
            query: { affinity: 0.8 },
          },
        ],
      },
    });
  };
  return {
    client: new QlooClient(
      "test-key",
      "https://example.test",
      new MemoryCache(),
      fetchImpl,
    ),
    calls,
  };
}

const offer = {
  artist: "Act One",
  city: "Denver, CO",
  capacity: 300,
  ticketPrice: 30,
  guarantee: 2000,
  venueCost: 0,
  productionCost: 0,
  marketingBudget: 0,
};

describe("gatherEvidence (live path, fake fetch)", () => {
  it("checks the nearby metro only when the primary reads weak, and records the comparison", async () => {
    const { client, calls } = fakeQloo({
      heatCells: {
        "Denver, CO": [0.1, 0.2, 0.15, 0.2, 0.1, 0.2],
        "Salt Lake City, UT": [0.95, 0.97, 0.96, 0.98, 0.95, 0.97],
      },
    });
    const ev = await gatherEvidence(client, offer);
    expect(ev.localAffinity?.label).toBe("low");
    expect(ev.altMarket?.city).toBe("Salt Lake City, UT");
    expect(ev.altMarket?.localAffinity?.label).toBe("strong");
    // compare explains the top opener, not the act against itself
    expect(ev.openerSharedTags).toEqual(["indie rock", "shoegaze"]);
    expect(
      calls.some(
        (c) =>
          c.startsWith("/v2/analysis/compare") &&
          c.includes("b.signal.interests.entities=X"),
      ),
    ).toBe(true);
    expect(ev.trace.every((t) => t.ok)).toBe(true);
  });

  it("does not spend calls on an alternative when the primary market is fine", async () => {
    const { client, calls } = fakeQloo({
      heatCells: { "Denver, CO": [0.95, 0.97, 0.96, 0.98, 0.95, 0.97] },
    });
    const ev = await gatherEvidence(client, offer);
    expect(ev.altMarket).toBeNull();
    expect(calls.some((c) => c.includes("Salt+Lake+City"))).toBe(false);
  });

  it("refuses Qloo's nearest match when the name is a different act", async () => {
    const { client, calls } = fakeQloo({
      heatCells: {},
      resolve: "near-miss",
    });
    const ev = await gatherEvidence(client, offer);
    expect(ev.entity).toBeNull();
    const flag = ev.coverage.find((c) => c.code === "ENTITY_UNRESOLVED");
    expect(flag?.detail).toContain("Act Won Collective");
    expect(calls).toHaveLength(1);
  });

  it("keeps style tags and drops ethnicity and payment tags", async () => {
    const { client } = fakeQloo({
      heatCells: { "Denver, CO": [0.95, 0.97, 0.96, 0.98, 0.95, 0.97] },
    });
    const ev = await gatherEvidence(client, offer);
    expect(ev.tasteTags).toEqual(["indie rock"]);
  });

  it("reports a failed heatmap call as failed, not as a weak market", async () => {
    const { client } = fakeQloo({ heatCells: {}, heatStatus: 500 });
    const ev = await gatherEvidence(client, offer);
    expect(ev.localAffinity).toBeNull();
    expect(ev.coverage.map((c) => c.code)).toContain("HEATMAP_FAILED");
    expect(ev.coverage.map((c) => c.code)).not.toContain("HEATMAP_SPARSE");
  });

  it("retries a rate-limited call instead of reporting missing evidence", async () => {
    const { client } = fakeQloo({
      heatCells: { "Denver, CO": [0.95, 0.97, 0.96, 0.98, 0.95, 0.97] },
      rateLimitFirst: 2,
    });
    const ev = await gatherEvidence(client, offer);
    expect(ev.entity?.name).toBe("Act One");
    expect(ev.trace[0].retries).toBe(2);
    expect(ev.trace[0].status).toBe(200);
  });

  it("stops after an unresolved act and flags it", async () => {
    const { client, calls } = fakeQloo({ heatCells: {}, resolve: false });
    const ev = await gatherEvidence(client, offer);
    expect(ev.entity).toBeNull();
    expect(ev.coverage.map((c) => c.code)).toEqual(["ENTITY_UNRESOLVED"]);
    expect(calls).toHaveLength(1);
  });

  it("marks a sparse heatmap instead of inventing affinity", async () => {
    const { client } = fakeQloo({ heatCells: { "Denver, CO": [0.9, 0.9] } });
    const ev = await gatherEvidence(client, offer);
    expect(ev.localAffinity).toBeNull();
    expect(ev.coverage.find((c) => c.code === "HEATMAP_SPARSE")?.ok).toBe(
      false,
    );
  });
});
