# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: independent concert and comedy promoters, and self-managed touring acts, reading an offer sheet (act, city, capacity, ticket price, guarantee, room cost) at night before a hold expires. They decide alone, with a spreadsheet and a Spotify listener-city list, and lose money on misrouted mid-week shows.

Secondary (first, by Carson's choice on 2026-10-17): hackathon judges on a laptop with about sixty seconds, who must see the mechanism and the evidence without reading instructions.

## Product Purpose

Headliner checks a live-show deal while the offer sheet is still on the desk: deterministic deal math (break-even, net per ticket, sellout net) against a versioned rulebook, cultural evidence from Qloo (local affinity, demographics, local openers, brand sponsors, night-out places, taste tags, nearby-market comparison), and an explicit list of what the check cannot establish. It returns Cleared, Fix required, Refused, or Abstained, and prescribes the smallest fix. Success: a promoter changes or walks away from a bad deal before the deposit wires; a judge understands in one screen why this only works with Qloo.

## Positioning

Only product that separates money arithmetic (code, versioned rules), cultural evidence (Qloo, traced call by call), and the unknowable (named, never guessed), and that abstains out loud when the signal is missing. Affinity is evidence, never a ticket forecast.

## Operating Context

Entry is a single typed offer line or pasted terms; evening desk use on a laptop, occasional phone use. Evidence comes from the Qloo hackathon API (`hackathon.api.qloo.com`), cached server-side. Judges test from a public URL with pre-seeded real-act offers. Counterparties (venue bookers, sponsors) verify the same evidence over a read-only MCP server. A model-only "Without Qloo" baseline runs beside the check to measure overlap.

## Capabilities and Constraints

- Statuses are a closed set: cleared, fix_required, refused, abstained. Fixes: opener, sponsor, market.
- Evidence sources: live, sample (labelled, never presented as Qloo data), none.
- Rulebook thresholds: refuse above 85% break-even of capacity, warn above 65%; sponsor offsets are illustrative ranges, never quotes.
- Required by the owner (2026-10-17): Google, Apple and email sign-in and sign-up; legal pages (terms, privacy, cookies), support, contact, llms.txt; deployment on a carsonrodrigues.com subdomain on Carson's VPS; queued checks with job ids.
- Undecided: pricing (none for the hackathon), which VPS host and subdomain name, Apple sign-in availability on web pending Apple developer configuration.

## Brand Commitments

Name: Headliner. Voice: plainspoken, surgical, honest about limits; numbers with the command that produced them; no hype, no emoji. Owner wants a strong point of view, strong icons and SVG, gradients and motion used with intent, colour chosen for its psychology, not decoration.

## Evidence on Hand

- Deterministic engine with tests: `src/lib/deal/`, rulebook `src/lib/rules/rules-v1.json`.
- Real-act offers with illustrative terms: `src/lib/offers.ts`.
- No Qloo key yet; no live probe numbers yet (`scripts/verify-qloo.ts` produces them). Do not fabricate affinity figures, overlap percentages, customers, or testimonials.
- Prior-winner research and judge panel: `../qloo-agentic/BRIEF.md`.

## Product Principles

1. Money is code; taste is evidence; the unknowable is named.
2. Abstain rather than guess, and show exactly what is missing.
3. One way in: the offer line. One decision per screen.
4. Every number carries its provenance (rulebook version, Qloo trace).
5. The judge path has zero friction: no login needed to run a check; accounts exist to save and share.

## Accessibility & Inclusion

WCAG 2.2 AA: measured contrast on every colour pair, keyboard-complete, status conveyed by text not colour alone, reduced-motion respected.
