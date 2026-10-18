"use client";

import { useActionState, useId, useState } from "react";
import { type SaveState, saveSettings } from "@/app/account/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Profile } from "@/lib/account/profile";
import { THEMES, type Theme } from "@/lib/account/theme";
import { t } from "@/lib/i18n";
import { Dot } from "./status";

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
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.appearance")}</CardTitle>
          <CardDescription>{t("settings.appearanceHelp")}</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            name="theme"
            defaultValue={profile?.theme ?? initialTheme}
            aria-label={t("settings.theme")}
            className="grid gap-2 md:grid-cols-3"
          >
            {THEMES.map((th) => (
              <Label
                key={th}
                htmlFor={`${id}-${th}`}
                className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 font-normal has-data-checked:border-primary"
              >
                <RadioGroupItem id={`${id}-${th}`} value={th} />
                {t(`settings.themes.${th}`)}
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.notifications")}</CardTitle>
          <CardDescription>{t("settings.notificationsHelp")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id={`${id}-verdict`}
              name="notifyVerdictEmail"
              defaultChecked={profile?.notifyVerdictEmail ?? false}
              className="mt-0.5"
            />
            <div className="grid gap-1">
              <Label htmlFor={`${id}-verdict`}>
                {t("settings.notifyVerdict")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("settings.notifyVerdictHelp")}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox
              id={`${id}-product`}
              name="notifyProductEmail"
              defaultChecked={profile?.notifyProductEmail ?? false}
              className="mt-0.5"
            />
            <div className="grid gap-1">
              <Label htmlFor={`${id}-product`}>
                {t("settings.notifyProduct")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("settings.notifyProductHelp")}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="gap-4 border-t">
          <Button type="submit" disabled={pending}>
            {pending ? t("settings.saving") : t("settings.save")}
          </Button>
          {state && (
            <output className="text-sm">
              <Dot tone={state.ok ? "success" : "destructive"}>
                {t(`settings.status.${state.message}`)}
              </Dot>
            </output>
          )}
        </CardFooter>
      </Card>
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
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.export")}</CardTitle>
          <CardDescription>{t("settings.exportHelp")}</CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href="/api/account/export"
            className={buttonVariants({ variant: "outline" })}
          >
            {t("settings.exportButton")}
          </a>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.delete")}</CardTitle>
          <CardDescription>{t("settings.deleteHelp")}</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" />}>
              {t("settings.deleteButton")}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("settings.delete")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("settings.deleteHelp")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-2">
                <Label htmlFor={confirmId}>
                  {t("settings.deleteConfirmLabel")}
                </Label>
                <Input
                  id={confirmId}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="off"
                  className="font-mono"
                />
              </div>
              {error && (
                <Alert variant="destructive" role="alert">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>{t("settings.cancel")}</AlertDialogCancel>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={remove}
                  disabled={
                    confirm !== "DELETE" || state === "busy" || state === "done"
                  }
                >
                  {state === "busy"
                    ? t("settings.deleting")
                    : t("settings.deleteButton")}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
