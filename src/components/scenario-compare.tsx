import { money, pct } from "@/lib/deal/deal-math";
import type { Offer } from "@/lib/deal/offer-parser";
import { t } from "@/lib/i18n";
import type { Scenario } from "@/lib/scenario";
import { diffVerdicts } from "@/lib/verdict/diff";
import type { Verdict } from "@/lib/verdict/verdict";
import { Plate, Screws, VerdictLamp } from "./console";

export function scenarioLabel(s: Scenario): string {
  if (s.kind === "market") return t("scenario.market", { city: s.city });
  if (s.kind === "opener") return t("scenario.opener", { opener: s.opener });
  return t("scenario.sponsor", { amount: money(s.sponsorOffset ?? 0) });
}

/** Two verdicts on one strip: the offer as written and the offer with one change, plus the diff that explains it. */
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
  return (
    <section aria-live="polite" className="grid gap-4">
      <div className="on-ground flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">
          {t("scenario.title")} · {scenarioLabel(scenario)}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="underline underline-offset-4"
        >
          {t("scenario.close")}
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Column legend={t("scenario.base")} v={base} city={offer.city} />
        <Column
          legend={scenarioLabel(scenario)}
          v={next}
          city={
            next.evidence.altMarket && scenario.kind === "market"
              ? (scenario.city ?? offer.city)
              : scenario.kind === "market"
                ? (scenario.city ?? offer.city)
                : offer.city
          }
        />
      </div>
      <Plate legend={t("scenario.changed")}>
        <ul className="grid gap-1.5">
          {d.lines.map((l) => (
            <li key={l} className="flex items-start gap-2">
              <span
                aria-hidden
                className="mt-2.5 h-px w-3 shrink-0 bg-legend"
              />
              <span>{l}</span>
            </li>
          ))}
        </ul>
      </Plate>
    </section>
  );
}

function Column({
  legend,
  v,
  city,
}: {
  legend: string;
  v: Verdict;
  city: string;
}) {
  const be = Number.isFinite(v.deal.breakEvenCapacityPct)
    ? v.deal.breakEvenCapacityPct
    : null;
  const aff = v.evidence.localAffinity;
  return (
    <div className="plate relative p-5">
      <Screws />
      <p className="legend">{legend}</p>
      <h3 className="mt-2 flex items-center gap-3 font-display text-2xl font-bold">
        <VerdictLamp status={v.status} size={28} />
        {t(`verdict.status.${v.status}`)}
      </h3>
      <p className="mt-2">{v.headline}</p>
      <dl className="mt-4 grid gap-1.5">
        <Row
          k={t("scenario.breakEven")}
          v={
            be === null
              ? "—"
              : `${v.deal.breakEvenTickets} / ${v.deal.inputs.capacity} (${pct(be)})`
          }
        />
        <Row k={t("verdict.fixedCosts")} v={money(v.deal.totalFixedCost)} />
        <Row
          k={`${t("scenario.affinity")} · ${city}`}
          v={
            aff
              ? `${aff.label} · ${aff.mean} · ${aff.cells} cells`
              : t("verdict.noSignal")
          }
        />
        <Row
          k={t("verdict.fixes")}
          v={v.fixes.length ? v.fixes.map((f) => f.title).join(", ") : "—"}
        />
      </dl>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-legend">{k}</dt>
      <dd className="text-right font-display text-base">{v}</dd>
    </div>
  );
}
