"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type ReactNode, useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "./reduced-motion";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll-triggered reveal for reading sections: children rise into place once, from an already-visible 80%
 * opacity, with an exponential ease-out. Nothing is hidden before the trigger, so a missed trigger costs nothing.
 */
export function Reveal({
  children,
  stagger = 0.08,
  className = "",
}: {
  children: ReactNode;
  stagger?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (reduced || !ref.current) return;
    const items = Array.from(ref.current.children);
    const ctx = gsap.context(() => {
      gsap.from(items, {
        y: 18,
        opacity: 0.8,
        duration: 0.7,
        ease: "expo.out",
        stagger,
        scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
      });
    }, ref);
    return () => ctx.revert();
  }, [reduced, stagger]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Flip a board row's state cell into place the moment it lands, like a split-flap settling. */
export function useFlipIn(deps: unknown[]) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (reduced || !ref.current) return;
    const tween = gsap.from(ref.current, {
      rotateX: -70,
      opacity: 0.4,
      duration: 0.45,
      ease: "expo.out",
      transformOrigin: "50% 0%",
    });
    return () => {
      tween.kill();
    };
  }, [reduced, ...deps]);
  return ref;
}
