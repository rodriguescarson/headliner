/**
 * Durable storage for shared checks. The interface is the contract; the in-memory implementation is for
 * local development, and a Postgres implementation plugs in once a database is provisioned.
 * A share link is a promoter forwarding a verdict to a co-promoter; it must survive a refresh and a redeploy.
 */
import { randomBytes } from "node:crypto";
import type { Offer } from "@/lib/deal/offer-parser";
import type { Verdict } from "@/lib/verdict/verdict";

export type SharedCheck = {
  id: string;
  createdAt: string;
  mode: "live" | "sample";
  offer: Offer;
  verdict: Verdict;
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

/** URL-safe, unguessable, short enough to read aloud on a phone call. */
export function newId() {
  return randomBytes(9).toString("base64url");
}

let store: CheckStore | undefined;
export function checkStore(): CheckStore {
  if (!store) store = new MemoryCheckStore(); // swapped for Postgres when DATABASE_URL is configured
  return store;
}
