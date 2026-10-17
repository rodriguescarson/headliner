import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DataControls, SettingsForm } from "@/components/settings-form";
import { PageHeading, Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Shell width="medium">
      <PageHeading title={t("settings.title")} />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardDescription>{t("auth.signedInAs")}</CardDescription>
            <CardTitle>{user.name ?? user.email}</CardTitle>
            {user.name && <CardDescription>{user.email}</CardDescription>}
          </CardHeader>
          <CardContent>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline">
                {t("auth.signOut")}
              </Button>
            </form>
          </CardContent>
        </Card>
        <SettingsForm profile={profile} initialTheme={initialTheme} />
        <DataControls />
      </div>
    </Shell>
  );
}
