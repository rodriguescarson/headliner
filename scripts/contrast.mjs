// WCAG contrast check for the console palette. Run: node scripts/contrast.mjs
const hex = (h) =>
  h
    .replace("#", "")
    .match(/.{2}/g)
    .map((x) => parseInt(x, 16) / 255);
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const L = (h) => {
  const [r, g, b] = hex(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [L(a), L(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const pairs = [
  // light scene
  ["ink on ground", "#15181b", "#8a97a5"],
  ["ink on plate", "#15181b", "#e6ebf0"],
  ["legend on plate", "#3f4a55", "#e6ebf0"],
  ["white header ink on deep panel", "#f1f4f7", "#4f5f70"],
  ["lamp blue link on ground", "#15181b", "#8a97a5"],
  ["ink on meter glass", "#15181b", "#f3e9d2"],
  ["legend (secondary) on panel", "#3f4a55", "#dfe4e9"],
  ["legend on glass", "#4a4335", "#f3e9d2"],
  ["red lamp text on panel", "#b3202f", "#dfe4e9"],
  ["green lamp text on panel", "#176a3c", "#dfe4e9"],
  ["amber lamp text on panel", "#8a5a00", "#dfe4e9"],
  ["blue (calm) on panel", "#2d5aa6", "#dfe4e9"],
  ["white on accent button", "#ffffff", "#2d5aa6"],
  ["ink on primary button", "#15181b", "#e0a526"],
  ["placeholder on glass", "#5e5848", "#f3e9d2"],
  ["placeholder on dark glass", "#5e5848", "#e9dfc8"],
  // dark scene
  ["cream ink on dark panel", "#eef0f2", "#1b2026"],
  ["secondary on dark panel", "#b7c0c9", "#1b2026"],
  ["red on dark", "#ff7b86", "#1b2026"],
  ["green on dark", "#6ed19a", "#1b2026"],
  ["amber on dark", "#f2c35c", "#1b2026"],
  ["blue on dark", "#8fb4f0", "#1b2026"],
  ["ink on dark glass", "#15181b", "#e9dfc8"],
];
for (const [name, fg, bg] of pairs) {
  const r = ratio(fg, bg);
  console.log(
    `${r >= 4.5 ? "AA  " : r >= 3 ? "LG  " : "FAIL"} ${r.toFixed(2)}  ${name}  ${fg} on ${bg}`,
  );
}
