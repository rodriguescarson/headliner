"use client";

import { type FormEvent, useId, useState } from "react";
import type { CheckResponse } from "@/lib/check";
import { t } from "@/lib/i18n";
import { VerdictView } from "./verdict-view";

type Props = {
  samples: { label: string; line: string }[];
  rulesVersion: string;
};

export function OfferDesk({ samples, rulesVersion }: Props) {
  const [line, setLine] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckResponse | null>(null);
  const inputId = useId();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!line.trim() || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ line }),
      });
      setResult((await res.json()) as CheckResponse);
    } catch (err) {
      setResult({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8">
      <form
        onSubmit={submit}
        className="rounded-lg border border-line bg-surface p-4 md:p-6"
      >
        <label htmlFor={inputId} className="block text-sm font-medium">
          {t("desk.title")}
        </label>
        <textarea
          id={inputId}
          value={line}
          onChange={(e) => setLine(e.target.value)}
          placeholder={t("desk.placeholder")}
          rows={2}
          className="mt-2 w-full resize-y rounded-md border border-line bg-background px-3 py-2 font-mono text-sm leading-6 outline-none focus:border-accent"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy || !line.trim()}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink disabled:opacity-50"
          >
            {busy ? t("desk.checking") : t("desk.submit")}
          </button>
          <details className="text-sm">
            <summary className="cursor-pointer text-muted underline-offset-4 hover:underline">
              {t("desk.samples")}
            </summary>
            <ul className="mt-2 grid gap-1">
              {samples.map((s) => (
                <li key={s.line}>
                  <button
                    type="button"
                    className="text-left text-calm underline-offset-4 hover:underline"
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
          <p className="mt-3 text-sm text-bad" role="alert">
            {result.missing?.length
              ? t("desk.missing", { fields: result.missing.join(", ") })
              : result.error}
          </p>
        )}
      </form>

      {result?.ok && (
        <VerdictView verdict={result.verdict} offer={result.offer} />
      )}

      <p className="text-xs text-muted">
        {t("verdict.rules")}: <span className="font-mono">{rulesVersion}</span>
      </p>
    </div>
  );
}
