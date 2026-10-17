import type { BaselineComparison } from "@/lib/baseline/baseline";
import { money, pct } from "@/lib/deal/deal-math";
import type { Offer } from "@/lib/deal/offer-parser";
import { t } from "@/lib/i18n";
import type { Candidate } from "@/lib/qloo/evidence";
import { rules } from "@/lib/rules";
import type { Fix, Verdict } from "@/lib/verdict/verdict";
import {
  Lamp,
  Meter,
  PatchPoint,
  Plate,
  Stencil,
  VerdictLamp,
} from "./console";

const affinityIndex = { low: 0.18, mid: 0.5, strong: 0.84 } as const;

export function VerdictView({
  verdict,
  offer,
  baseline,
}: {
  verdict: Verdict;
  offer: Offer;
  baseline?: BaselineComparison;
}) {
  const d = verdict.deal;
  const ev = verdict.evidence;
  const be = Number.isFinite(d.breakEvenCapacityPct)
    ? d.breakEvenCapacityPct
    : null;
  const aff = ev.localAffinity;
  const warn = rules.money.warnAboveBreakEvenPct;
  const refuse = rules.money.refuseAboveBreakEvenPct;

  return (
    <section aria-live="polite" className="grid gap-5">
      {/* Meter bridge */}
      <div className="grid gap-4 md:grid-cols-[1fr_minmax(240px,0.9fr)_1fr]">
        <Meter
          legend={t("verdict.money")}
          value={be === null ? null : Math.min(be, 1.2) / 1.2}
          reading={
            be === null ? "—" : `${d.breakEvenTickets} / ${d.inputs.capacity}`
          }
          sub={
            be === null ? undefined : `${pct(be)} ${t("verdict.ofCapacity")}`
          }
          zones={[
            { from: 0, to: warn / 1.2, tone: "green" },
            { from: warn / 1.2, to: refuse / 1.2, tone: "amber" },
            { from: refuse / 1.2, to: 1, tone: "red" },
          ]}
          ticks={[0, warn / 1.2, refuse / 1.2, 1 / 1.2, 1]}
          tickLabels={["0", pct(warn), pct(refuse), "100%", "+"]}
        />

        <Plate className="flex flex-col justify-between">
          <div>
            <h2 className="flex items-center gap-3 font-condensed text-2xl font-semibold uppercase tracking-wide">
              <VerdictLamp status={verdict.status} size={32} />
              {t(`verdict.status.${verdict.status}`)}
            </h2>
            <p className="mt-3 text-balance font-medium">{verdict.headline}</p>
            <p className="mt-2 text-legend">
              {offer.artist} · {offer.city} · {offer.capacity} cap ·{" "}
              {money(offer.ticketPrice)} · {money(offer.guarantee)} guarantee
            </p>
          </div>
          <ul className="mt-4 grid gap-1.5">
            {verdict.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
            {verdict.abstentions.map((a) => (
              <li key={a.code} className="text-lamp-blue">
                {a.message}
              </li>
            ))}
          </ul>
        </Plate>

        <Meter
          legend={t("verdict.signal")}
          value={aff ? affinityIndex[aff.label] : null}
          reading={aff ? `${aff.mean}` : "—"}
          sub={
            aff
              ? `${aff.label} · ${t("verdict.cells", { count: aff.cells })}`
              : undefined
          }
          zones={[
            { from: 0, to: 0.33, tone: "red" },
            { from: 0.33, to: 0.66, tone: "amber" },
            { from: 0.66, to: 1, tone: "green" },
          ]}
          ticks={[0.17, 0.5, 0.83]}
          tickLabels={["low", "mid", "strong"]}
          muted={!aff}
          mutedText={t("verdict.noSignal")}
        />
      </div>

      {/* Patch bay and stencil */}
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="on-ground grid gap-3">
          {verdict.fixes.length > 0 ? (
            <>
              <h2 className="legend">{t("verdict.fixes")}</h2>
              {verdict.fixes.map((f) => (
                <FixView key={f.kind} fix={f} />
              ))}
            </>
          ) : (
            <MoneyTable verdict={verdict} />
          )}
        </div>
        <Stencil
          legend={t("verdict.cannot")}
          items={verdict.cannotEstablish.map((c) => t(`cannot.${c}`))}
        />
      </div>

      {verdict.fixes.length > 0 && <MoneyTable verdict={verdict} />}

      {/* Evidence rack */}
      <Plate legend={t("verdict.evidence")}>
        <p className="mb-3 text-legend">{ev.sourceNote}</p>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="grid content-start gap-2">
            {ev.entity && (
              <Row
                k={t("verdict.entity")}
                v={`${ev.entity.name} (${ev.entity.type})`}
              />
            )}
            {ev.demographics && (
              <Row
                k={t("verdict.demographics")}
                v={Object.entries(ev.demographics.age)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 2)
                  .map(([k, v]) => `${k.replaceAll("_", " ")} ${pct(v)}`)
                  .join(", ")}
              />
            )}
            {ev.tasteTags.length > 0 && (
              <Row
                k={t("verdict.tags")}
                v={ev.tasteTags.slice(0, 6).join(", ")}
              />
            )}
          </div>
          <CandidateList title={t("verdict.openers")} items={ev.openers} />
          <CandidateList title={t("verdict.sponsors")} items={ev.sponsors} />
          <CandidateList title={t("verdict.places")} items={ev.places} />
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-legend">
          {ev.coverage.map((c) => (
            <li key={c.code} className="inline-flex items-center gap-1.5">
              <Lamp tone={c.ok ? "green" : "amber"} size={10} />
              {c.detail}
            </li>
          ))}
        </ul>
      </Plate>

      {baseline && <BaselineView baseline={baseline} />}

      {/* Back panel */}
      <details className="plate p-4">
        <summary className="legend cursor-pointer list-none">
          {t("verdict.trace")} · {ev.trace.length}
        </summary>
        {ev.trace.length === 0 ? (
          <p className="mt-2 text-legend">{t("verdict.noTrace")}</p>
        ) : (
          <ol className="mt-3 grid gap-2">
            {ev.trace.map((e) => (
              <li
                key={e.id}
                className="grid grid-cols-[3rem_4rem_1fr] gap-2 break-all"
              >
                <span className={e.ok ? "text-lamp-green" : "text-lamp-red"}>
                  {e.status}
                </span>
                <span className="text-legend">
                  {e.ms}ms{e.cached ? " ·c" : ""}
                </span>
                <span>
                  GET {e.path}?{new URLSearchParams(e.params).toString()}
                  {e.error ? ` — ${e.error}` : ""}
                  {typeof e.resultCount === "number"
                    ? ` → ${e.resultCount}`
                    : ""}
                </span>
              </li>
            ))}
          </ol>
        )}
      </details>
    </section>
  );
}

function MoneyTable({ verdict }: { verdict: Verdict }) {
  const d = verdict.deal;
  return (
    <Plate legend={t("verdict.money")}>
      <div className="grid gap-1.5 md:grid-cols-2 md:gap-x-8">
        <Row k={t("verdict.netPerTicket")} v={money(d.netPerTicket, true)} />
        <Row k={t("verdict.fixedCosts")} v={money(d.totalFixedCost)} />
        <Row k={t("verdict.selloutNet")} v={money(d.selloutNet)} />
        {d.netAtPctSold.map((p) => (
          <Row
            key={p.pct}
            k={t("verdict.netAt", { pct: pct(p.pct) })}
            v={money(p.net)}
            muted
          />
        ))}
      </div>
      {d.violations.map((v) => (
        <p key={v.code} className="mt-3 text-lamp-red">
          {v.detail}
        </p>
      ))}
    </Plate>
  );
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${muted ? "text-legend" : ""}`}>
      <span>{k}</span>
      <span className="text-right font-condensed text-base">{v}</span>
    </div>
  );
}

/** Candidates rank by affinity; the mark grows with the deflection, the type stays one size. */
function CandidateList({
  title,
  items,
}: {
  title: string;
  items: Candidate[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="legend">{title}</p>
      <ul className="mt-1.5 grid gap-1">
        {items.slice(0, 4).map((c) => {
          const a = typeof c.affinity === "number" ? c.affinity : 0.5;
          return (
            <li key={c.id} className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2">
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  className="shrink-0"
                >
                  <circle
                    cx="7"
                    cy="7"
                    r={(2 + a * 5).toFixed(1)}
                    fill="var(--lamp-blue)"
                  />
                </svg>
                {c.name}
              </span>
              {typeof c.affinity === "number" && (
                <span className="font-condensed text-legend">
                  {c.affinity.toFixed(2)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FixView({ fix }: { fix: Fix }) {
  const tone =
    fix.kind === "opener" ? "blue" : fix.kind === "sponsor" ? "amber" : "green";
  return (
    <PatchPoint tone={tone} title={fix.title}>
      <p className="text-legend">{fix.detail}</p>
      {fix.kind !== "market" && (
        <div className="mt-3">
          <CandidateList title="" items={fix.candidates} />
        </div>
      )}
      {fix.kind === "sponsor" && (
        <div className="mt-3 grid gap-1">
          <Row
            k={`With ${money(fix.assumption.low)} offset`}
            v={`${fix.dealAtLow.breakEvenTickets} (${pct(fix.dealAtLow.breakEvenCapacityPct)})`}
          />
          <Row
            k={`With ${money(fix.assumption.high)} offset`}
            v={`${fix.dealAtHigh.breakEvenTickets} (${pct(fix.dealAtHigh.breakEvenCapacityPct)})`}
          />
          <p className="text-legend">{fix.assumption.label}</p>
        </div>
      )}
      {fix.kind === "market" && fix.sharedTags && fix.sharedTags.length > 0 && (
        <p className="mt-2 text-legend">
          {t("verdict.sharedTags")}: {fix.sharedTags.join(", ")}
        </p>
      )}
    </PatchPoint>
  );
}

function BaselineView({ baseline }: { baseline: BaselineComparison }) {
  return (
    <Plate legend={t("baseline.title")}>
      <p className="text-legend">
        {baseline.note}
        {baseline.model ? ` · ${baseline.model}` : ""}
      </p>
      {baseline.overlap && baseline.guess && (
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div>
            <p className="legend">{t("baseline.affinity")}</p>
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
        <p className="mt-3 text-legend">{baseline.guess.reasoning}</p>
      )}
    </Plate>
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
    <div>
      <p className="legend">
        {title} ·{" "}
        {o.pct === null ? "n/a" : `${o.pct}% ${t("baseline.overlap")}`}
      </p>
      <ul className="mt-1 grid gap-0.5">
        {o.shared.map((n) => (
          <li key={`s-${n}`} className="text-lamp-green">
            {n}
          </li>
        ))}
        {o.modelOnly.map((n) => (
          <li key={`m-${n}`} className="text-legend">
            {n} · {t("baseline.modelOnly")}
          </li>
        ))}
        {o.qlooOnly.map((n) => (
          <li key={`q-${n}`} className="text-lamp-blue">
            {n} · {t("baseline.qlooOnly")}
          </li>
        ))}
      </ul>
    </div>
  );
}
