import { afterEach, describe, expect, it } from "vitest";
import { publicOrigin } from "./public-origin";

const KEY = "NEXT_PUBLIC_APP_URL";
const saved = process.env[KEY];

describe("publicOrigin", () => {
  afterEach(() => {
    if (saved === undefined) delete process.env[KEY];
    else process.env[KEY] = saved;
  });

  it("uses the configured app URL, never the container's bind address", () => {
    process.env[KEY] = "https://headliner.example.com/";
    const req = new Request("https://0.0.0.0:3000/auth/callback?code=x");
    expect(publicOrigin(req)).toBe("https://headliner.example.com");
  });

  it("falls back to the proxy's forwarded host and scheme", () => {
    delete process.env[KEY];
    const req = new Request("http://0.0.0.0:3000/auth/callback", {
      headers: {
        "x-forwarded-host": "headliner.example.com",
        "x-forwarded-proto": "https",
      },
    });
    expect(publicOrigin(req)).toBe("https://headliner.example.com");
  });

  it("uses the Host header when no forwarded host is set", () => {
    delete process.env[KEY];
    const req = new Request("http://0.0.0.0:3000/", {
      headers: { host: "localhost:3011" },
    });
    expect(publicOrigin(req)).toBe("http://localhost:3011");
  });

  it("ignores a malformed configured URL", () => {
    process.env[KEY] = "not a url";
    const req = new Request("http://localhost:3011/");
    expect(publicOrigin(req)).toBe("http://localhost:3011");
  });
});
