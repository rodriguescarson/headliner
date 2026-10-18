"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "./reduced-motion";

/** Lenis smooth scroll on reading surfaces only. Off under reduced motion; the desk's own controls are untouched. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <ReactLenis root options={{ lerp: 0.12, duration: 1.1, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
