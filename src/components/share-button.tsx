"use client";

import { Check, Copy, Link2 } from "lucide-react";
import { useState } from "react";
import { t } from "@/lib/i18n";

export function ShareButton({ jobId }: { jobId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "copied" | "error">(
    "idle",
  );

  async function share() {
    setState("busy");
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const body = (await res.json()) as { ok: boolean; url?: string };
      if (!res.ok || !body.url) throw new Error("share");
      setUrl(body.url);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
      setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("error");
    }
  }

  if (url) {
    return (
      <div className="on-ground flex flex-wrap items-center gap-3">
        <a
          href={url}
          className="font-condensed underline underline-offset-4 break-all"
        >
          {url}
        </a>
        <button
          type="button"
          onClick={copy}
          className="plate inline-flex h-9 items-center gap-2 px-3 font-condensed font-semibold uppercase tracking-wider"
        >
          {state === "copied" ? (
            <Check size={14} aria-hidden="true" />
          ) : (
            <Copy size={14} aria-hidden="true" />
          )}
          {state === "copied" ? t("share.copied") : t("share.copy")}
        </button>
      </div>
    );
  }
  return (
    <div className="on-ground flex items-center gap-3">
      <button
        type="button"
        onClick={share}
        disabled={state === "busy"}
        className="plate inline-flex h-9 items-center gap-2 px-3 font-condensed font-semibold uppercase tracking-wider disabled:opacity-50"
      >
        <Link2 size={14} aria-hidden="true" />
        {state === "busy" ? t("share.making") : t("share.make")}
      </button>
      {state === "error" && (
        <span className="text-lamp-red" role="alert">
          {t("auth.error")}
        </span>
      )}
    </div>
  );
}
