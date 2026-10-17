"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import type { CheckResponse } from "@/lib/check";
import { t } from "@/lib/i18n";
import type { JobRecord } from "@/lib/jobs/store";
import type { Scenario } from "@/lib/scenario";
import { Legend, Screws } from "./console";
import { ScenarioCompare } from "./scenario-compare";
import { ShareButton } from "./share-button";
import { VerdictView } from "./verdict-view";

type Props = { rulesVersion: string };
type Phase = "idle" | "queued" | "running" | "done";

export function OfferDesk({ rulesVersion }: Props) {
  const [line, setLine] = useState("");
  const [baseline, setBaseline] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [scenarioResult, setScenarioResult] = useState<CheckResponse | null>(
    null,
  );
  const [scenarioBusy, setScenarioBusy] = useState(false);
  const inputId = useId();
  const resultRef = useRef<HTMLDivElement>(null);
  const busy = phase === "queued" || phase === "running";

  // Poll the queued job until it settles. The job id survives a refresh via the URL hash.
  useEffect(() => {
    if (!jobId || phase === "done" || phase === "idle") return;
    let cancelled = false;
    const tick = async () => {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) {
        if (!cancelled) {
          setResult({ ok: false, error: t("auth.error") });
          setPhase("done");
        }
        return;
      }
      const job = (await res.json()) as JobRecord;
      if (cancelled) return;
      if (job.status === "done" && job.result) {
        setResult(job.result);
        setPhase("done");
      } else if (job.status === "failed") {
        setResult({ ok: false, error: job.error ?? t("auth.error") });
        setPhase("done");
      } else {
        setPhase(job.status === "running" ? "running" : "queued");
        setTimeout(tick, 700);
      }
    };
    void tick();
    return () => {
      cancelled = true;
    };
  }, [jobId, phase]);

  useEffect(() => {
    const fromHash = window.location.hash.match(/^#job=([A-Za-z0-9_-]{6,})$/);
    const fromQuery = new URLSearchParams(window.location.search).get("line");
    if (fromQuery && !line) setLine(fromQuery.slice(0, 500));
    if (fromHash && !jobId) {
      setJobId(fromHash[1]);
      setPhase("queued");
    }
  }, [jobId, line]);

  useEffect(() => {
    if (phase === "done" && result?.ok)
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [phase, result]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!line.trim() || busy) return;
    setResult(null);
    setScenario(null);
    setScenarioResult(null);
    setPhase("queued");
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ line, baseline }),
    });
    const body = (await res.json()) as {
      ok: boolean;
      id?: string;
      error?: string;
      missing?: string[];
    };
    if (!res.ok || !body.id) {
      setResult({
        ok: false,
        error: body.error ?? t("auth.error"),
        missing: body.missing,
      });
      setPhase("done");
      return;
    }
    window.history.replaceState(null, "", `#job=${body.id}`);
    setJobId(body.id);
  }

  async function runScenario(sc: Scenario) {
    if (!result?.ok || scenarioBusy) return;
    setScenario(sc);
    setScenarioResult(null);
    setScenarioBusy(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line, scenario: sc }),
      });
      const body = (await res.json()) as {
        ok: boolean;
        id?: string;
        error?: string;
      };
      if (!res.ok || !body.id) throw new Error(body.error ?? "scenario");
      for (let i = 0; i < 60; i += 1) {
        const job = (await (
          await fetch(`/api/jobs/${body.id}`)
        ).json()) as JobRecord;
        if (job.status === "done" && job.result) {
          setScenarioResult(job.result);
          return;
        }
        if (job.status === "failed") throw new Error(job.error ?? "scenario");
        await new Promise((r) => setTimeout(r, 700));
      }
      throw new Error("timeout");
    } catch {
      setScenarioResult({ ok: false, error: t("auth.error") });
    } finally {
      setScenarioBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={submit} className="plate relative p-5 md:p-6">
        <Screws />
        <h1 className="legend">{t("desk.title")}</h1>
        <label htmlFor={inputId} className="mt-3 block">
          {t("desk.intro")}
        </label>
        <div className="mt-2 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <textarea
            id={inputId}
            value={line}
            onChange={(e) => setLine(e.target.value)}
            placeholder={t("desk.placeholder")}
            rows={2}
            className="glass w-full resize-y px-4 py-3 font-display text-lg leading-7 outline-none focus-visible:outline-2"
          />
          <button
            type="submit"
            disabled={busy || !line.trim()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-action px-5 font-display text-base font-semibold text-action-ink shadow-panel transition-transform duration-150 hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {phase === "queued"
              ? t("desk.queued")
              : phase === "running"
                ? t("desk.running")
                : t("desk.submit")}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <label className="inline-flex items-center gap-2 text-legend">
            <input
              type="checkbox"
              checked={baseline}
              onChange={(e) => setBaseline(e.target.checked)}
            />
            {t("desk.baselineToggle")}
          </label>
          <Link href="/board" className="underline underline-offset-4">
            {t("desk.board")}
          </Link>
        </div>
        {result && !result.ok && (
          <p className="mt-3 text-lamp-red" role="alert">
            {result.missing?.length
              ? t("desk.missing", { fields: result.missing.join(", ") })
              : result.error}
          </p>
        )}
      </form>

      <div ref={resultRef}>
        {phase === "idle" && !result && (
          <p className="on-ground">{t("desk.empty")}</p>
        )}
        {busy && <VerdictSkeleton />}
        {result?.ok && scenario && (
          <div className="mb-6">
            {scenarioBusy && (
              <p className="on-ground legend">{t("scenario.running")}</p>
            )}
            {scenarioResult && !scenarioResult.ok && (
              <p className="on-ground text-lamp-red" role="alert">
                {scenarioResult.error}
              </p>
            )}
            {scenarioResult?.ok && (
              <ScenarioCompare
                base={result.verdict}
                next={scenarioResult.verdict}
                scenario={scenario}
                offer={result.offer}
                onClose={() => {
                  setScenario(null);
                  setScenarioResult(null);
                }}
              />
            )}
          </div>
        )}
        {result?.ok && (
          <VerdictView
            verdict={result.verdict}
            offer={result.offer}
            baseline={result.baseline}
            onScenario={runScenario}
          />
        )}
        {result?.ok && jobId && (
          <div className="mt-5">
            <ShareButton jobId={jobId} />
          </div>
        )}
      </div>

      <p className="text-legend">
        <Legend>{t("desk.rules")}</Legend>{" "}
        <span className="ml-2 font-display">{rulesVersion}</span>
      </p>
    </div>
  );
}

function VerdictSkeleton() {
  return (
    <div
      className="grid gap-4 md:grid-cols-[1fr_minmax(220px,0.8fr)_1fr]"
      aria-busy="true"
      aria-live="polite"
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="glass h-56 animate-pulse opacity-60" />
      ))}
    </div>
  );
}
