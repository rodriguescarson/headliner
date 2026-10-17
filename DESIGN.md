---
name: Headliner
description: Headliner on shadcn/ui. Standard components, a neutral palette, Geist, and colour reserved for the four verdict states.
colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  card: "oklch(1 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  border: "oklch(0.922 0 0)"
  primary: "oklch(0.205 0 0)"
  primary-foreground: "oklch(0.985 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
  success: "oklch(0.627 0.17 149)"
  warning: "oklch(0.769 0.165 70)"
  info: "oklch(0.623 0.19 260)"
typography:
  body:
    fontFamily: "Geist, sans-serif"
    fontSize: "0.875rem"
    lineHeight: "1.25rem"
  heading:
    fontFamily: "Geist, sans-serif"
    fontWeight: 600
    letterSpacing: "-0.025em"
  reading:
    fontFamily: "Geist, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    fontVariantNumeric: "tabular-nums"
  mono:
    fontFamily: "Geist Mono, monospace"
rounded:
  radius: "0.625rem"
  card: "0.75rem"
  control: "0.5rem"
  badge: "9999px"
---

# Design System: Headliner

<!-- Recorded 2026-10-17 after the owner replaced the bespoke console with shadcn/ui ("use standard ui libraries"). Recorded from the built code: src/app/globals.css, src/components/ui/*, src/components/status.tsx and siblings. -->

## Overview

Headliner is built on shadcn/ui, style `base-nova`, on Base UI primitives, with the neutral base colour. The components under `src/components/ui/` are owned source added with the CLI and left as generated; everything product-specific composes them. The choice is deliberate: a promoter reading an offer at night, and a judge with sixty seconds, both already know what a card, a badge, a table and a destructive dialog mean. The interface spends no attention on its own look.

Hierarchy comes from the standard ladder, not from metaphor: card titles at 1rem semibold, one reading per card at 1.875rem semibold with tabular figures, descriptions and secondary facts in `muted-foreground`, numbers and identifiers in Geist Mono. Colour is reserved for state. The four status tones (`success`, `warning`, `destructive`, `info`) map one-to-one onto the four verdict statuses in `src/lib/enums.ts` (`cleared`, `fix_required`, `refused`, `abstained`), and are always paired with a text label through `StatusBadge` or `Dot` in `src/components/status.tsx`; nothing is coloured for decoration, and the primary button is the neutral near-black.

Light is the default; the `.dark` class switches every token, the OS preference does the same for visitors who have not chosen, and the account settings page records a choice in a cookie. Motion is small and functional (count-up readings, a scroll reveal on fixes, board rows flipping in) and is off under `prefers-reduced-motion`.

## Rules

- Reach for the shadcn component before writing markup: `Card` for any grouped content, `Table` for rows, `Badge` for status, `Alert` for errors, `AlertDialog` for destructive confirmation, `Label`/`Input`/`Textarea`/`Checkbox`/`RadioGroup` for forms, `Skeleton` for loading.
- Tokens only (`bg-background`, `text-muted-foreground`, `border-border`, `bg-success`); no palette classes or hex values in product components.
- One density: comfortable (`gap-4` / `p-6` / `text-sm`). Card radius 0.75rem, control radius 0.5rem.
- Numbers, ids, parameters and versions are `font-mono tabular-nums`.
- Status is never colour alone: every dot and badge carries its label.
- No decorative gradients, glass, textures, or icon-per-heading scaffolding. Lucide icons only where a control needs one, at `size-4`.

## Status mapping

| Verdict | Tone | Component |
|---|---|---|
| cleared | success | `StatusBadge` |
| fix_required | warning | `StatusBadge` |
| refused | destructive | `StatusBadge` |
| abstained | info | `StatusBadge` |
| job queued / running | warning | `Dot` |
| job failed | destructive | `Dot` |
| not run | muted | `Dot` |

## Pages

Every page sits in `Shell` (`src/components/shell.tsx`): full-width main, one centred column at `max-w-7xl` (wide), `max-w-2xl` (medium) or `max-w-md` (narrow), 16px gutters on phones. Reading pages (terms, privacy, cookies, support) use `Prose` at a 72ch measure.
