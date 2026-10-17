import { money, pct } from "@/lib/deal/deal-math";
import type { Offer } from "@/lib/deal/offer-parser";
import { t } from "@/lib/i18n";
import type { Candidate } from "@/lib/qloo/evidence";
import type { Fix, Verdict } from "@/lib/verdict/verdict";

const statusTone: Record<Verdict["status"], string> = {
  cleared: "text-ok border-ok/40",
  fix_required: "text-warn border-warn/40",
  refused: "text-bad border-bad/40",
  abstained: "text-calm border-calm/40",
};

export function VerdictView({
  verdict,
  offer,
}: {
  verdict: Verdict;
  offer: Offer;
}) {
  const d = verdict.deal;
  return (
    <section aria-live="polite" className="grid gap-6">
      <div
        className={`rounded-lg border bg-surface p-4 md:p-6 ${statusTone[verdict.status]}`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide">
          {t(`verdict.status.${verdict.status}`)}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-foreground">
          {verdict.headline}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {offer.artist} · {offer.city} · {offer.capacity} cap ·{" "}
          {money(offer.ticketPrice)} ticket · {money(offer.guarantee)} guarantee
        </p>
        <ul className="mt-3 grid gap-1 text-sm text-foreground">
          {verdict.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
          {verdict.abstentions.map((a) => (
            <li key={a.code} className="text-calm">
              {a.message}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card title={t("verdict.money")}>
          <Row k={t("verdict.netPerTicket")} v={money(d.netPerTicket, true)} />
          <Row k={t("verdict.fixedCosts")} v={money(d.totalFixedCost)} />
          <Row
            k={t("verdict.breakEven")}
            v={
              Number.isFinite(d.breakEvenCapacityPct)
                ? `${d.breakEvenTickets} / ${d.inputs.capacity} (${pct(d.breakEvenCapacityPct)})`
                : "n/a"
            }
          />
          <Row k={t("verdict.selloutNet")} v={money(d.selloutNet)} />
          {d.netAtPctSold.map((p) => (
            <Row
              key={p.pct}
              k={t("verdict.netAt", { pct: pct(p.pct) })}
              v={money(p.net)}
              muted
            />
          ))}
          {d.violations.map((v) => (
            <p key={v.code} className="mt-2 text-sm text-bad">
              {v.detail}
            </p>
          ))}
        </Card>

        <Card title={t("verdict.evidence")} note={verdict.evidence.sourceNote}>
          {verdict.evidence.entity && (
            <Row
              k="Entity"
              v={`${verdict.evidence.entity.name} (${verdict.evidence.entity.type})`}
            />
          )}
          {verdict.evidence.localAffinity && (
            <Row
              k={t("verdict.affinity")}
              v={`${verdict.evidence.localAffinity.label} · mean ${verdict.evidence.localAffinity.mean} · ${verdict.evidence.localAffinity.cells} cells`}
            />
          )}
          {verdict.evidence.demographics && (
            <Row
              k={t("verdict.demographics")}
              v={Object.entries(verdict.evidence.demographics.age)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 2)
                .map(([k, v]) => `${k.replaceAll("_", " ")} ${pct(v)}`)
                .join(", ")}
            />
          )}
          {verdict.evidence.tasteTags.length > 0 && (
            <Row
              k={t("verdict.tags")}
              v={verdict.evidence.tasteTags.slice(0, 6).join(", ")}
            />
          )}
          <CandidateList
            title={t("verdict.openers")}
            items={verdict.evidence.openers}
          />
          <CandidateList
            title={t("verdict.sponsors")}
            items={verdict.evidence.sponsors}
          />
          <CandidateList
            title={t("verdict.places")}
            items={verdict.evidence.places}
          />
          <ul className="mt-3 grid gap-1 text-xs text-muted">
            {verdict.evidence.coverage.map((c) => (
              <li key={c.code}>
                <span className={c.ok ? "text-ok" : "text-warn"}>
                  {c.ok ? "ok" : "gap"}
                </span>{" "}
                {c.detail}
              </li>
            ))}
          </ul>
        </Card>

        <Card title={t("verdict.cannot")}>
          <ul className="grid gap-1 text-sm">
            {verdict.cannotEstablish.map((c) => (
              <li key={c}>{t(`cannot.${c}`)}</li>
            ))}
          </ul>
        </Card>
      </div>

      {verdict.fixes.length > 0 && (
        <div className="grid gap-4">
          <h3 className="text-lg font-semibold">{t("verdict.fixes")}</h3>
          {verdict.fixes.map((f) => (
            <FixView key={f.kind} fix={f} />
          ))}
        </div>
      )}

      <details className="rounded-lg border border-line bg-surface p-4">
        <summary className="cursor-pointer text-sm font-medium">
          {t("verdict.trace")} ({verdict.evidence.trace.length})
        </summary>
        {verdict.evidence.trace.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{t("verdict.noTrace")}</p>
        ) : (
          <ol className="mt-2 grid gap-2 font-mono text-xs">
            {verdict.evidence.trace.map((e) => (
              <li key={e.id} className="break-all">
                <span className={e.ok ? "text-ok" : "text-bad"}>
                  {e.status}
                </span>{" "}
                {e.ms}ms{e.cached ? " cached" : ""} GET {e.path}?
                {new URLSearchParams(e.params).toString()}
                {e.error ? ` — ${e.error}` : ""}
                {typeof e.resultCount === "number"
                  ? ` → ${e.resultCount} results`
                  : ""}
              </li>
            ))}
          </ol>
        )}
      </details>
    </section>
  );
}

function Card({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
      <div className="mt-3 grid gap-1">{children}</div>
    </div>
  );
}

function Row({ k, v, muted }: { k: string; v: string; muted?: boolean }) {
  return (
    <div
      className={`flex justify-between gap-3 text-sm ${muted ? "text-muted" : ""}`}
    >
      <span>{k}</span>
      <span className="text-right font-mono">{v}</span>
    </div>
  );
}

function CandidateList({
  title,
  items,
}: {
  title: string;
  items: Candidate[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-2">
      <p className="text-xs font-medium text-muted">{title}</p>
      <ul className="mt-1 grid gap-0.5 text-sm">
        {items.slice(0, 4).map((c) => (
          <li key={c.id} className="flex justify-between gap-3">
            <span>{c.name}</span>
            {typeof c.affinity === "number" && (
              <span className="font-mono text-muted">
                {c.affinity.toFixed(2)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FixView({ fix }: { fix: Fix }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="text-sm font-semibold">{fix.title}</p>
      <p className="mt-1 text-sm text-muted">{fix.detail}</p>
      {fix.kind !== "market" && (
        <CandidateList title="" items={fix.candidates} />
      )}
      {fix.kind === "sponsor" && (
        <div className="mt-3 grid gap-1 text-sm">
          <Row
            k={`With ${money(fix.assumption.low)} offset`}
            v={`${fix.dealAtLow.breakEvenTickets} tickets (${pct(fix.dealAtLow.breakEvenCapacityPct)})`}
          />
          <Row
            k={`With ${money(fix.assumption.high)} offset`}
            v={`${fix.dealAtHigh.breakEvenTickets} tickets (${pct(fix.dealAtHigh.breakEvenCapacityPct)})`}
          />
          <p className="text-xs text-muted">{fix.assumption.label}</p>
        </div>
      )}
    </div>
  );
}
