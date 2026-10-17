"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./reduced-motion";

type VantaInstance = {
  destroy: () => void;
  setOptions?: (o: Record<string, unknown>) => void;
};

/**
 * A routing net behind the hero: Vanta NET drawn in the console's own inks, dots like pins on the agent's wall
 * map. Loaded lazily on the client, transparent over the rail grid, destroyed on unmount, absent under reduced
 * motion. It is backdrop, never content: the strip plate above it carries the task.
 */
export function HeroBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced || !ref.current) return;
    let instance: VantaInstance | null = null;
    let cancelled = false;
    (async () => {
      const [{ default: NET }, THREE] = await Promise.all([
        import("vanta/dist/vanta.net.min"),
        import("three"),
      ]);
      if (cancelled || !ref.current) return;
      const styles = getComputedStyle(document.documentElement);
      const hex = (name: string, fallback: number) => {
        const v = styles.getPropertyValue(name).trim();
        return /^#[0-9a-f]{6}$/i.test(v)
          ? Number.parseInt(v.slice(1), 16)
          : fallback;
      };
      instance = NET({
        el: ref.current,
        THREE,
        mouseControls: true,
        touchControls: false,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        scale: 1,
        scaleMobile: 1,
        color: hex("--panel-deep-ink", 0xf1f4f7),
        backgroundColor: hex("--panel", 0x8a97a5),
        backgroundAlpha: 0,
        points: 9,
        maxDistance: 22,
        spacing: 18,
        showDots: true,
      }) as VantaInstance;
    })();
    return () => {
      cancelled = true;
      instance?.destroy();
    };
  }, [reduced]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 opacity-60 [&_canvas]:!opacity-100"
    />
  );
}
