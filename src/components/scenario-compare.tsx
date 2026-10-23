import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { money, pct } from "@/lib/deal/deal-math";
import type { Offer } from "@/lib/deal/offer-parser";
import { t } from "@/lib/i18n";
import type { Scenario } from "@/lib/scenario";
import { diffVerdicts } from "@/lib/verdict/diff";
import type { Verdict } from "@/lib/verdict/verdict";
import { Stat, StatusBadge } from "./status";

export function scenarioLabel(s: Scenario): string {
  if (s.kind === "market") return t("scenario.market", { city: s.city });
  if (s.kind === "opener") return t("scenario.opener", { opener: s.opener });
  if (s.kind === "guarantee")
    return t("scenario.guarantee", { amount: money(s.guarantee ?? 0) });
  return t("scenario.sponsor", { amount: money(s.sponsorOffset ?? 0) });
}

/** Two verdicts side by side: the offer as written and the offer with one change, plus the diff that explains it. */
export function ScenarioCompare({
  base,
  next,
  scenario,
  offer,
  onClose,
}: {
  base: Verdict;
  next: Verdict;
  scenario: Scenario;
  offer: Offer;
  onClose: () => void;
}) {
  const d = diffVerdicts(base, next);
  const nextCity =
    scenario.kind === "market" ? (scenario.city ?? offer.city) : offer.city;
  return (
    <section aria-live="polite" className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">
          {t("scenario.title")} · {scenarioLabel(scenario)}
        </h2>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          {t("scenario.close")}
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Column label={t("scenario.base")} v={base} city={offer.city} />
        <Column label={scenarioLabel(scenario)} v={next} city={nextCity} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("scenario.changed")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-1.5 text-sm">
            {d.lines.map((l) => (
              <li key={l} className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className="mt-2.5 h-px w-3 shrink-0 bg-muted-foreground"
                />
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}

function Column({
  label,
  v,
  city,
}: {
  label: string;
  v: Verdict;
  city: string;
}) {
  const be = Number.isFinite(v.deal.breakEvenCapacityPct)
    ? v.deal.breakEvenCapacityPct
    : null;
  const aff = v.evidence.localAffinity;
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <div className="flex items-center gap-3">
          <StatusBadge status={v.status} />
        </div>
        <CardTitle className="text-lg">{v.headline}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-1.5">
        <Stat
          label={t("scenario.breakEven")}
          value={
            be === null
              ? "—"
              : `${v.deal.breakEvenTickets} / ${v.deal.inputs.capacity} (${pct(be)})`
          }
        />
        <Stat
          label={t("verdict.fixedCosts")}
          value={money(v.deal.totalFixedCost)}
        />
        <Stat
          label={`${t("scenario.affinity")} · ${city}`}
          value={
            aff
              ? `${aff.label} · ${aff.mean} · ${aff.cells} cells`
              : t("verdict.noSignal")
          }
        />
        <Stat
          label={t("verdict.fixes")}
          value={v.fixes.length ? v.fixes.map((f) => f.title).join(", ") : "—"}
        />
      </CardContent>
    </Card>
  );
}
