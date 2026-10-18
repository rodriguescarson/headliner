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
  resolve?: boolean;
}) {
  const calls: string[] = [];
  const fetchImpl: typeof fetch = async (input) => {
    const url = new URL(String(input));
    calls.push(`${url.pathname}?${url.searchParams.toString()}`);
    const q = url.searchParams;
    const json = (body: unknown) =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    if (url.pathname === "/search") {
      return json({
        results:
          opts.resolve === false
            ? []
            : [
                {
                  entity_id: "E1",
                  name: "Act One",
                  type: "urn:entity:artist",
                  popularity: 0.7,
                },
              ],
      });
    }
    if (url.pathname === "/v2/analysis/compare")
      return json({
        results: { entities: [{ name: "indie rock" }, { name: "shoegaze" }] },
      });
    const type = q.get("filter.type");
    if (type === ENTITY.heatmap) {
      const city = q.get("filter.location.query") ?? "";
      const cells = opts.heatCells[city] ?? [];
      return json({
        results: {
          heatmap: cells.map((a) => ({ location: {}, query: { affinity: a } })),
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
      return json({ results: { entities: [{ name: "indie rock" }] } });
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
        "Salt Lake City, UT": [0.6, 0.7, 0.65, 0.7, 0.6, 0.7],
      },
    });
    const ev = await gatherEvidence(client, offer);
    expect(ev.localAffinity?.label).toBe("low");
    expect(ev.altMarket?.city).toBe("Salt Lake City, UT");
    expect(ev.altMarket?.localAffinity?.label).toBe("strong");
    expect(ev.altMarket?.sharedTags).toContain("indie rock");
    expect(calls.some((c) => c.startsWith("/v2/analysis/compare"))).toBe(true);
    expect(ev.trace.every((t) => t.ok)).toBe(true);
  });

  it("does not spend calls on an alternative when the primary market is fine", async () => {
    const { client, calls } = fakeQloo({
      heatCells: { "Denver, CO": [0.7, 0.8, 0.75, 0.7, 0.8, 0.9] },
    });
    const ev = await gatherEvidence(client, offer);
    expect(ev.altMarket).toBeNull();
    expect(calls.some((c) => c.startsWith("/v2/analysis/compare"))).toBe(false);
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
