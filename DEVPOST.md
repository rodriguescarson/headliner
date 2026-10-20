# Headliner

> Check a live-show offer before you sign it. Deterministic deal math, cultural evidence from Qloo, and a plain list of what no data can tell you.

**Live:** https://headliner.carsonrodrigues.com (no sign-in needed) · **Repo:** https://github.com/rodriguescarson/headliner (MIT)

## Inspiration

Three hundred seats, a $2,500 guarantee, a $1,200 venue deposit, and the hold expires at midnight. Independent promoters sign that offer sheet on gut feel and a Spotify top-cities list. One misrouted mid-week show wipes out the profit from four sold-out weekends. Nothing on the desk tells them whether *this* act has an audience in *this* city, who should open, which brand already sells to those fans, or what to counter with.

## What it does

Type the offer the way it arrives:

```
Khruangbin · Denver, CO · 2,000 cap · $48 ticket · $45,000 guarantee + $9,000 room
```

Headliner answers **Cleared**, **Fix required**, **Refused** or **Abstained**, and shows its work in three strictly separated parts:

1. **Deal math.** Break-even tickets and share of capacity, net per ticket, net at 50, 65, 80 and 100% sold. Plain TypeScript against a versioned rulebook (`headliner-rules@1.1.0`). No model touches a dollar.
2. **Cultural evidence from Qloo.** The act resolved to an entity, its affinity across the city's map cells, which age bands over-index, local acts below its popularity that share its audience, brands its fans buy, night-out places, and taste tags. Every call is traced with its parameters and latency.
3. **What the check cannot establish.** Competing shows that night, radius clauses, actual ticket sales, hold status, availability. Printed on every result.

The real answer for that Khruangbin offer, live from Qloo:

> **Fix required.** Break-even at 68.6% is above the 65% comfort line. Denver reads mid (mean affinity rank 0.718 across 393 map cells).
> **Counter the guarantee:** at $42,000 instead of $45,000, break-even drops to 1,296 tickets (64.8%). Whether the act takes it is a negotiation, not a number this check can know.
> **Offset it:** Patagonia, Fjällräven and The North Face already sell to this audience in Denver. Openers who share it: Brittany Howard, Adi Oasis, Mdou Moctar.

Every fix is one click from a **scenario**: counter the guarantee, swap the market, put the opener on the bill, apply a sponsor offset. The changed offer runs through the same arithmetic and the same Qloo calls, and the two verdicts sit side by side with exactly what moved.

When the signal is not there, it says so. An act Qloo cannot match exactly, or a city with too few map cells, produces an abstention naming the missing signal:

> **Abstained.** Qloo has no exact match for "The Tuesday Night Basement Trio". Its closest result was "Night Marks Electric Trio", a different act, so no evidence is borrowed from it.

## How Qloo is used

| Step | Call | What it decides |
|---|---|---|
| Resolve the act | `GET /search` (exact name or alias only) | Whether there is an entity at all; abstain if not |
| Local affinity | `/v2/insights` `filter.type=urn:heatmap`, `output.heatmap.boundary=urn:geohash` | Market strength: mean `affinity_rank` across the city's cells |
| Who is there | `/v2/insights` `urn:demographics` | Age bands that over-index, as signed scores |
| Who opens | `/v2/insights` `urn:entity:artist` or `urn:entity:person`, `signal.location.query`, `filter.popularity.max`, `feature.explainability` | Local acts (or comics, for comics) that share the audience |
| Why that opener | `GET /v2/analysis/compare` headliner vs top opener | The taste tags the two share |
| Who sponsors | `/v2/insights` `urn:entity:brand` + explainability | Brands the act's fans already buy |
| Where fans go after | `/v2/insights` `urn:entity:place` | The night-out package promoters sell |
| Taste profile | `/v2/insights` `urn:tag`, `filter.parents.types` = the act's type | Style tags for the brief to the venue and sponsor |
| Swap the market | the same heatmap for a nearby metro | Offered only if that city reads higher |

A spreadsheet can do part one. Part two does not exist without a cultural graph: a language model can say Denver likes live music, but it cannot say whether this act over-indexes in Denver, which Denver acts share its audience, or which brands its fans buy there.

## Key day: what the real API taught us

The Qloo key arrived two days into the build. The first probe run against 20 acts (15 real, 5 invented to test abstention) in five cities was a useful failure:

| | First run | After fixes |
|---|---|---|
| Acts "resolved" | 20 of 20, five of them wrong | 15 of 15 real acts |
| Invented acts rejected | 0 of 5 | 5 of 5 |
| Real acts with a usable heatmap | 0 of 15 | 15 of 15 |
| Gaps left | rate limits reported as missing data | demographics for two comics, which Qloo did not return |

What was wrong, all of it found by the probe and fixed with a test:

1. **Heatmap boundary.** The API wants `urn:geohash`; we sent `geohash`. Every heatmap call had failed.
2. **The heatmap's `affinity` cannot compare cities.** It is rescaled inside each response: its mean was exactly 0.500 in every city for every act. `affinity_rank` varies by city, so that is what Headliner reads.
3. **Search always returns something.** "Goan Garage Collective" came back as Animal Collective, "DJ Kettle Corn" as DJ Karotte. Headliner now accepts only an exact normalised name or alias, and names the near miss when it abstains.
4. **Entity type** lives in `types[]`, not `type`. Comics had been getting singers as openers (Cedric the Entertainer got Wayne Brady).
5. **Tags** are under `results.tags`, so taste tags had always been empty; compare had been comparing the act with itself.
6. **Unfiltered tags are noise.** A comic came back tagged with a credit card, his ethnicity, and genres from his books. Tags are now restricted to the act's own type, and ethnicity and language tags are never shown.
7. **Demographics are signed affinity scores** from -1 to 1, not shares. They are shown as over-indexing bands with the score, never as a percentage.
8. **Rate limits.** The hackathon tier allows 5 requests a second; a check fires nine. A 429 had been reported as "0 brand candidates". Calls are now paced and retried, and a failed call says it failed.
9. **Trending** needs a date window and returned an empty list for the acts tested. It is not part of the verdict.

## Calibrated, not guessed

The first rulebook set "low" and "strong" affinity at 0.30 and 0.60 before any real data existed. On key day we measured instead: 15 real acts in Austin, Chicago, Atlanta, Denver and Los Angeles, 75 act-city pairs, all scored, 90 API calls, no retries (`pnpm calibrate`). The cut-offs in `headliner-rules@1.1.0` are the tertiles of that population, 0.61 and 0.88, and the rulebook records how they were made.

Before trusting the measure we checked it against what any promoter knows. Each act's best city out of the five:

| Act | Best city | Read |
|---|---|---|
| Leon Bridges | Austin (0.909) | Texas soul singer |
| Khruangbin | Austin (0.743) | Texas band |
| Cedric the Entertainer | Atlanta (0.976) | His strongest market |
| Bad Bunny | Los Angeles (0.934) | Largest Latin audience of the five |
| Jinjer | none above 0.28 | Ukrainian metal, low everywhere |

One limitation, stated rather than hidden: stand-up comics scored 0.88 to 0.98 in every city, so for comics the comparison between cities carries more information than the label.

## The twelve pre-seeded offers, live

Real acts and cities; the deal terms are illustrative shapes, not claims about any act's fees.

- 1 cleared, 3 fix required, 6 refused as written, 2 abstained.
- Every offer that fails as written comes with a concrete next move: a counter-guarantee on all nine, and a sponsor shortlist on the three tight ones.
- Four offers sit in low-affinity markets. In each case the nearby metro read no better, so no market swap is offered and the verdict shows the comparison that ruled it out. An earlier build would have sent Men I Trust from Phoenix (0.399) to Tucson (0.322).
- Both invented acts abstain and name Qloo's closest miss.

## How we kept it honest

- **Money never comes from a model.** 45 unit tests cover deal math, the counter-offer, parsing, verdicts, scenario diffs, the evidence layer against real response shapes, storage and theme.
- **It abstains out loud** and never borrows evidence from a near-miss entity.
- **A weaker market is never recommended.** If the nearby city reads lower, the verdict says the comparison was made and why no swap is offered.
- **Every number is reproducible.** `pnpm probe`, `pnpm calibrate` and `pnpm offers` run the same code paths as the site, failures included. Qloo responses are cached server-side and never committed.

## For the judges

- **Check any act**: the desk runs live against `hackathon.api.qloo.com`.
- **/board**: all twelve offers on one table with a "next move" column; run them and watch each row settle.
- **Share**: any verdict becomes a link with a preview card showing the verdict, break-even and sellout net.
- **/suite**: every endpoint fired once, with status and latency.
- **MCP**: a venue booker's or sponsor's agent can call `check_offer`, read the `rulebook` and run the `endpoint_suite`. Same evidence, read-only.

## What we did not verify

- What exactly `affinity_rank` ranks against. Qloo's docs do not say; we use it because it varies by city in ways that match known markets, and the calibration table above is the evidence.
- The Without-Qloo control (the same offer through a model alone, with measured overlap) is built and tested but needs a model key on the server; numbers from it are not quoted here until it has run on all twelve offers.
- Whether any act would accept a counter. The counter is arithmetic on the promoter's own numbers.

## Built with

Next.js 16, React 19, TypeScript, shadcn/ui on Base UI, Tailwind CSS 4, Geist, GSAP and Lenis (off under reduced motion), self-hosted Supabase (Auth with Google and email, Postgres with row-level security), Resend, Docker behind Caddy on a VPS, Vitest, Biome, the Qloo Insights API, and the Model Context Protocol SDK.

Interface structure was benchmarked against shipped products (Gemini and Copilot for the input, Wise and Grammarly for the verdict, Mercury and Polar for the board). No borrowed visuals.
