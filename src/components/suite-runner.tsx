"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";
import type { SuiteResult } from "@/lib/qloo/suite";
import { Lamp, Screws } from "./console";

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
    <div className="mt-6 grid gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-action px-5 font-display text-base font-semibold text-action-ink shadow-panel disabled:opacity-50"
        >
          {busy ? t("suite.running") : t("suite.run")}
        </button>
        <span
          className={`legend ${mode === "live" ? "text-lamp-green" : "text-lamp-amber"}`}
        >
          {mode === "live" ? t("app.liveBanner") : t("app.sampleBanner")}
        </span>
      </div>
      {result && (
        <div className="plate relative overflow-x-auto p-3">
          <Screws />
          <table className="w-full text-left">
            <thead>
              <tr className="legend">
                <th className="px-3 py-2 font-medium">{t("suite.endpoint")}</th>
                <th className="px-3 py-2 font-medium">{t("suite.status")}</th>
                <th className="px-3 py-2 font-medium">{t("suite.latency")}</th>
                <th className="px-3 py-2 font-medium">{t("suite.results")}</th>
                <th className="px-3 py-2 font-medium">{t("suite.params")}</th>
              </tr>
            </thead>
            <tbody>
              {result.steps.map((s) => (
                <tr key={s.name} className="border-t border-rail align-top">
                  <td className="px-3 py-2 font-display">{s.name}</td>
                  <td className="px-3 py-2">
                    {s.trace ? (
                      <Lamp
                        tone={s.trace.ok ? "green" : "red"}
                        label={String(s.trace.status)}
                        size={10}
                      />
                    ) : (
                      <Lamp tone="off" label="—" size={10} />
                    )}
                  </td>
                  <td className="px-3 py-2 font-display">
                    {s.trace
                      ? `${s.trace.ms}ms${s.trace.cached ? " cached" : ""}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 font-display">
                    {s.trace?.resultCount ?? "—"}
                  </td>
                  <td className="break-all px-3 py-2 text-legend">
                    {s.note ??
                      (s.trace
                        ? new URLSearchParams(s.trace.params).toString()
                        : "")}
                    {s.trace?.error ? ` — ${s.trace.error}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-3 py-2 text-legend">
            {result.act} · {result.city} · {result.baseUrl} · {result.startedAt}
          </p>
        </div>
      )}
    </div>
  );
}
