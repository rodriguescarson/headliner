import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { Shell } from "@/components/shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { currentUser } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import {
  appleSignInEnabled,
  authEnabled,
  supabaseEnv,
} from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (authEnabled() && (await currentUser())) redirect("/account");
  return (
    <Shell width="narrow" className="py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t("auth.signIn")}</CardTitle>
          <CardDescription>{t("auth.why")}</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm
            mode="signin"
            appleEnabled={appleSignInEnabled()}
            env={supabaseEnv()}
          />
        </CardContent>
      </Card>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t("auth.noAccount")}{" "}
        <Link
          href="/signup"
          className="text-foreground underline underline-offset-4"
        >
          {t("auth.signUp")}
        </Link>
      </p>
    </Shell>
  );
}
