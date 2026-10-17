import { z } from "zod";
import { guardJson, log } from "@/lib/security/guard";

const Body = z.object({
  email: z.string().email().max(200),
  message: z.string().min(10).max(2000),
});

/**
 * Contact messages. Without an email provider configured they are logged (without the message body) and the
 * page shows the direct address; with RESEND_API_KEY set they are delivered to the support inbox.
 */
export async function POST(request: Request) {
  const guard = await guardJson(request, {
    scope: "contact",
    limit: 5,
    windowMs: 60 * 60_000,
  });
  if (!guard.ok) return guard.response;
  const parsed = Body.safeParse(guard.body);
  if (!parsed.success)
    return Response.json(
      { ok: false, error: "Check the email and message." },
      { status: 422 },
    );
  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO ?? "carson@celabe.com";
  const from = process.env.CONTACT_FROM;
  if (key && from) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: parsed.data.email,
        subject: "Headliner contact",
        text: parsed.data.message,
      }),
    });
    if (!res.ok) {
      log("error", "contact_send_failed", { status: res.status });
      return Response.json(
        { ok: false, error: "Could not send." },
        { status: 502 },
      );
    }
    return Response.json({ ok: true });
  }
  log("warn", "contact_unconfigured", {
    hasKey: Boolean(key),
    hasFrom: Boolean(from),
  });
  return Response.json(
    { ok: false, error: "Email is not configured." },
    { status: 503 },
  );
}
