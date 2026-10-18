import "server-only";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

/** The signed-in user, validated against Supabase Auth (never trusted from a cookie alone). Null when signed out or auth is off. */
export async function currentUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    name:
      typeof meta.full_name === "string"
        ? meta.full_name
        : typeof meta.name === "string"
          ? meta.name
          : null,
    avatarUrl: typeof meta.avatar_url === "string" ? meta.avatar_url : null,
  };
}
