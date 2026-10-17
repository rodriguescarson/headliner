"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { saveProfile } from "@/lib/account/profile";
import { parseTheme, THEME_COOKIE } from "@/lib/account/theme";
import { currentUser } from "@/lib/auth/session";

export type SaveState = { ok: boolean; message: string } | null;

/** Saves appearance and notification preferences for the signed-in user, and sets the theme cookie for this browser. */
export async function saveSettings(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const user = await currentUser();
  if (!user) return { ok: false, message: "signed_out" };
  const theme = parseTheme(formData.get("theme"));
  const ok = await saveProfile(user.id, {
    theme,
    notifyVerdictEmail: formData.get("notifyVerdictEmail") === "on",
    notifyProductEmail: formData.get("notifyProductEmail") === "on",
  });
  if (!ok) return { ok: false, message: "save_failed" };
  const jar = await cookies();
  jar.set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "saved" };
}
