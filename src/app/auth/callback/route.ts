import { NextResponse } from "next/server";
import { log } from "@/lib/security/guard";
import { publicOrigin } from "@/lib/security/public-origin";
import { createClient } from "@/lib/supabase/server";

/** OAuth and magic-link return: exchanges the code for a session, then sends the user on. Only same-site paths are honoured. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  const origin = publicOrigin(request);
  const supabase = await createClient();
  if (!supabase || !code)
    return NextResponse.redirect(new URL("/login?error=auth", origin));
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    log("warn", "auth_callback_failed", { reason: error.message });
    return NextResponse.redirect(new URL("/login?error=auth", origin));
  }
  return NextResponse.redirect(new URL(next, origin));
}

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
