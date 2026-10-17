"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <Card className="mx-auto w-full max-w-3xl shadow-sm">
        <CardContent>
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor={inputId} className="sr-only">
                {t("desk.strip")}
              </Label>
              <Textarea
                id={inputId}
                value={line}
                onChange={(e) => setLine(e.target.value)}
                placeholder={t("desk.placeholder")}
                rows={2}
                className="min-h-24 resize-y text-base md:text-base"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={baselineId}
                  checked={baseline}
                  onCheckedChange={(c) => setBaseline(c === true)}
                />
                <Label
                  htmlFor={baselineId}
                  className="font-normal text-muted-foreground"
                >
                  {t("desk.baselineToggle")}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/board"
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  {t("desk.board")}
                </Link>
                <Button type="submit" size="lg" disabled={busy || !line.trim()}>
                  {submitLabel}
                </Button>
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
          </form>
        </CardContent>
      </Card>

      <p className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>
          {t("desk.rules")} <span className="font-mono">{rulesVersion}</span>
        </span>
        <span aria-hidden="true">·</span>
        <Link
          href="/suite"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("desk.suiteLink")}
        </Link>
      </p>

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
