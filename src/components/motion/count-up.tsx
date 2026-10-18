"use client";

import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import { money } from "@/lib/deal/deal-math";
import { usePrefersReducedMotion } from "./reduced-motion";

/**
 * Named formats, not functions: this component is rendered from server components (the share page), and a
 * function prop cannot cross the server/client boundary.
 */
export type CountFormat = "integer" | "money" | "fixed2";

const FORMATS: Record<CountFormat, (n: number) => string> = {
  integer: (n) => String(Math.round(n)),
  money: (n) => money(Math.round(n)),
  fixed2: (n) => n.toFixed(2),
};

/** A reading that counts up to its value once. The final text is always exact. */
export function CountUp({
  value,
  format,
  duration = 0.7,
}: {
  value: number;
  format: CountFormat;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  const fmt = FORMATS[format];
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced || !Number.isFinite(value) || document.hidden) {
      el.textContent = fmt(value);
      return;
    }
    const state = { n: 0 };
    const tween = gsap.to(state, {
      n: value,
      duration,
      ease: "expo.out",
      onUpdate: () => {
        el.textContent = fmt(state.n);
      },
      onComplete: () => {
        el.textContent = fmt(value);
      },
    });
    // Animation frames pause in background tabs; never leave a half-counted figure on screen.
    const settle = window.setTimeout(
      () => {
        tween.kill();
        el.textContent = fmt(value);
      },
      duration * 1000 + 150,
    );
    return () => {
      window.clearTimeout(settle);
      tween.kill();
    };
  }, [value, fmt, duration, reduced]);
  return <span ref={ref}>{fmt(value)}</span>;
}
