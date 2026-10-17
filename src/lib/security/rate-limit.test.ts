import { beforeEach, describe, expect, it } from "vitest";
import { clientKey, rateLimit, resetRateLimits } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => resetRateLimits());

  it("allows up to the limit in a window and blocks after", () => {
    const t = 1_000_000;
    expect(rateLimit("k", 2, 60_000, t).allowed).toBe(true);
    expect(rateLimit("k", 2, 60_000, t + 1).allowed).toBe(true);
    const third = rateLimit("k", 2, 60_000, t + 2);
    expect(third.allowed).toBe(false);
    expect(third.resetInSeconds).toBeGreaterThan(0);
  });

  it("resets after the window", () => {
    const t = 1_000_000;
    rateLimit("k", 1, 1000, t);
    expect(rateLimit("k", 1, 1000, t + 500).allowed).toBe(false);
    expect(rateLimit("k", 1, 1000, t + 1001).allowed).toBe(true);
  });

  it("hashes the client address and scopes it", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });
    const k = clientKey(req, "check");
    expect(k.startsWith("check:")).toBe(true);
    expect(k).not.toContain("203.0.113.5");
    expect(clientKey(req, "suite")).not.toBe(k);
  });
});
