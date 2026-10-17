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

## For judges and counterparties

- **/suite**: runs every Qloo endpoint Headliner depends on, once, live, and shows status, latency and result counts. In sample mode it says nothing was called.
- **MCP server** (read-only): a venue booker's or sponsor's agent can run the same check and read the same evidence, rulebook and trace.

  ```bash
  pnpm mcp                      # stdio transport
  node scripts/mcp-smoke.mjs    # initialize, list tools, run check_offer
  ```

  Tools: `check_offer(line)`, `rulebook()`, `endpoint_suite()`.
- **Market swap**: when the primary city reads weak, the same act is checked in a configured nearby metro (`src/lib/geo/nearby.ts`) and the two heatmaps are shown side by side with the shared taste tags from `/v2/analysis/compare`. If the alternative is too sparse to compare, the result says so and makes no claim.

## Accounts, queue, pages

- **Accounts** (optional): Supabase Auth with Google, Apple and email, cookie sessions refreshed in `src/proxy.ts`. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; without them the desk runs and account links are hidden. Apple on web needs `NEXT_PUBLIC_AUTH_APPLE=true` once the Services ID is configured in Supabase.
- **Queued checks**: `POST /api/jobs` returns a job id at once; the desk polls `GET /api/jobs/:id` and the id rides in the URL hash so a refresh resumes. The in-memory worker (`src/lib/jobs/store.ts`) is the development implementation behind a store interface.
- **Pages**: `/terms`, `/privacy`, `/cookies`, `/support` (FAQ with schema.org), `/contact` (Resend when `RESEND_API_KEY` and `CONTACT_FROM` are set), `/llms.txt`, `/robots.txt`, `/sitemap.xml`, `/.well-known/security.txt`.

## Design

The Console: the offer desk is a channel strip. Deal math and Qloo signal are meter faces, the verdict is a lamp, fixes are patch points, the unknowables are an engraved stencil, the Qloo trace is the back panel. Tokens live in `src/app/globals.css` (light scene default, dark behind `data-theme="dark"`); contrast is measured with `node scripts/contrast.mjs`. Direction contract: `src/app/layout.tsx`.

## Deploy (Carson's VPS, behind the shared Caddy)

The VPS already runs one self-hosted Supabase stack per product under `/root/stacks/<name>` and a shared `supabase-caddy` that owns ports 80 and 443. Headliner follows the same pattern:

1. Create the `headliner` Supabase stack with the server's `new-stack.sh`; it provides the `headliner_default` network and `headliner-supabase-kong`.
2. Append `deploy/Caddyfile.snippet` to `/root/supabase/docker/Caddyfile`, validate, connect Caddy to `headliner_default`, reload.
3. Add two A records to the VPS: `headliner.carsonrodrigues.com` and `headliner-api.carsonrodrigues.com`.
4. Fill `/opt/headliner/.env` from `.env.example` (Qloo key, Supabase URL and anon key of the new stack, optional gateway and Resend keys).
5. `SSH_HOST=root@<vps> ./deploy/deploy.sh` builds the image on the server and starts `headliner-app` on the stack's network.

## Security (OWASP Top 10 pass, 2026-10-17)

- **A01 access control**: no accounts, no user-owned records; nothing to escalate. Share links (planned) use unguessable ids.
- **A02 cryptographic failures**: the Qloo key and gateway key live only in server env; the pipeline is `server-only`; the key is never in a URL, a response, a trace or a log. HSTS is set.
- **A03 injection**: every request body is parsed as JSON, validated with Zod, length-capped; the offer line is bounded to 500 characters. Qloo parameters are sent as URL query values, never interpolated into paths.
- **A04 insecure design**: per-client rate limits (30 checks/min, 10 model baselines/min, 5 suite runs/min), 4 KB body cap, same-origin check on POSTs, abstention instead of guessing. Limits are per server instance; on multi-instance hosting they bound abuse per instance.
- **A05 misconfiguration**: nonce-based CSP with `strict-dynamic` (`src/proxy.ts`), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP, no `X-Powered-By`, `Cache-Control: no-store` on APIs. Verified in the browser with no CSP violations in dev.
- **A06 vulnerable components**: `pnpm audit --prod` runs in CI; lockfile committed; no third-party scripts, fonts self-hosted.
- **A07 authentication**: not applicable by design (no-login sandbox); revisit with persisted share links.
- **A08 integrity**: no CDN scripts; dependencies pinned by lockfile; rulebook versioned and stamped on every verdict.
- **A09 logging**: rejected requests and failures are logged as structured JSON with a hashed client key, never a raw IP or offer text.
- **A10 SSRF**: the Qloo client refuses any base URL that is not an https `qloo.com` host.
- `/.well-known/security.txt` carries the contact.

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
