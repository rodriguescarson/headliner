import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { Plate } from "@/components/console";
import { currentUser } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { appleSignInEnabled, authEnabled } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignupPage() {
  if (authEnabled() && (await currentUser())) redirect("/account");
  return (
    <main className="rail-grid flex-1 w-full px-4 py-10 md:px-8">
      <div className="on-ground mx-auto w-full max-w-md">
        <h1 className="font-display text-2xl font-bold">{t("auth.signUp")}</h1>
        <p className="mt-1 text-legend">{t("auth.why")}</p>
        <Plate className="mt-6">
          <AuthForm mode="signup" appleEnabled={appleSignInEnabled()} />
        </Plate>
        <p className="mt-4 text-legend">
          {t("auth.haveAccount")}{" "}
          <Link href="/login" className="underline underline-offset-4">
            {t("auth.signIn")}
          </Link>
        </p>
      </div>
    </main>
  );
}
