import { describe, expect, it } from "vitest";
import { parseTheme, themeAttribute } from "./theme";

describe("theme", () => {
  it("falls back to light for anything unknown", () => {
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("system")).toBe("system");
    expect(parseTheme("neon")).toBe("light");
    expect(parseTheme(undefined)).toBe("light");
  });
  it("maps system to no attribute so the OS decides", () => {
    expect(themeAttribute("system")).toBeUndefined();
    expect(themeAttribute("dark")).toBe("dark");
  });
});
