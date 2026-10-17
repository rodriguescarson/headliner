# Headliner

**Know whether the room makes sense before you sign the guarantee.**

An independent promoter looks at an offer sheet at 10 PM: an act, a city, a venue capacity, a ticket price and an artist guarantee. Once the hold confirms and the deposit wires, the risk is locked. Headliner checks the deal while the offer sheet is still on the desk.

Built for the [Qloo Agentic Hackathon](https://qloo.devpost.com) (Sep 30 – Oct 30, 2026). MIT licensed.

## What it does

Type the offer the way it arrives:

```
Japanese Breakfast · Austin, TX · 300 cap · $28 ticket · $3,500 guarantee + $1,200 room
```

Headliner answers with one of four statuses and shows its work:

| Status | Meaning |
|---|---|
| **Cleared** | The money works and the act has local affinity in that city. |
| **Fix required** | The money is tight or the market is weak; the smallest fix is shown (a local opener, a sponsor offset, another routing city). |
| **Refused** | The arithmetic fails a rulebook rule. Taste does not override money. |
| **Abstained** | The signal cannot be established (act unresolved, sparse heatmap). Headliner says exactly what is missing instead of guessing. |

Three things are kept strictly apart:

1. **Deterministic deal math** (`src/lib/deal/deal-math.ts`) against a versioned rulebook (`src/lib/rules/rules-v1.json`). Every dollar figure comes from here. No model touches arithmetic.
2. **Qloo cultural evidence** (`src/lib/qloo/`): entity resolution, geographic affinity heatmap, demographic skew, local openers, brand candidates, night-out places, taste tags. Every call is traced and shown. Affinity is evidence, never a ticket forecast.
3. **What the check cannot establish**: competing shows, radius clauses, actual sales, hold status, availability. Listed on every result.

## Why Qloo

Without Qloo the second column does not exist. A language model can tell you Austin likes live music; it cannot tell you whether *this* act has affinity in *this* metro, which local acts share its audience, or which brands its fans already buy. The "Without Qloo" comparison (planned, F6 in the feature register) runs the same offer through a model alone and measures the overlap.

## Running it

```bash
pnpm install
cp .env.example .env   # add QLOO_API_KEY when you have one
pnpm dev
```

Without a key the app runs in **sample mode** and says so on every screen. Sample evidence is illustrative and labelled; it is not Qloo data.

When the key arrives:

```bash
QLOO_API_KEY=... pnpm tsx scripts/verify-qloo.ts
```

This probes every endpoint with 20 real acts (including five intentionally obscure ones to exercise the abstention path), writes raw shapes to `.cache/` (git-ignored) and prints a coverage table. The numbers from that run, including the failures, are what the Devpost write-up reports.

Qloo responses are cached server-side (allowed by the hackathon terms, no time limit) and are never committed.

## Checks

```bash
pnpm lint        # Biome
pnpm typecheck   # tsc --noEmit
pnpm test        # Vitest
```

## Status

See `FEATURE-REGISTER.md` for what is built, what is pending the Qloo key, and what is deliberately out of scope.

## Support

carson@celabe.com
