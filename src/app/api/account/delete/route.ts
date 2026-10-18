import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { guardJson, log } from "@/lib/security/guard";
import { createClient } from "@/lib/supabase/server";

/**
 * Deletes the signed-in account. Order: soft-delete the user's shares and profile (service role, RLS bypass),
 * then delete the auth user through GoTrue's admin API, then clear the session. Not undoable; the page says so
 * and requires the typed confirmation.
 */
export async function POST(request: Request) {
  const guard = await guardJson(request, {
    scope: "account-delete",
    limit: 3,
    windowMs: 60 * 60_000,
  });
  if (!guard.ok) return guard.response;
  const user = await currentUser();
  if (!user)
    return Response.json(
      { ok: false, error: "Sign in first." },
      { status: 401 },
    );
  const b = guard.body as { confirm?: unknown };
  if (b.confirm !== "DELETE")
    return Response.json(
      { ok: false, error: "Type DELETE to confirm." },
      { status: 422 },
    );

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    return Response.json(
      {
        ok: false,
        error: "Account deletion is not configured on this deployment.",
      },
      { status: 503 },
    );
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  const now = new Date().toISOString();
  try {
    await fetch(`${url}/rest/v1/shared_checks?user_id=eq.${user.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ deleted_at: now }),
    });
    await fetch(`${url}/rest/v1/profiles?id=eq.${user.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ deleted_at: now }),
    });
    const res = await fetch(`${url}/auth/v1/admin/users/${user.id}`, {
      method: "DELETE",
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) {
      log("error", "account_delete_failed", { status: res.status });
      return Response.json(
        {
          ok: false,
          error:
            "Could not delete the account. Email support and it will be done by hand.",
        },
        { status: 502 },
      );
    }
  } catch (e) {
    log("error", "account_delete_failed", {
      message: e instanceof Error ? e.message : "unknown",
    });
    return Response.json(
      {
        ok: false,
        error:
          "Could not delete the account. Email support and it will be done by hand.",
      },
      { status: 502 },
    );
  }
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  log("info", "account_deleted", {});
  return NextResponse.json({ ok: true });
}
