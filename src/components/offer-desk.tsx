"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { CheckResponse } from "@/lib/check";
import { t } from "@/lib/i18n";
import type { JobRecord } from "@/lib/jobs/store";
import type { Scenario } from "@/lib/scenario";
import { ScenarioCompare } from "./scenario-compare";
import { ShareButton } from "./share-button";
import { VerdictView } from "./verdict-view";

const MAX_LINE = 500;

type Props = { rulesVersion: string; initialLine?: string };
type Phase = "idle" | "queued" | "running" | "done";

export function OfferDesk({ rulesVersion, initialLine = "" }: Props) {
  const [line, setLine] = useState(initialLine);
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
  const baselineId = useId();
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

  const submitLabel =
    phase === "queued"
      ? t("desk.queued")
      : phase === "running"
        ? t("desk.running")
        : t("desk.submit");

  return (
    <div className="grid gap-6">
      <form onSubmit={submit} className="mx-auto grid w-full max-w-3xl gap-3">
        {/* Composer: input, option and submit share one surface (Gemini, Copilot, ElevenLabs) */}
        <div className="rounded-2xl border bg-card shadow-sm transition-shadow focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
          <Label htmlFor={inputId} className="sr-only">
            {t("desk.strip")}
          </Label>
          <Textarea
            id={inputId}
            value={line}
            maxLength={MAX_LINE}
            onChange={(e) => setLine(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={t("desk.placeholder")}
            rows={2}
            className="min-h-24 resize-none border-0 bg-transparent px-4 pt-4 text-base shadow-none focus-visible:ring-0 md:text-base dark:bg-transparent"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id={baselineId}
                checked={baseline}
                onCheckedChange={(c) => setBaseline(c === true)}
              />
              <Label
                htmlFor={baselineId}
                className="text-sm font-normal text-muted-foreground"
              >
                {t("desk.baselineToggle")}
              </Label>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <span
                className="font-mono text-xs text-muted-foreground tabular-nums"
                aria-hidden="true"
              >
                {line.length} / {MAX_LINE}
              </span>
              <Button type="submit" disabled={busy || !line.trim()}>
                {submitLabel}
              </Button>
            </div>
          </div>
        </div>
        {result && !result.ok && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              {result.missing?.length
                ? t("desk.missing", { fields: result.missing.join(", ") })
                : result.error}
            </AlertDescription>
          </Alert>
        )}
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <Link
            href="/board"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t("desk.board")}
          </Link>
          <span aria-hidden="true" className="hidden md:inline">
            ·
          </span>
          <span className="hidden md:inline">{t("desk.enterHint")}</span>
          <span aria-hidden="true">·</span>
          <span>
            {t("desk.rules")} <span className="font-mono">{rulesVersion}</span>
          </span>
        </p>
      </form>

      <div ref={resultRef} className="grid scroll-mt-20 gap-6">
        {busy && <VerdictSkeleton />}
        {result?.ok && scenario && (
          <div>
            {scenarioBusy && (
              <p className="text-sm text-muted-foreground">
                {t("scenario.running")}
              </p>
            )}
            {scenarioResult && !scenarioResult.ok && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{scenarioResult.error}</AlertDescription>
              </Alert>
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
        {result?.ok && jobId && <ShareButton jobId={jobId} />}
      </div>
    </div>
  );
}

function VerdictSkeleton() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-live="polite">
      <Skeleton className="h-40 rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  );
}
