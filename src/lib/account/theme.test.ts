import { describe, expect, it } from "vitest";
import { parseTheme, themeClass } from "./theme";

describe("theme", () => {
  it("parses known values and falls back to system", () => {
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("system")).toBe("system");
    expect(parseTheme("neon")).toBe("system");
    expect(parseTheme(undefined)).toBe("system");
  });
  it("maps a theme to the html class", () => {
    expect(themeClass("dark")).toBe("dark");
    expect(themeClass("light")).toBe("light");
    expect(themeClass("system")).toBeUndefined();
  });
});
