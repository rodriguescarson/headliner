"use client";

import Link from "next/link";
import { useState } from "react";
import { money, pct } from "@/lib/deal/deal-math";
import { parseOfferLine } from "@/lib/deal/offer-parser";
import type { VerdictStatus } from "@/lib/enums";
import { t } from "@/lib/i18n";
import type { JobRecord } from "@/lib/jobs/store";
import { Lamp, Screws, VerdictLamp } from "./console";
import { useFlipIn } from "./motion/reveal";

type Row = { label: string; line: string };
type RowState =
  | { phase: "idle" }
  | { phase: "queued" | "running" }
  | {
      phase: "done";
      status: VerdictStatus;
      breakEvenPct: number;
      affinity: string | null;
      headline: string;
    }
  | { phase: "failed" };

/** The board: fixed columns, live rows. Columns never move; rows carry the state as each check lands. */
export function OffersBoard({ rows, note }: { rows: Row[]; note?: string }) {
  const [states, setStates] = useState<RowState[]>(
    rows.map(() => ({ phase: "idle" })),
  );
  const [busy, setBusy] = useState(false);
  const parsed = rows.map((r) => parseOfferLine(r.line));

  async function runAll() {
    if (busy) return;
    setBusy(true);
    setStates(rows.map(() => ({ phase: "queued" })));
    await Promise.all(
      rows.map(async (r, i) => {
        try {
          const res = await fetch("/api/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ line: r.line }),
          });
          const body = (await res.json()) as { ok: boolean; id?: string };
          if (!res.ok || !body.id) throw new Error("enqueue");
          for (let n = 0; n < 90; n += 1) {
            const job = (await (
              await fetch(`/api/jobs/${body.id}`)
            ).json()) as JobRecord;
            if (job.status === "done" && job.result?.ok) {
              const v = job.result.verdict;
              setStates((s) =>
                s.map((x, j) =>
                  j === i
                    ? {
                        phase: "done",
                        status: v.status,
                        breakEvenPct: v.deal.breakEvenCapacityPct,
                        affinity: v.evidence.localAffinity?.label ?? null,
                        headline: v.headline,
                      }
                    : x,
                ),
              );
              return;
            }
            if (
              job.status === "failed" ||
              (job.status === "done" && !job.result?.ok)
            )
              throw new Error("job");
            setStates((s) =>
              s.map((x, j) =>
                j === i
                  ? { phase: job.status === "running" ? "running" : "queued" }
                  : x,
              ),
            );
            await new Promise((r2) => setTimeout(r2, 800));
          }
          throw new Error("timeout");
        } catch {
          setStates((s) =>
            s.map((x, j) => (j === i ? { phase: "failed" } : x)),
          );
        }
      }),
    );
    setBusy(false);
  }

  const done = states.filter((s) => s.phase === "done") as Extract<
    RowState,
    { phase: "done" }
  >[];
  const tally = done.length
    ? `${done.length} checked · ${done.filter((d) => d.status === "cleared").length} cleared · ${done.filter((d) => d.status === "fix_required").length} fix required · ${done.filter((d) => d.status === "refused").length} refused · ${done.filter((d) => d.status === "abstained").length} abstained`
    : null;

  return (
    <div className="grid gap-4">
      <div className="on-ground flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={runAll}
          disabled={busy}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-action px-5 font-display text-base font-semibold text-action-ink shadow-panel disabled:opacity-50"
        >
          {busy ? t("board.running") : t("board.runAll")}
        </button>
        {tally && <output className="legend">{tally}</output>}
      </div>
      {note && <p className="on-ground">{note}</p>}
      <div className="plate relative overflow-x-auto p-3">
        <Screws />
        <table className="w-full text-left">
          <thead>
            <tr className="legend">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">{t("board.act")}</th>
              <th className="px-3 py-2 font-medium">{t("board.city")}</th>
              <th className="px-3 py-2 text-right font-medium">
                {t("board.cap")}
              </th>
              <th className="px-3 py-2 text-right font-medium">
                {t("board.ticket")}
              </th>
              <th className="px-3 py-2 text-right font-medium">
                {t("board.guarantee")}
              </th>
              <th className="px-3 py-2 text-right font-medium">
                {t("board.breakEven")}
              </th>
              <th className="px-3 py-2 font-medium">{t("board.signal")}</th>
              <th className="px-3 py-2 font-medium">{t("board.state")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const p = parsed[i];
              const s = states[i];
              const o = p.ok ? p.offer : null;
              return (
                <tr key={r.line} className="border-t border-rail align-middle">
                  <td className="px-3 py-2 font-display text-legend">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/?line=${encodeURIComponent(r.line)}`}
                      className="underline underline-offset-4"
                    >
                      {o?.artist ?? r.label}
                    </Link>
                    <span className="block text-legend">{r.label}</span>
                  </td>
                  <td className="px-3 py-2">{o?.city ?? "—"}</td>
                  <td className="px-3 py-2 text-right font-display">
                    {o ? o.capacity.toLocaleString("en-US") : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-display">
                    {o ? money(o.ticketPrice) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-display">
                    {o ? money(o.guarantee) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-display">
                    {s.phase === "done" && Number.isFinite(s.breakEvenPct)
                      ? pct(s.breakEvenPct)
                      : "—"}
                  </td>
                  <td className="px-3 py-2 font-display">
                    {s.phase === "done"
                      ? (s.affinity ?? t("verdict.noSignal"))
                      : "—"}
                  </td>
                  <StateCell phase={s.phase}>
                    {s.phase === "done" ? (
                      <VerdictLamp
                        status={s.status}
                        label={t(`verdict.status.${s.status}`)}
                        size={14}
                      />
                    ) : s.phase === "failed" ? (
                      <Lamp tone="red" label={t("board.failed")} size={12} />
                    ) : s.phase === "idle" ? (
                      <Lamp tone="off" label={t("board.notRun")} size={12} />
                    ) : (
                      <Lamp
                        tone="amber"
                        label={
                          s.phase === "running"
                            ? t("desk.running")
                            : t("desk.queued")
                        }
                        size={12}
                      />
                    )}
                  </StateCell>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StateCell({
  phase,
  children,
}: {
  phase: RowState["phase"];
  children: React.ReactNode;
}) {
  const ref = useFlipIn([phase]);
  return (
    <td
      ref={ref as React.RefObject<HTMLTableCellElement>}
      className="px-3 py-2"
    >
      {children}
    </td>
  );
}
