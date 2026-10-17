/**
 * Console primitives. Every control on the desk is drawn in this grammar: plates on the rail, cream glass
 * faces, engraved legends, lamps for state. Icons come from lucide at one stroke weight; meters and lamps are
 * authored SVG.
 */
import { type ReactNode, useId } from "react";
import { STATUS_TONE, type VerdictStatus } from "@/lib/enums";

/** Four screws bolt every module to the rail; the same treatment on every module, or none. */
export function Screws() {
  return (
    <>
      <span aria-hidden className="screw absolute left-2 top-2" />
      <span aria-hidden className="screw absolute right-2 top-2" />
      <span aria-hidden className="screw absolute bottom-2 left-2" />
      <span aria-hidden className="screw absolute bottom-2 right-2" />
    </>
  );
}

export function Plate({
  legend,
  children,
  className = "",
}: {
  legend?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`plate relative p-5 md:p-6 ${className}`}>
      <Screws />
      {legend && <h2 className="legend mb-3">{legend}</h2>}
      {children}
    </section>
  );
}

export function Legend({
  children,
  onGlass = false,
}: {
  children: ReactNode;
  onGlass?: boolean;
}) {
  return (
    <span className={`legend ${onGlass ? "legend-glass" : ""}`}>
      {children}
    </span>
  );
}

const toneVar: Record<"green" | "amber" | "red" | "blue" | "off", string> = {
  green: "var(--cap-green)",
  amber: "var(--cap-amber)",
  red: "var(--cap-red)",
  blue: "var(--cap-blue)",
  off: "var(--rail)",
};

/** A panel lamp. Lit lamps carry the verdict; text beside them always says it too. */
export function Lamp({
  tone,
  label,
  lit = true,
  size = 14,
}: {
  tone: "green" | "amber" | "red" | "blue" | "off";
  label?: string;
  lit?: boolean;
  size?: number;
}) {
  const color = lit ? toneVar[tone] : toneVar.off;
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        aria-hidden="true"
        className={lit ? "lamp-on origin-center" : "origin-center"}
      >
        <circle cx="8" cy="8" r="7.5" fill="var(--panel-deep)" />
        <circle cx="8" cy="8" r="5.5" fill={color} />
        {lit && (
          <circle cx="6.2" cy="6" r="1.6" fill="rgba(255,255,255,0.55)" />
        )}
      </svg>
      {label && <span className="legend">{label}</span>}
    </span>
  );
}

export function VerdictLamp({
  status,
  label,
  size = 18,
}: {
  status: VerdictStatus;
  label?: string;
  size?: number;
}) {
  return <Lamp tone={STATUS_TONE[status]} label={label} size={size} />;
}

export type MeterZone = {
  from: number;
  to: number;
  tone: "green" | "amber" | "red";
};

/**
 * A VU-style meter. `value` is 0..1 of the arc; zones colour the scale; the needle settles with one eased swing.
 * `reading` is the number printed under the pivot, always the real figure.
 */
export function Meter({
  legend,
  value,
  reading,
  sub,
  zones,
  ticks = [0, 0.25, 0.5, 0.75, 1],
  tickLabels,
  muted = false,
  mutedText,
}: {
  legend: string;
  value: number | null;
  reading: ReactNode;
  sub?: string;
  zones: MeterZone[];
  ticks?: number[];
  tickLabels?: string[];
  muted?: boolean;
  mutedText?: string;
}) {
  const cx = 120;
  const cy = 118;
  const r = 92;
  const angle = (v: number) => -60 + 120 * Math.max(0, Math.min(1, v));
  const polar = (v: number, rad: number) => {
    const a = ((angle(v) - 90) * Math.PI) / 180;
    return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)] as const;
  };
  const arc = (from: number, to: number, rad: number) => {
    const [x1, y1] = polar(from, rad);
    const [x2, y2] = polar(to, rad);
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${rad} ${rad} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };
  const needleAngle = value === null ? -60 : angle(value);
  const glassId = useId();
  const zoneColor = {
    green: "var(--cap-green)",
    amber: "var(--cap-amber)",
    red: "var(--cap-red)",
  };
  return (
    <figure className="glass relative px-5 pt-4 pb-5">
      <Screws />
      <figcaption className="legend legend-glass">{legend}</figcaption>
      <svg
        viewBox="0 0 240 150"
        className="mt-1 w-full"
        role="img"
        aria-label={legend}
      >
        <title>{legend}</title>
        {/* scale arc */}
        <path
          d={arc(0, 1, r)}
          fill="none"
          stroke="#4a4335"
          strokeWidth="1.5"
          opacity={muted ? 0.35 : 1}
        />
        {zones.map((z) => (
          <path
            key={`${z.from}-${z.to}`}
            d={arc(z.from, z.to, r - 7)}
            fill="none"
            stroke={zoneColor[z.tone]}
            strokeWidth="5"
            strokeLinecap="butt"
            opacity={muted ? 0.3 : 0.9}
          />
        ))}
        {ticks.map((tk, i) => {
          const [x1, y1] = polar(tk, r);
          const [x2, y2] = polar(tk, r - 12);
          const [lx, ly] = polar(tk, r + 12);
          return (
            <g key={tk} opacity={muted ? 0.4 : 1}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#15181b"
                strokeWidth="1.5"
              />
              {tickLabels?.[i] && (
                <text
                  x={lx}
                  y={ly + 3}
                  fontSize="9"
                  textAnchor="middle"
                  fill="#4a4335"
                  fontFamily="var(--font-barlow-condensed)"
                >
                  {tickLabels[i]}
                </text>
              )}
            </g>
          );
        })}
        {/* needle */}
        {!muted && (
          <g
            className="needle"
            transform={`rotate(${needleAngle.toFixed(2)} ${cx} ${cy})`}
          >
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - r + 4}
              stroke="#15181b"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - r + 4}
              stroke="var(--cap-red)"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
          </g>
        )}
        <circle cx={cx} cy={cy} r="7" fill="#15181b" />
        <circle cx={cx} cy={cy} r="3" fill="#f3e9d2" />
        {/* glass: an inner vignette and one specular sweep, clipped to the face */}
        <defs>
          <clipPath id={`${glassId}-clip`}>
            <rect x="0" y="0" width="240" height="150" rx="6" />
          </clipPath>
          <radialGradient id={`${glassId}-vignette`} cx="50%" cy="60%" r="70%">
            <stop offset="55%" stopColor="#4a4335" stopOpacity="0" />
            <stop offset="100%" stopColor="#4a4335" stopOpacity="0.18" />
          </radialGradient>
          <linearGradient id={`${glassId}-sweep`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
            <stop offset="38%" stopColor="#ffffff" stopOpacity="0.06" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g clipPath={`url(#${glassId}-clip)`} pointerEvents="none">
          <rect
            x="0"
            y="0"
            width="240"
            height="150"
            fill={`url(#${glassId}-vignette)`}
          />
          <path
            d="M -20 -10 L 150 -10 L 40 170 L -20 170 Z"
            fill={`url(#${glassId}-sweep)`}
          />
        </g>
      </svg>
      <div className="mt-1 flex items-baseline justify-between gap-3">
        <span className="font-display text-2xl font-bold leading-none text-[#15181b]">
          {muted ? (mutedText ?? "—") : reading}
        </span>
        {sub && !muted && <span className="legend legend-glass">{sub}</span>}
      </div>
    </figure>
  );
}

/** A patch point: one fix, with its jack and its candidates. */
export function PatchPoint({
  tone,
  title,
  children,
}: {
  tone: "green" | "amber" | "red" | "blue";
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="plate relative p-5">
      <Screws />
      <div className="flex items-center gap-2">
        <Lamp tone={tone} size={12} />
        <h3 className="font-display text-base font-semibold">{title}</h3>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

/** Engraved stencil: a fixed list, no needle, no numbers. */
export function Stencil({
  legend,
  items,
}: {
  legend: string;
  items: string[];
}) {
  return (
    <section className="on-ground py-2">
      <h2 className="legend mb-2">{legend}</h2>
      <ul className="grid gap-1 text-ink">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2">
            <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-legend" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
