import type { VerdictStatus } from "@/lib/enums";

/** Hex mirrors of the theme tokens: the image renderer cannot read CSS variables. */
export const OG = {
  size: { width: 1200, height: 630 },
  bg: "#fafafa",
  ink: "#0a0a0a",
  muted: "#525252",
  border: "#e5e5e5",
  primary: "#4338ca",
  status: {
    cleared: "#16a34a",
    fix_required: "#d97706",
    refused: "#dc2626",
    abstained: "#0284c7",
  } satisfies Record<VerdictStatus, string>,
};

export function OgMark({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle
        cx="32"
        cy="32"
        r="29"
        fill="none"
        stroke={OG.ink}
        strokeWidth="3"
      />
      <path
        d="M12 40 A22 22 0 0 1 52 40"
        fill="none"
        stroke={OG.ink}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M40.6 15.9 A22 22 0 0 1 52 40"
        fill="none"
        stroke={OG.primary}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="40"
        x2="44.5"
        y2="19.5"
        stroke={OG.ink}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="32" cy="40" r="4" fill={OG.ink} />
    </svg>
  );
}

export function OgLockup() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <OgMark />
      <span
        style={{
          fontSize: 40,
          fontWeight: 600,
          color: OG.ink,
          letterSpacing: -1,
        }}
      >
        Headliner
      </span>
    </div>
  );
}
