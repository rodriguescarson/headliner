import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Plate } from "@/components/console";
import { currentUser } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { LEGAL } from "@/lib/legal";
import { authEnabled } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  if (!authEnabled()) redirect("/");
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <main className="rail-grid flex-1 w-full px-4 py-10 md:px-8">
      <div className="on-ground mx-auto grid w-full max-w-2xl gap-6">
        <h1 className="font-condensed text-2xl font-semibold uppercase tracking-wide">
          {t("auth.account")}
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
        <Plate legend={t("auth.export")}>
          <p className="text-legend">{t("auth.exportHelp")}</p>
        </Plate>
        <Plate legend={t("auth.delete")}>
          <p className="text-legend">
            {t("auth.deleteHelp", { email: LEGAL.supportEmail })}
          </p>
        </Plate>
      </div>
    </main>
  );
}
