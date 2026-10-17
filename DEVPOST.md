# Headliner — Devpost submission draft

> Judges may score from this text alone. Every number below must come from a run; placeholders are marked `[RUN]` and are filled on key day from `scripts/verify-qloo.ts` and the pre-seeded offers.

## Inspiration

Three hundred seats, a $2,500 guarantee, a $1,200 venue deposit, and the hold expires at midnight. Independent promoters sign that offer sheet on gut feel and a Spotify top-cities list. One misrouted mid-week show wipes out the profit from four sold-out weekends. Nothing on the desk tells them whether *this* act has an audience in *this* city, who should open, or which brand already sells to those fans.

## What it does

Type the offer the way it arrives:

```
Khruangbin · Denver, CO · 2,000 cap · $48 ticket · $45,000 guarantee + $9,000 room
```

Headliner answers **Cleared**, **Fix required**, **Refused** or **Abstained**, and shows its work in three strictly separated columns:

1. **Deal math**: break-even tickets and percentage of capacity, net per ticket, net at 50/65/80/100% sold. Pure TypeScript against a versioned rulebook (`headliner-rules@1.0.0`). No model touches arithmetic.
2. **Cultural evidence from Qloo**: the act resolved to an entity, geographic affinity across the metro's heatmap cells, demographic skew, local openers below the headliner's popularity, brand candidates, night-out places, taste tags. Every call is traced and shown with its parameters and latency.
3. **What this check cannot establish**: competing shows that night, radius clauses, actual ticket sales, hold status, availability. Printed on every result.

When the money is tight or the market reads weak, it prescribes the smallest fix: a local opener Qloo says shares the audience, a sponsor offset shown as a labelled rulebook assumption (never a quote), or a swap to a nearby metro with both heatmaps side by side and the shared taste tags from `/v2/analysis/compare`.

When the signal is not there, it says so. An act Qloo cannot resolve, or a city with fewer than five heatmap cells, produces an abstention naming the exact missing signal. It does not guess.

## How Qloo is used

| Step | Endpoint | What it decides |
|---|---|---|
| Resolve the act | `GET /search` | Whether we have an entity at all; stops here if not |
| Local affinity | `GET /v2/insights` `filter.type=urn:heatmap` + `filter.location.query` | Market strength (mean/max affinity, cell count) |
| Who is there | `GET /v2/insights` `filter.type=urn:demographics` | Age and gender skew for the promoter's marketing |
| Who opens | `GET /v2/insights` `urn:entity:artist` + `signal.location.query` + `filter.popularity.max` + `feature.explainability` | Local acts that share audience, with the reason |
| Who sponsors | `GET /v2/insights` `urn:entity:brand` + explainability | Brands the act's fans already buy |
| Where fans go after | `GET /v2/insights` `urn:entity:place` + `filter.location.query` | The night-out package promoters sell |
| Taste profile | `GET /v2/insights` `filter.type=urn:tag` | Tags for the brief to the DJ, the venue, the sponsor |
| Swap the market | `urn:heatmap` for the nearby metro + `GET /v2/analysis/compare` | Side-by-side affinity and shared tags |
| Tags | `GET /v2/tags` | Taste vocabulary for the live endpoint suite |

Would it work without Qloo? No. The first column is arithmetic any spreadsheet can do. The second column does not exist without a cultural graph: a language model can say Denver likes live music; it cannot say whether this act has affinity in Denver, which Denver acts share its audience, or which brands its fans buy. `[RUN]` The "Without Qloo" control runs the same offer through a model alone and reports the overlap: `[RUN overlap %]` on openers, `[RUN]` on brands, across the twelve pre-seeded offers.

## Evidence from the key-day probe

`[RUN]` Twenty acts across comedy, indie, hardcore, soul, electronic and five deliberately obscure local acts, five metros:

- `[RUN]` of 20 acts resolved; `[RUN]` did not, and Headliner abstained on each.
- `[RUN]` of the resolved acts had five or more heatmap cells in their first city.
- `[RUN]` of the twelve pre-seeded offers fail as written; `[RUN]` abstain; `[RUN]` clear.
- Raw response shapes and every trace are in the repo's probe output (git-ignored data, documented schema).

## For the judges

- **Try it with any act**: nothing is canned; the desk runs live against `hackathon.api.qloo.com`, cached server-side.
- **/suite**: watch every endpoint fire with status and latency.
- **MCP**: a venue booker's or sponsor's agent can run `check_offer`, read the `rulebook` and the `endpoint_suite` over stdio. Same evidence, same trace, read-only.

## What we got wrong, what we did not verify

`[RUN]` Filled from the probe: endpoints whose parameter names did not match the docs, acts that resolved to the wrong entity, cities where the heatmap was too sparse. Reported here, not hidden.

## Built with

Next.js 16, TypeScript, Vitest, Biome, Qloo Insights API, Model Context Protocol SDK, Vercel AI SDK (baseline control only).

## Repo and demo

- Repo: `[URL]` (MIT)
- Demo: `[URL]`
