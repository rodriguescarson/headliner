import { describe, expect, it } from "vitest";
import { parseOfferLine } from "@/lib/deal/offer-parser";
import { SAMPLE_OFFERS, sampleEvidence } from "@/lib/qloo/sample";
import { decide } from "@/lib/verdict/verdict";
import { MemoryCheckStore, newId } from "./index";

describe("check store", () => {
  it("round-trips a verdict under an unguessable id", async () => {
    const p = parseOfferLine(SAMPLE_OFFERS[0].line);
    if (!p.ok) throw new Error("fixture");
    const store = new MemoryCheckStore();
    const saved = await store.put({
      mode: "sample",
      offer: p.offer,
      verdict: decide(p.offer, sampleEvidence(p.offer)),
    });
    expect(saved.id).toHaveLength(12);
    expect((await store.get(saved.id))?.verdict.status).toBe("cleared");
    expect(await store.get("nope")).toBeNull();
  });

  it("generates distinct ids", () => {
    expect(new Set(Array.from({ length: 200 }, newId)).size).toBe(200);
  });
});
