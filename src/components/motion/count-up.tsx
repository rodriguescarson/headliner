"use client";

import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./reduced-motion";

/** A reading that counts up to its value once, in step with the needle swing. The final text is always exact. */
export function CountUp({
  value,
  format,
  duration = 0.7,
}: {
  value: number;
  format: (n: number) => string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced || !Number.isFinite(value)) {
      el.textContent = format(value);
      return;
    }
    const state = { n: 0 };
    const tween = gsap.to(state, {
      n: value,
      duration,
      ease: "expo.out",
      onUpdate: () => {
        el.textContent = format(state.n);
      },
      onComplete: () => {
        el.textContent = format(value);
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, format, duration, reduced]);
  return <span ref={ref}>{format(value)}</span>;
}
