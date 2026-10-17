import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Plate } from "@/components/console";
import { DataControls, SettingsForm } from "@/components/settings-form";
import { getProfile } from "@/lib/account/profile";
import { parseTheme, THEME_COOKIE } from "@/lib/account/theme";
import { currentUser } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { authEnabled } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false },
};

export default async function AccountPage() {
  if (!authEnabled()) redirect("/");
  const user = await currentUser();
  if (!user) redirect("/login");
  const [profile, jar] = await Promise.all([getProfile(user.id), cookies()]);
  const initialTheme = parseTheme(jar.get(THEME_COOKIE)?.value);
  return (
    <main className="rail-grid flex-1 w-full px-4 py-10 md:px-8">
      <div className="on-ground mx-auto grid w-full max-w-2xl gap-6">
        <h1 className="font-display text-2xl font-bold">
          {t("settings.title")}
        </h1>
        <Plate legend={t("auth.signedInAs")}>
          <p className="text-lg">{user.name ?? user.email}</p>
          {user.name && <p className="text-legend">{user.email}</p>}
          <form action="/auth/signout" method="post" className="mt-4">
            <button type="submit" className="plate h-10 px-4 font-medium">
              {t("auth.signOut")}
            </button>
          </form>
        </Plate>
        <SettingsForm profile={profile} initialTheme={initialTheme} />
        <DataControls />
      </div>
    </main>
  );
}
