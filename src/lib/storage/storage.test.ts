import { describe, expect, it } from "vitest";
import { parseOfferLine } from "@/lib/deal/offer-parser";
import { SAMPLE_OFFERS, sampleEvidence } from "@/lib/qloo/sample";
import { decide } from "@/lib/verdict/verdict";
import { MemoryCheckStore, newId, offerLine, RestCheckStore } from "./index";

const fixture = () => {
  const p = parseOfferLine(SAMPLE_OFFERS[0].line);
  if (!p.ok) throw new Error("fixture");
  return {
    mode: "sample" as const,
    offer: p.offer,
    verdict: decide(p.offer, sampleEvidence(p.offer)),
  };
};

describe("check store", () => {
  it("memory store round-trips a verdict under an unguessable id", async () => {
    const store = new MemoryCheckStore();
    const saved = await store.put(fixture());
    expect(saved.id).toHaveLength(12);
    expect((await store.get(saved.id))?.verdict.status).toBe("cleared");
    expect(await store.get("nope")).toBeNull();
  });

  it("rest store writes with the service key and reads back only undeleted rows", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    let stored: Record<string, unknown> | null = null;
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      calls.push({ url, init });
      if (init?.method === "POST") {
        stored = JSON.parse(String(init.body));
        return new Response(
          JSON.stringify([
            { ...stored, created_at: "2026-10-17T00:00:00Z", deleted_at: null },
          ]),
          { status: 201 },
        );
      }
      return new Response(
        JSON.stringify(
          url.includes("id=eq.missing")
            ? []
            : [
                {
                  ...stored,
                  created_at: "2026-10-17T00:00:00Z",
                  deleted_at: null,
                },
              ],
        ),
        { status: 200 },
      );
    };
    const store = new RestCheckStore(
      "https://api.test",
      "service-key",
      fetchImpl,
    );
    const saved = await store.put(fixture());
    expect(calls[0].url).toBe("https://api.test/rest/v1/shared_checks");
    expect(
      (calls[0].init?.headers as Record<string, string>).Authorization,
    ).toBe("Bearer service-key");
    expect(saved.offer.artist).toBe("Sample Indie Band");
    const read = await store.get(saved.id);
    expect(calls[1].url).toContain("deleted_at=is.null");
    expect(read?.verdict.status).toBe("cleared");
    expect(await store.get("missing")).toBeNull();
  });

  it("renders a share-ready offer line and distinct ids", () => {
    expect(offerLine(fixture().offer)).toBe(
      "Sample Indie Band · Austin, TX · 300 cap · $28 ticket · $2,000 guarantee + $900 room",
    );
    expect(new Set(Array.from({ length: 200 }, newId)).size).toBe(200);
  });
});
