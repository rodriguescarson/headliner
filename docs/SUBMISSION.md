# Submitting Headliner on Devpost

Deadline: Oct 30, 2026, 11:45 pm ET (Oct 31, 9:15 am IST). The brief says submit on Oct 29.

## Form fields

| Field | What to paste |
|---|---|
| Project name | Headliner |
| Elevator pitch | Check a live-show offer before you sign it: deal math, Qloo audience evidence, and a counter-offer when the numbers don't work. |
| About the project | Everything in DEVPOST.md below the title line |
| Built with | nextjs, react, typescript, shadcn-ui, tailwindcss, supabase, postgresql, docker, caddy, vitest, qloo, model-context-protocol |
| Try it out | https://headliner.carsonrodrigues.com and https://headliner.carsonrodrigues.com/board?run=all |
| Repo | https://github.com/rodriguescarson/headliner |

## Gallery images (upload in this order)

1. `docs/devpost/02-verdict-khruangbin.png`: a fix-required verdict with the counter, sponsor fits and openers
2. `docs/devpost/06-board.png`: all twelve offers checked live, with next moves
3. `docs/devpost/04-refused-counter.png`: a refusal that still ends with a number to counter with
4. `docs/devpost/05-abstained.png`: an abstention that names Qloo's nearest miss
5. `docs/devpost/03-verdict-cedric.png`: a cleared deal
6. `docs/devpost/01-home.png`: the input
7. `docs/devpost/07-share-card.png`: the link card a co-promoter sees

## Before submitting

- [ ] Add `AI_GATEWAY_API_KEY` to `/opt/headliner/.env` and run `pnpm offers --baseline` locally, so the Without-Qloo numbers can replace the "not verified" line in DEVPOST.md.
- [ ] Sign in with Google on the live site once and open Settings, to confirm the signed-in flow.
- [ ] Run https://headliner.carsonrodrigues.com/board?run=all once on submission day so the server cache is warm for judges.

## Post for the Qloo Discord (#api-help)

> Notes from building on the hackathon API, in case they save someone an afternoon:
> 1. `output.heatmap.boundary` must be `urn:geohash` or `urn:entity:locality` (not `geohash`).
> 2. In a heatmap response, `query.affinity` is rescaled within the response: its mean came out at exactly 0.500 for every act and city I tried. `affinity_rank` varies by city, so that's the one to compare markets with.
> 3. `/search` always returns its nearest match, even for names it doesn't know ("Goan Garage Collective" returned Animal Collective), so check the name before using the entity.
> 4. Search results carry the type in `types[]`; `urn:tag` insights put results under `results.tags`; `filter.parents.types` keeps tags relevant to the entity's own type.
> 5. `/v2/trending` needs `filter.start_date` and `filter.end_date`.
> 6. The tier allows 5 requests a second (`x-second-ratelimit-*` headers); pacing at 4/s removed every 429 for me.
