"use client";

import { ChevronDown, Play } from "lucide-react";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import type { CheckResponse } from "@/lib/check";
import { t } from "@/lib/i18n";
import type { JobRecord } from "@/lib/jobs/store";
import { Legend, Screws } from "./console";
import { VerdictView } from "./verdict-view";

type Props = {
  samples: { label: string; line: string }[];
  samplesNote?: string;
  rulesVersion: string;
};
type Phase = "idle" | "queued" | "running" | "done";

export function OfferDesk({ samples, samplesNote, rulesVersion }: Props) {
  const [line, setLine] = useState("");
  const [baseline, setBaseline] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<CheckResponse | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
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
    if (fromHash && !jobId) {
      setJobId(fromHash[1]);
      setPhase("queued");
    }
  }, [jobId]);

  useEffect(() => {
    if (phase === "done" && result?.ok)
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [phase, result]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!line.trim() || busy) return;
    setResult(null);
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
            className="glass w-full resize-y px-4 py-3 font-condensed text-lg leading-7 outline-none focus-visible:outline-2"
          />
          <button
            type="submit"
            disabled={busy || !line.trim()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-action px-5 font-condensed text-base font-semibold uppercase tracking-wider text-action-ink shadow-panel transition-transform duration-150 hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play size={16} strokeWidth={2.25} aria-hidden />
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
          <details className="group">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-lamp-blue underline-offset-4 hover:underline">
              {t("desk.samples")}
              <ChevronDown
                size={14}
                className="transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            {samplesNote && <p className="mt-2 text-legend">{samplesNote}</p>}
            <ul className="mt-2 grid gap-1 md:grid-cols-2">
              {samples.map((s, i) => (
                <li key={s.line} className="flex items-baseline gap-3">
                  <span className="legend w-6 shrink-0 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    className="text-left underline-offset-4 hover:underline"
                    onClick={() => setLine(s.line)}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </details>
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
        {result?.ok && (
          <VerdictView
            verdict={result.verdict}
            offer={result.offer}
            baseline={result.baseline}
          />
        )}
      </div>

      <p className="text-legend">
        <Legend>{t("desk.rules")}</Legend>{" "}
        <span className="ml-2 font-condensed">{rulesVersion}</span>
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
