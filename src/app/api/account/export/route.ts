import { getProfile } from "@/lib/account/profile";
import { currentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/** Everything Headliner holds about the signed-in user, as a JSON download. Shares are listed by the user's own id. */
export async function GET() {
  const user = await currentUser();
  if (!user)
    return Response.json(
      { ok: false, error: "Sign in to export." },
      { status: 401 },
    );
  const supabase = await createClient();
  const profile = await getProfile(user.id);
  const shares = supabase
    ? ((
        await supabase
          .from("shared_checks")
          .select("id, created_at, mode, offer_line, payload")
          .eq("user_id", user.id)
          .is("deleted_at", null)
      ).data ?? [])
    : [];
  const body = {
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    },
    profile,
    shares,
    notes:
      "Offer lines you checked without saving were never stored. Rate-limit hashes expire within an hour and are not personal data.",
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="headliner-export-${user.id.slice(0, 8)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
