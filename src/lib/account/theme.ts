export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];
export const THEME_COOKIE = "headliner-theme";

/** Unknown or missing values mean "follow the OS", which is what a visitor who never chose expects. */
export function parseTheme(value: unknown): Theme {
  return THEMES.includes(value as Theme) ? (value as Theme) : "system";
}

/** The class the stylesheet keys on. "system" sets none, so the prefers-color-scheme rule decides. */
export function themeClass(theme: Theme): "dark" | "light" | undefined {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  return undefined;
}
