export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];
export const THEME_COOKIE = "headliner-theme";

export function parseTheme(value: unknown): Theme {
  return THEMES.includes(value as Theme) ? (value as Theme) : "light";
}

/** The attribute the stylesheet keys on. "system" leaves it to the OS via a tiny inline-free check in the layout. */
export function themeAttribute(theme: Theme): "dark" | "light" | undefined {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  return undefined;
}
