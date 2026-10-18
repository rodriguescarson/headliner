"use client";

import { type FormEvent, useId, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { t } from "@/lib/i18n";
import { createClient, type PublicSupabaseEnv } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export function AuthForm({
  mode,
  appleEnabled,
  env,
}: {
  mode: Mode;
  appleEnabled: boolean;
  env: PublicSupabaseEnv | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailId = useId();
  const passId = useId();
  const [supabase] = useState(() => createClient(env));
  const redirectTo = () =>
    `${window.location.origin}/auth/callback?next=/account`;

  async function oauth(provider: "google" | "apple") {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectTo() },
    });
    if (error) {
      setError(t("auth.error"));
      setBusy(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!supabase || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectTo() },
        });
        if (error) throw error;
        setNotice(t("auth.checkEmail"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.assign("/account");
      }
    } catch {
      setError(t("auth.error"));
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!supabase || !email) return;
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/account`,
    });
    setNotice(t("auth.resetSent"));
  }

  if (!supabase)
    return (
      <p className="text-sm text-muted-foreground">{t("auth.disabled")}</p>
    );

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => oauth("google")}
          disabled={busy}
          className="w-full"
        >
          <GoogleMark />
          {t("auth.google")}
        </Button>
        {appleEnabled && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => oauth("apple")}
            disabled={busy}
            className="w-full"
          >
            <AppleMark />
            {t("auth.apple")}
          </Button>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Separator className="flex-1" />
        {t("auth.or")}
        <Separator className="flex-1" />
      </div>
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor={emailId}>{t("auth.email")}</Label>
          <Input
            id={emailId}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={passId}>{t("auth.password")}</Label>
            {mode === "signin" && (
              <button
                type="button"
                onClick={reset}
                className="text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                {t("auth.forgot")}
              </button>
            )}
          </div>
          <Input
            id={passId}
            type="password"
            autoComplete={
              mode === "signup" ? "new-password" : "current-password"
            }
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" size="lg" disabled={busy} className="w-full">
          {mode === "signup" ? t("auth.signUp") : t("auth.signIn")}
        </Button>
      </form>
      {notice && <output className="block text-sm">{notice}</output>}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.5 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.8 38 46.5 31.8 46.5 24.5z"
      />
      <path
        fill="#FBBC05"
        d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.2 0 11.6-2 15.4-5.6l-7.5-5.8c-2 1.4-4.7 2.3-7.9 2.3-6.3 0-11.7-4-13.6-9.7l-7.8 6C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M16.4 12.7c0-2.5 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.8 1.3 10.3.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.3.8c1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.8-1.1-2.8-4.3zM14 5.4c.7-.8 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.6.7-1.2 1.9-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z" />
    </svg>
  );
}
