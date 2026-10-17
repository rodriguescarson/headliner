"use client";

import { useActionState, useId, useState } from "react";
import { type SaveState, saveSettings } from "@/app/account/actions";
import type { Profile } from "@/lib/account/profile";
import { THEMES, type Theme } from "@/lib/account/theme";
import { t } from "@/lib/i18n";
import { Lamp, Plate } from "./console";

export function SettingsForm({
  profile,
  initialTheme,
}: {
  profile: Profile | null;
  initialTheme: Theme;
}) {
  const [state, action, pending] = useActionState<SaveState, FormData>(
    saveSettings,
    null,
  );
  const id = useId();
  return (
    <form action={action} className="grid gap-6">
      <Plate legend={t("settings.appearance")}>
        <p className="text-legend">{t("settings.appearanceHelp")}</p>
        <fieldset className="mt-3 grid gap-2 md:grid-cols-3">
          <legend className="sr-only">{t("settings.theme")}</legend>
          {THEMES.map((th) => (
            <label
              key={th}
              htmlFor={`${id}-${th}`}
              className="glass flex cursor-pointer items-center gap-3 px-4 py-3"
            >
              <input
                id={`${id}-${th}`}
                type="radio"
                name="theme"
                value={th}
                defaultChecked={(profile?.theme ?? initialTheme) === th}
              />
              <span className="font-display text-base font-semibold">
                {t(`settings.themes.${th}`)}
              </span>
            </label>
          ))}
        </fieldset>
      </Plate>

      <Plate legend={t("settings.notifications")}>
        <p className="text-legend">{t("settings.notificationsHelp")}</p>
        <div className="mt-3 grid gap-2">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="notifyVerdictEmail"
              defaultChecked={profile?.notifyVerdictEmail ?? false}
              className="mt-1"
            />
            <span>
              <span className="block font-medium">
                {t("settings.notifyVerdict")}
              </span>
              <span className="block text-legend">
                {t("settings.notifyVerdictHelp")}
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="notifyProductEmail"
              defaultChecked={profile?.notifyProductEmail ?? false}
              className="mt-1"
            />
            <span>
              <span className="block font-medium">
                {t("settings.notifyProduct")}
              </span>
              <span className="block text-legend">
                {t("settings.notifyProductHelp")}
              </span>
            </span>
          </label>
        </div>
      </Plate>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center rounded-md bg-action px-5 font-display text-base font-semibold text-action-ink shadow-panel disabled:opacity-50"
        >
          {pending ? t("settings.saving") : t("settings.save")}
        </button>
        {state && (
          <output className="inline-flex items-center gap-2">
            <Lamp tone={state.ok ? "green" : "red"} size={12} />
            {t(`settings.status.${state.message}`)}
          </output>
        )}
      </div>
    </form>
  );
}

export function DataControls() {
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "error" | "done">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const confirmId = useId();

  async function remove() {
    setState("busy");
    setError(null);
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm }),
    });
    const body = (await res.json()) as { ok: boolean; error?: string };
    if (!res.ok) {
      setState("error");
      setError(body.error ?? t("auth.error"));
      return;
    }
    setState("done");
    window.location.assign("/?deleted=1");
  }

  return (
    <div className="grid gap-6">
      <Plate legend={t("settings.export")}>
        <p className="text-legend">{t("settings.exportHelp")}</p>
        <a
          href="/api/account/export"
          className="plate mt-3 inline-flex h-10 items-center gap-2 px-4 font-display font-semibold"
        >
          {t("settings.exportButton")}
        </a>
      </Plate>
      <Plate legend={t("settings.delete")}>
        <p className="text-legend">{t("settings.deleteHelp")}</p>
        <label htmlFor={confirmId} className="legend mt-3 block">
          {t("settings.deleteConfirmLabel")}
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            id={confirmId}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="off"
            className="glass h-10 w-40 px-3 font-display outline-none"
          />
          <button
            type="button"
            onClick={remove}
            disabled={
              confirm !== "DELETE" || state === "busy" || state === "done"
            }
            className="inline-flex h-10 items-center gap-2 rounded-md border border-lamp-red px-4 font-display font-semibold text-lamp-red disabled:opacity-40"
          >
            {state === "busy"
              ? t("settings.deleting")
              : t("settings.deleteButton")}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-lamp-red" role="alert">
            {error}
          </p>
        )}
      </Plate>
    </div>
  );
}
