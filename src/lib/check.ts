import {
  type Offer,
  OfferSchema,
  parseOfferLine,
} from "@/lib/deal/offer-parser";
import { QlooClient } from "@/lib/qloo/client";
import { type CulturalEvidence, gatherEvidence } from "@/lib/qloo/evidence";
import { sampleEvidence } from "@/lib/qloo/sample";
import { decide, type Verdict } from "@/lib/verdict/verdict";

export type CheckRequest = { line?: string; offer?: unknown };
export type CheckResponse =
  | { ok: true; mode: "live" | "sample"; offer: Offer; verdict: Verdict }
  | { ok: false; error: string; missing?: string[] };

export function evidenceMode(): "live" | "sample" {
  return process.env.QLOO_API_KEY ? "live" : "sample";
}

export async function runCheck(req: CheckRequest): Promise<CheckResponse> {
  let offer: Offer;
  if (req.offer !== undefined) {
    const parsed = OfferSchema.safeParse(req.offer);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Offer fields invalid.",
        missing: parsed.error.issues.map((i) => String(i.path[0])),
      };
    }
    offer = parsed.data;
  } else if (typeof req.line === "string" && req.line.trim()) {
    const parsed = parseOfferLine(req.line);
    if (!parsed.ok)
      return {
        ok: false,
        error: "Could not read the offer line.",
        missing: parsed.missing,
      };
    offer = parsed.offer;
  } else {
    return { ok: false, error: "Provide an offer line or offer fields." };
  }

  const client = QlooClient.fromEnv();
  let evidence: CulturalEvidence;
  if (client) {
    evidence = await gatherEvidence(client, offer);
  } else {
    evidence = sampleEvidence(offer);
  }
  return {
    ok: true,
    mode: client ? "live" : "sample",
    offer,
    verdict: decide(offer, evidence),
  };
}
