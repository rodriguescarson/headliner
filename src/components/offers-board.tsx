"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { money, pct } from "@/lib/deal/deal-math";
import { parseOfferLine } from "@/lib/deal/offer-parser";
import { VERDICT_STATUS, type VerdictStatus } from "@/lib/enums";
import { t } from "@/lib/i18n";
import type { JobRecord } from "@/lib/jobs/store";
import type { Verdict } from "@/lib/verdict/verdict";
import { useFlipIn } from "./motion/reveal";
import { Dot, StatusBadge, statusTone } from "./status";

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
      next: string | null;
    }
  | { phase: "failed" };

/** The board: fixed columns, live rows. Columns never move; rows carry the state as each check lands. */
export function OffersBoard({ rows, note }: { rows: Row[]; note?: string }) {
  const [states, setStates] = useState<RowState[]>(
    rows.map(() => ({ phase: "idle" })),
  );
  const [busy, setBusy] = useState(false);
  const router = useRouter();
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
                        next:
                          v.status === "abstained"
                            ? t("board.nextAbstain")
                            : nextMove(v.fixes),
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

  // /board?run=all starts the run on load: a link that shows every offer checked live, in one click.
  const autoRan = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    if (autoRan.current) return;
    autoRan.current = true;
    if (new URLSearchParams(window.location.search).get("run") === "all")
      void runAll();
  }, []);

  const done = states.filter((s) => s.phase === "done") as Extract<
    RowState,
    { phase: "done" }
  >[];
  const counts = VERDICT_STATUS.map((status) => ({
    status,
    n: done.filter((d) => d.status === status).length,
  }));

  return (
    <div className="grid gap-4">
      {/* Summary strip above the table, action on the right (Mercury, Polar) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <output className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-medium">
            {t("board.checked", { done: done.length, total: rows.length })}
          </span>
          {done.length > 0 &&
            counts.map((c) => (
              <span key={c.status} className="text-muted-foreground">
                <Dot tone={statusTone[c.status]}>
                  {t(`verdict.status.${c.status}`)}{" "}
                  <span className="font-mono text-foreground tabular-nums">
                    {c.n}
                  </span>
                </Dot>
              </span>
            ))}
        </output>
        <Button type="button" onClick={runAll} disabled={busy}>
          {busy ? t("board.running") : t("board.runAll")}
        </Button>
      </div>
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
      <Card className="overflow-x-auto py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>{t("board.act")}</TableHead>
              <TableHead>{t("board.city")}</TableHead>
              <TableHead className="text-right">{t("board.cap")}</TableHead>
              <TableHead className="text-right">{t("board.ticket")}</TableHead>
              <TableHead className="text-right">
                {t("board.guarantee")}
              </TableHead>
              <TableHead className="text-right">
                {t("board.breakEven")}
              </TableHead>
              <TableHead>{t("board.signal")}</TableHead>
              <TableHead>{t("board.state")}</TableHead>
              <TableHead>{t("board.next")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => {
              const p = parsed[i];
              const s = states[i];
              const o = p.ok ? p.offer : null;
              return (
                <TableRow
                  key={r.line}
                  className="cursor-pointer"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("a")) return;
                    router.push(`/?line=${encodeURIComponent(r.line)}`);
                  }}
                >
                  <TableCell className="font-mono text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/?line=${encodeURIComponent(r.line)}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {o?.artist ?? r.label}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {r.label}
                    </span>
                  </TableCell>
                  <TableCell>{o?.city ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {o ? o.capacity.toLocaleString("en-US") : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {o ? money(o.ticketPrice) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {o ? money(o.guarantee) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {s.phase === "done" && Number.isFinite(s.breakEvenPct)
                      ? pct(s.breakEvenPct)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {s.phase === "done"
                      ? (s.affinity ?? t("verdict.noSignal"))
                      : "—"}
                  </TableCell>
                  <StateCell phase={s.phase}>
                    {s.phase === "done" ? (
                      <StatusBadge status={s.status} />
                    ) : s.phase === "failed" ? (
                      <Dot tone="destructive">{t("board.failed")}</Dot>
                    ) : s.phase === "idle" ? (
                      <Dot tone="muted">{t("board.notRun")}</Dot>
                    ) : (
                      <Dot tone="warning">
                        {s.phase === "running"
                          ? t("desk.running")
                          : t("desk.queued")}
                      </Dot>
                    )}
                  </StateCell>
                  <TableCell className="text-sm">
                    {s.phase === "done" ? (s.next ?? "—") : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

/** The first fix as a short instruction, so the board reads as a to-do list, not a scoreboard. */
function nextMove(fixes: Verdict["fixes"]): string | null {
  const f = fixes[0];
  if (!f) return null;
  if (f.kind === "counter")
    return t("scenario.guarantee", { amount: money(f.guarantee) });
  if (f.kind === "market" && f.altCity)
    return t("scenario.market", { city: f.altCity });
  if (f.kind === "opener" && f.candidates[0])
    return t("scenario.opener", { opener: f.candidates[0].name });
  return f.title;
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
    <TableCell ref={ref as React.RefObject<HTMLTableCellElement>}>
      {children}
    </TableCell>
  );
}
