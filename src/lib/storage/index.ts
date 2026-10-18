/**
 * Durable storage for shared checks. The interface is the contract. In production the store is the
 * headliner Supabase stack's PostgREST, called server-side with the service role key (RLS is on and
 * there is no anon policy, so nothing is readable without the server). Without those env vars the
 * in-memory store serves development.
 */
import { randomBytes } from "node:crypto";
import type { CheckResponse } from "@/lib/check";
import type { Offer } from "@/lib/deal/offer-parser";
import type { Verdict } from "@/lib/verdict/verdict";

export type SharedCheck = {
  id: string;
  createdAt: string;
  mode: "live" | "sample";
  offer: Offer;
  verdict: Verdict;
  userId?: string | null;
};

export interface CheckStore {
  put(check: Omit<SharedCheck, "id" | "createdAt">): Promise<SharedCheck>;
  get(id: string): Promise<SharedCheck | null>;
}

export class MemoryCheckStore implements CheckStore {
  private map = new Map<string, SharedCheck>();
  async put(check: Omit<SharedCheck, "id" | "createdAt">) {
    const saved: SharedCheck = {
      ...check,
      id: newId(),
      createdAt: new Date().toISOString(),
    };
    this.map.set(saved.id, saved);
    return saved;
  }
  async get(id: string) {
    return this.map.get(id) ?? null;
  }
}

type Row = {
  id: string;
  created_at: string;
  mode: "live" | "sample";
  offer_line: string;
  payload: { offer: Offer; verdict: Verdict };
  deleted_at: string | null;
};

/** PostgREST-backed store. Soft delete via deleted_at; a deleted row reads as absent. */
export class RestCheckStore implements CheckStore {
  constructor(
    private readonly baseUrl: string,
    private readonly serviceKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}
  private headers(extra: Record<string, string> = {}) {
    return {
      apikey: this.serviceKey,
      Authorization: `Bearer ${this.serviceKey}`,
      "Content-Type": "application/json",
      ...extra,
    };
  }
  async put(check: Omit<SharedCheck, "id" | "createdAt">) {
    const row = {
      id: newId(),
      user_id: check.userId ?? null,
      mode: check.mode,
      offer_line: offerLine(check.offer),
      payload: { offer: check.offer, verdict: check.verdict },
    };
    const res = await this.fetchImpl(`${this.baseUrl}/rest/v1/shared_checks`, {
      method: "POST",
      headers: this.headers({ Prefer: "return=representation" }),
      body: JSON.stringify(row),
    });
    if (!res.ok) throw new Error(`share store write failed: ${res.status}`);
    const [saved] = (await res.json()) as Row[];
    return {
      id: saved.id,
      createdAt: saved.created_at,
      mode: saved.mode,
      offer: saved.payload.offer,
      verdict: saved.payload.verdict,
    };
  }
  async get(id: string) {
    const url = `${this.baseUrl}/rest/v1/shared_checks?id=eq.${encodeURIComponent(id)}&deleted_at=is.null&select=*`;
    const res = await this.fetchImpl(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`share store read failed: ${res.status}`);
    const rows = (await res.json()) as Row[];
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      createdAt: r.created_at,
      mode: r.mode,
      offer: r.payload.offer,
      verdict: r.payload.verdict,
    };
  }
}

export function offerLine(o: Offer): string {
  const money = (n: number) => `$${n.toLocaleString("en-US")}`;
  const parts = [
    o.artist,
    o.city,
    `${o.capacity} cap`,
    `${money(o.ticketPrice)} ticket`,
    `${money(o.guarantee)} guarantee`,
  ];
  if (o.venueCost) parts[parts.length - 1] += ` + ${money(o.venueCost)} room`;
  return parts.join(" · ");
}

export function toShared(
  result: CheckResponse,
): Omit<SharedCheck, "id" | "createdAt"> | null {
  if (!result.ok) return null;
  return { mode: result.mode, offer: result.offer, verdict: result.verdict };
}

/** URL-safe, unguessable, short enough to read aloud on a phone call. */
export function newId() {
  return randomBytes(9).toString("base64url");
}

// One instance per process. Next bundles route handlers and pages separately, so a module-level variable
// would give each its own in-memory store and a share made by the API would 404 on the page.
const holder = globalThis as typeof globalThis & {
  __headlinerCheckStore?: CheckStore;
};

export function checkStore(): CheckStore {
  if (!holder.__headlinerCheckStore) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    holder.__headlinerCheckStore =
      url && key ? new RestCheckStore(url, key) : new MemoryCheckStore();
  }
  return holder.__headlinerCheckStore;
}
export const shareStoreIsDurable = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
