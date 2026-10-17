import "server-only";
import { createClient } from "@/lib/supabase/server";
import { parseTheme, type Theme } from "./theme";

export type Profile = {
  id: string;
  theme: Theme;
  notifyVerdictEmail: boolean;
  notifyProductEmail: boolean;
  updatedAt: string | null;
};

type Row = {
  id: string;
  theme: string;
  notify_verdict_email: boolean;
  notify_product_email: boolean;
  updated_at: string | null;
};

/** The signed-in user's profile row, under RLS. Null when there is none yet. */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, theme, notify_verdict_email, notify_product_email, updated_at")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  const r = data as Row;
  return {
    id: r.id,
    theme: parseTheme(r.theme),
    notifyVerdictEmail: r.notify_verdict_email,
    notifyProductEmail: r.notify_product_email,
    updatedAt: r.updated_at,
  };
}

export async function saveProfile(
  userId: string,
  patch: {
    theme: Theme;
    notifyVerdictEmail: boolean;
    notifyProductEmail: boolean;
  },
): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      theme: patch.theme,
      notify_verdict_email: patch.notifyVerdictEmail,
      notify_product_email: patch.notifyProductEmail,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  return !error;
}
