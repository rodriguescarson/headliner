"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { t } from "@/lib/i18n";
import type { SuiteResult } from "@/lib/qloo/suite";
import { Dot } from "./status";

export function SuiteRunner({ mode }: { mode: "live" | "sample" }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SuiteResult | null>(null);

  async function run() {
    setBusy(true);
    try {
      const res = await fetch("/api/suite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      setResult((await res.json()) as SuiteResult);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <Button type="button" onClick={run} disabled={busy}>
          {busy ? t("suite.running") : t("suite.run")}
        </Button>
        <Dot
          tone={mode === "live" ? "success" : "warning"}
          className="text-sm text-muted-foreground"
        >
          {mode === "live" ? t("app.liveBanner") : t("app.sampleBanner")}
        </Dot>
      </div>
      {result && (
        <Card className="overflow-x-auto py-0">
          <Table>
            <TableCaption className="pb-3">
              {result.act} · {result.city} · {result.baseUrl} ·{" "}
              {result.startedAt}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>{t("suite.endpoint")}</TableHead>
                <TableHead>{t("suite.status")}</TableHead>
                <TableHead>{t("suite.latency")}</TableHead>
                <TableHead>{t("suite.results")}</TableHead>
                <TableHead>{t("suite.params")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.steps.map((s) => (
                <TableRow key={s.name}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    {s.trace ? (
                      <Dot tone={s.trace.ok ? "success" : "destructive"}>
                        <span className="font-mono">{s.trace.status}</span>
                      </Dot>
                    ) : (
                      <Dot tone="muted">—</Dot>
                    )}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {s.trace
                      ? `${s.trace.ms}ms${s.trace.cached ? " cached" : ""}`
                      : "—"}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {s.trace?.resultCount ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-normal break-all font-mono text-xs text-muted-foreground">
                    {s.note ??
                      (s.trace
                        ? new URLSearchParams(s.trace.params).toString()
                        : "")}
                    {s.trace?.error ? ` — ${s.trace.error}` : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
