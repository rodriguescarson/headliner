"use client";

import { type FormEvent, useId, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/lib/i18n";

export function ContactForm({ fallbackEmail }: { fallbackEmail: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">(
    "idle",
  );
  const emailId = useId();
  const msgId = useId();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState("busy");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, message }),
    });
    setState(res.ok ? "sent" : "error");
  }

  if (state === "sent") {
    return <output className="block text-sm">{t("contact.sent")}</output>;
  }
  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor={emailId}>{t("contact.email")}</Label>
        <Input
          id={emailId}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={msgId}>{t("contact.message")}</Label>
        <Textarea
          id={msgId}
          required
          minLength={10}
          maxLength={2000}
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={state === "busy"} className="w-full">
        {t("contact.send")}
      </Button>
      {state === "error" && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {t("auth.error")} {t("contact.fallback", { email: fallbackEmail })}
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}
