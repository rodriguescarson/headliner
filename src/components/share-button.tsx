"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      <div className="flex flex-wrap items-center gap-2">
        <Input
          readOnly
          value={url}
          aria-label={t("share.title")}
          className="max-w-md font-mono text-xs"
        />
        <Button type="button" variant="outline" onClick={copy}>
          {state === "copied" ? t("share.copied") : t("share.copy")}
        </Button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={share}
        disabled={state === "busy"}
      >
        {state === "busy" ? t("share.making") : t("share.make")}
      </Button>
      {state === "error" && (
        <span className="text-sm text-destructive" role="alert">
          {t("auth.error")}
        </span>
      )}
    </div>
  );
}
