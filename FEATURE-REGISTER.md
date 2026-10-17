# Feature register — Headliner

Standard: `~/PRODUCT-ENGINEERING-STANDARD.md`. Context: Qloo Agentic Hackathon entry, 13-day build, judged on a hosted URL and a public repo. "Not applicable" entries are deliberate and say why.

| ID | Feature | Why (user problem) | Priority | Roles (CRUD) | Standard sections | Depends on | Status | Acceptance criteria | Evidence |
|---|---|---|---|---|---|---|---|---|---|
| F1 | Offer desk (one-line offer in, verdict out) | A promoter signs a guarantee on gut feel at 10 PM; one misrouted show wipes a month | P0 | anonymous: run (no persistence) | B7 one way in, C13, C30 | — | built, sample mode | Canonical offer line parses; missing fields are named, never guessed; verdict renders all four statuses | `src/lib/deal/offer-parser.test.ts`, browser run 2026-10-17 |
| F2 | Deterministic deal math + versioned rulebook | Money arithmetic must never come from a model | P0 | — | C11, C12 | — | built | Break-even, net per ticket, sellout net, hard-rule refusals; rulebook version stamped on every result | `src/lib/deal/deal-math.test.ts` (7 tests) |
| F3 | Qloo evidence layer with coverage flags | Cultural affinity is evidence, not a forecast; gaps must be visible | P0 | — | C7 (AI security), C20 | Qloo key | built, unverified against live API | Every call traced; each coverage gap named; sparse heatmap or unresolved act leads to abstention | `scripts/verify-qloo.ts` output (pending key) |
| F4 | Abstention gate | The product must refuse to guess when signal is missing | P0 | — | C7, C12 | F3 | built | Unknown act → "abstained" with the exact missing signal | `src/lib/verdict/verdict.test.ts` |
| F5 | Smallest fix (opener, sponsor offset, market) | Tell the promoter what to change, not just that it fails | P0 | — | C13 | F2, F3 | built (market fix pending compare) | Sponsor offset shown as labelled rulebook assumption; opener candidates from evidence only | verdict tests, browser run |
| F6 | Without-Qloo baseline comparison | The hackathon's own test: would this work the same without Qloo? | P1 | — | C7, C18 | AI Gateway key | not started | Same offer to LLM alone; overlap of cities/openers/brands measured and shown as a number | — |
| F7 | City comparison (`/v2/analysis/compare`) and trend | "Swap the market" fix needs evidence | P1 | — | — | Qloo key | not started | Two cities compared on shared taste tags; result shown with the raw call | — |
| F8 | Live endpoint suite + read-only MCP view | CTO judge can watch every endpoint fire; a counterparty agent can verify the evidence | P1 | — | C7 | Qloo key | not started | Button runs all endpoints live with status and latency; MCP exposes the same evidence read-only | — |
| F9 | Pre-seeded real offers (12) | Judges get a result in one click | P1 | — | C13 | Qloo key | sample set only | 12 real acts across real capacities, at least 8 failing as written, 3 abstaining | — |
| F10 | Share link / persisted check | A promoter forwards the verdict to a co-promoter | P2 | anonymous: create, read | B6 async, C21 | Postgres | not started | Check persisted with job id; link survives refresh | — |
| F11 | Hosted deployment | Hackathon requires an external, public demo | P0 | — | C32 | Vercel account | not started | Public URL serves the desk; key stored as env only | — |
| F12 | Devpost write-up + README | Judges may score from text alone | P0 | — | C30 | all | README drafted | What works, what failed, what was not verified, with the probe numbers | — |

**Not applicable, and why**
- B1 Auth (Google/Apple/email): the product is a no-login sandbox by design, like the judged "point it at your own lunch" pattern; nothing personal is stored. Revisit when share links persist (F10).
- B3 RBAC, B4 CRUD, B5 soft delete: no user-owned records yet. Revisit with F10.
- B9/B10 notifications, settings, support tickets, account deletion: no accounts. Support contact lives in README and on the page footer.
- B14/B15 mobile offline and version gates: web only.
- B18 email domain: no email is sent.
- B2 i18n: in place (`src/lib/i18n.ts`, `en.json`); single locale shipped.
