import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BaselineComparison } from "@/lib/baseline/baseline";
import { money, pct } from "@/lib/deal/deal-math";
import type { Offer } from "@/lib/deal/offer-parser";
import { t } from "@/lib/i18n";
import type { Candidate } from "@/lib/qloo/evidence";
import { rules } from "@/lib/rules";
import type { Scenario } from "@/lib/scenario";
import { cn } from "@/lib/utils";
import type { Fix, Verdict } from "@/lib/verdict/verdict";
import { CountUp } from "./motion/count-up";
import { Reveal } from "./motion/reveal";
import { Dot, Stat, StatusBadge, type Tone } from "./status";

const statusEdge: Record<Verdict["status"], string> = {
  cleared: "border-t-success",
  fix_required: "border-t-warning",
  refused: "border-t-destructive",
  abstained: "border-t-info",
};

const fixTone: Record<Fix["kind"], Tone> = {
  opener: "info",
  sponsor: "warning",
  market: "success",
};

export function VerdictView({
  verdict,
  offer,
  baseline,
  onScenario,
}: {
  verdict: Verdict;
  offer: Offer;
  baseline?: BaselineComparison;
  onScenario?: (scenario: Scenario) => void;
}) {
  const d = verdict.deal;
  const ev = verdict.evidence;
  const be = Number.isFinite(d.breakEvenCapacityPct)
    ? d.breakEvenCapacityPct
    : null;
  const aff = ev.localAffinity;
  const warn = rules.money.warnAboveBreakEvenPct;
  const refuse = rules.money.refuseAboveBreakEvenPct;
  const level =
    be === null
      ? "muted"
      : be > refuse
        ? "destructive"
        : be > warn
          ? "warning"
          : "success";

  return (
    <section aria-live="polite" className="grid gap-4">
      {/* Verdict: the answer leads, full width */}
      <Card className={cn("border-t-4", statusEdge[verdict.status])}>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusBadge status={verdict.status} />
            <span className="font-mono text-xs text-muted-foreground">
              {verdict.rulesVersion}
            </span>
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight text-balance">
            {verdict.headline}
          </CardTitle>
          <CardDescription>
            {offer.artist} · {offer.city} · {offer.capacity} cap ·{" "}
            {money(offer.ticketPrice)} · {money(offer.guarantee)} guarantee
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-1.5 text-sm">
            {verdict.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
            {verdict.abstentions.map((a) => (
              <li key={a.code} className="text-muted-foreground">
                <Dot tone="info">{a.message}</Dot>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Deal economics */}
        <Card>
          <CardHeader>
            <CardDescription>{t("verdict.money")}</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">
              {be === null ? (
                "—"
              ) : (
                <>
                  <CountUp
                    value={d.breakEvenTickets}
                    format={(n) => String(Math.round(n))}
                  />
                  <span className="ml-2 text-base font-normal text-muted-foreground">
                    / {d.inputs.capacity} {t("verdict.breakEven").toLowerCase()}
                  </span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <ProgressPrimitive.Root
              value={be === null ? 0 : Math.min(be, 1.2) / 1.2}
              max={1}
              aria-label={t("verdict.breakEven")}
            >
              <ProgressTrack className="h-2">
                <ProgressIndicator
                  className={cn(
                    level === "success" && "bg-success",
                    level === "warning" && "bg-warning",
                    level === "destructive" && "bg-destructive",
                    level === "muted" && "bg-muted-foreground/40",
                  )}
                />
              </ProgressTrack>
            </ProgressPrimitive.Root>
            <p className="text-sm text-muted-foreground">
              {be === null
                ? "—"
                : `${pct(be)} ${t("verdict.ofCapacity")} · ${t("verdict.warnAbove", { warn: pct(warn), refuse: pct(refuse) })}`}
            </p>
            <div className="grid gap-1.5 border-t pt-3">
              <Stat
                label={t("verdict.netPerTicket")}
                value={money(d.netPerTicket, true)}
              />
              <Stat
                label={t("verdict.fixedCosts")}
                value={money(d.totalFixedCost)}
              />
              <Stat
                label={t("verdict.selloutNet")}
                value={money(d.selloutNet)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Audience evidence */}
        <Card>
          <CardHeader>
            <CardDescription>{t("verdict.signal")}</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">
              {aff ? (
                <>
                  <CountUp value={aff.mean} format={(n) => n.toFixed(2)} />
                  <Badge variant="secondary" className="ml-2 align-middle">
                    {aff.label}
                  </Badge>
                </>
              ) : (
                <span className="text-lg text-muted-foreground">
                  {t("verdict.noSignalTitle")}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {aff && (
              <p className="text-sm text-muted-foreground">
                {t("verdict.cells", { count: aff.cells })}
              </p>
            )}
            {ev.entity && (
              <div className="grid gap-1.5 border-t pt-3">
                <Stat
                  label={t("verdict.entity")}
                  value={`${ev.entity.name} (${ev.entity.type})`}
                />
                {ev.demographics && (
                  <Stat
                    label={t("verdict.demographics")}
                    value={Object.entries(ev.demographics.age)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 2)
                      .map(([k, v]) => `${k.replaceAll("_", " ")} ${pct(v)}`)
                      .join(", ")}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fixes and limits */}
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="grid content-start gap-3">
          {verdict.fixes.length > 0 ? (
            <>
              <h2 className="text-base font-semibold">{t("verdict.fixes")}</h2>
              <Reveal className="grid gap-3">
                {verdict.fixes.map((f) => (
                  <FixView key={f.kind} fix={f} onScenario={onScenario} />
                ))}
              </Reveal>
            </>
          ) : (
            <NetTable verdict={verdict} />
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t("verdict.cannot")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-1.5 text-sm text-muted-foreground">
              {verdict.cannotEstablish.map((c) => (
                <li key={c} className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-2.5 h-px w-3 shrink-0 bg-muted-foreground"
                  />
                  {t(`cannot.${c}`)}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {verdict.fixes.length > 0 && <NetTable verdict={verdict} />}

      {/* Evidence detail */}
      <Card>
        <CardHeader>
          <CardTitle>{t("verdict.evidence")}</CardTitle>
          <CardDescription>{ev.sourceNote}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {(ev.tasteTags.length > 0 ||
            ev.openers.length > 0 ||
            ev.sponsors.length > 0 ||
            ev.places.length > 0) && (
            <div className="grid gap-6 md:grid-cols-4">
              <div className="grid content-start gap-1.5 text-sm">
                {ev.tasteTags.length > 0 && (
                  <>
                    <p className="font-medium">{t("verdict.tags")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ev.tasteTags.slice(0, 8).map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <CandidateList title={t("verdict.openers")} items={ev.openers} />
              <CandidateList
                title={t("verdict.sponsors")}
                items={ev.sponsors}
              />
              <CandidateList title={t("verdict.places")} items={ev.places} />
            </div>
          )}
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            {ev.coverage.map((c) => (
              <li key={c.code}>
                <Dot tone={c.ok ? "success" : "warning"}>{c.detail}</Dot>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {baseline && <BaselineView baseline={baseline} />}

      {/* API calls */}
      <Card>
        <details>
          <summary className="cursor-pointer list-none px-6 py-4 text-sm font-medium">
            {t("verdict.trace")}{" "}
            <span className="text-muted-foreground">· {ev.trace.length}</span>
          </summary>
          {ev.trace.length === 0 ? (
            <p className="px-6 pb-4 text-sm text-muted-foreground">
              {t("verdict.noTrace")}
            </p>
          ) : (
            <div className="border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">{t("suite.status")}</TableHead>
                    <TableHead className="w-24">{t("suite.latency")}</TableHead>
                    <TableHead>{t("suite.params")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ev.trace.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <Dot tone={e.ok ? "success" : "destructive"}>
                          <span className="font-mono">{e.status}</span>
                        </Dot>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {e.ms}ms{e.cached ? " ·c" : ""}
                      </TableCell>
                      <TableCell className="whitespace-normal break-all font-mono text-xs">
                        GET {e.path}?{new URLSearchParams(e.params).toString()}
                        {e.error ? ` — ${e.error}` : ""}
                        {typeof e.resultCount === "number"
                          ? ` → ${e.resultCount}`
                          : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </details>
      </Card>
    </section>
  );
}

function NetTable({ verdict }: { verdict: Verdict }) {
  const d = verdict.deal;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("verdict.netTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-1.5 md:grid-cols-2 md:gap-x-8">
          {d.netAtPctSold.map((p) => (
            <Stat
              key={p.pct}
              label={t("verdict.netAt", { pct: pct(p.pct) })}
              value={money(p.net)}
            />
          ))}
        </div>
        {d.violations.map((v) => (
          <p key={v.code} className="mt-3 text-sm text-destructive">
            {v.detail}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}

/** Candidates rank by affinity. Name left, score right, nothing else. */
function CandidateList({
  title,
  items,
}: {
  title: string;
  items: Candidate[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="text-sm">
      {title && <p className="font-medium">{title}</p>}
      <ul className="mt-1.5 grid gap-1">
        {items.slice(0, 4).map((c) => (
          <li key={c.id} className="flex items-baseline justify-between gap-3">
            <span>{c.name}</span>
            {typeof c.affinity === "number" && (
              <span className="font-mono text-muted-foreground tabular-nums">
                {c.affinity.toFixed(2)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FixView({
  fix,
  onScenario,
}: {
  fix: Fix;
  onScenario?: (scenario: Scenario) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Dot tone={fixTone[fix.kind]}>{fix.title}</Dot>
        </CardTitle>
        <CardDescription>{fix.detail}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {fix.kind !== "market" && (
          <CandidateList title="" items={fix.candidates} />
        )}
        {fix.kind === "sponsor" && (
          <div className="grid gap-1">
            <Stat
              label={`With ${money(fix.assumption.low)} offset`}
              value={`${fix.dealAtLow.breakEvenTickets} (${pct(fix.dealAtLow.breakEvenCapacityPct)})`}
            />
            <Stat
              label={`With ${money(fix.assumption.high)} offset`}
              value={`${fix.dealAtHigh.breakEvenTickets} (${pct(fix.dealAtHigh.breakEvenCapacityPct)})`}
            />
            <p className="text-sm text-muted-foreground">
              {fix.assumption.label}
            </p>
          </div>
        )}
        {fix.kind === "market" &&
          fix.sharedTags &&
          fix.sharedTags.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {t("verdict.sharedTags")}: {fix.sharedTags.join(", ")}
            </p>
          )}
        {onScenario && (
          <div className="flex flex-wrap gap-2">
            {fix.kind === "market" && fix.altCity && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onScenario({ kind: "market", city: fix.altCity })
                }
              >
                {t("scenario.market", { city: fix.altCity })}
              </Button>
            )}
            {fix.kind === "opener" && fix.candidates[0] && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onScenario({ kind: "opener", opener: fix.candidates[0].name })
                }
              >
                {t("scenario.opener", { opener: fix.candidates[0].name })}
              </Button>
            )}
            {fix.kind === "sponsor" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onScenario({
                      kind: "sponsor",
                      sponsorOffset: fix.assumption.low,
                    })
                  }
                >
                  {t("scenario.sponsor", { amount: money(fix.assumption.low) })}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onScenario({
                      kind: "sponsor",
                      sponsorOffset: fix.assumption.high,
                    })
                  }
                >
                  {t("scenario.sponsor", {
                    amount: money(fix.assumption.high),
                  })}
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BaselineView({ baseline }: { baseline: BaselineComparison }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("baseline.title")}</CardTitle>
        <CardDescription>
          {baseline.note}
          {baseline.model ? ` · ${baseline.model}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {baseline.overlap && baseline.guess && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-sm">
              <p className="font-medium">{t("baseline.affinity")}</p>
              <p className="mt-1">
                {baseline.guess.localAffinity}
                {baseline.overlap.affinityAgrees === null
                  ? ""
                  : baseline.overlap.affinityAgrees
                    ? ` · ${t("baseline.agrees")}`
                    : ` · ${t("baseline.disagrees")}`}
              </p>
            </div>
            <OverlapList
              title={t("verdict.openers")}
              o={baseline.overlap.openers}
            />
            <OverlapList
              title={t("verdict.sponsors")}
              o={baseline.overlap.sponsors}
            />
          </div>
        )}
        {baseline.guess?.reasoning && (
          <p className="text-sm text-muted-foreground">
            {baseline.guess.reasoning}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function OverlapList({
  title,
  o,
}: {
  title: string;
  o: {
    shared: string[];
    modelOnly: string[];
    qlooOnly: string[];
    pct: number | null;
  };
}) {
  return (
    <div className="text-sm">
      <p className="font-medium">
        {title}{" "}
        <span className="text-muted-foreground">
          · {o.pct === null ? "n/a" : `${o.pct}% ${t("baseline.overlap")}`}
        </span>
      </p>
      <ul className="mt-1 grid gap-1">
        {o.shared.map((n) => (
          <li key={`s-${n}`}>
            <Dot tone="success">{n}</Dot>
          </li>
        ))}
        {o.modelOnly.map((n) => (
          <li key={`m-${n}`} className="text-muted-foreground">
            <Dot tone="muted">
              {n} · {t("baseline.modelOnly")}
            </Dot>
          </li>
        ))}
        {o.qlooOnly.map((n) => (
          <li key={`q-${n}`}>
            <Dot tone="info">
              {n} · {t("baseline.qlooOnly")}
            </Dot>
          </li>
        ))}
      </ul>
    </div>
  );
}
