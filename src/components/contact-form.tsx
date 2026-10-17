"use client";

import { type FormEvent, useId, useState } from "react";
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
    return (
      <output className="block text-lamp-green">{t("contact.sent")}</output>
    );
  }
  return (
    <form onSubmit={submit} className="grid gap-3">
      <label htmlFor={emailId} className="legend">
        {t("contact.email")}
      </label>
      <input
        id={emailId}
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="glass h-11 px-3 outline-none"
      />
      <label htmlFor={msgId} className="legend">
        {t("contact.message")}
      </label>
      <textarea
        id={msgId}
        required
        minLength={10}
        maxLength={2000}
        rows={6}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="glass px-3 py-2 outline-none"
      />
      <button
        type="submit"
        disabled={state === "busy"}
        className="inline-flex h-11 items-center justify-center rounded-md bg-action px-4 font-display text-base font-semibold text-action-ink shadow-panel disabled:opacity-50"
      >
        {t("contact.send")}
      </button>
      {state === "error" && (
        <p className="text-lamp-red" role="alert">
          {t("auth.error")} {t("contact.fallback", { email: fallbackEmail })}
        </p>
      )}
    </form>
  );
}
