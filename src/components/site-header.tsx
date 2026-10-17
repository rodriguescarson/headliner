import { Activity, LogIn, UserRound } from "lucide-react";
import Link from "next/link";
import type { SessionUser } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { Lamp } from "./console";

export function SiteHeader({
  user,
  authEnabled,
}: {
  user: SessionUser | null;
  authEnabled: boolean;
}) {
  return (
    <header className="bg-panel-deep text-panel-deep-ink">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Lamp tone="amber" size={14} />
          <span className="font-condensed text-lg font-semibold uppercase tracking-[0.18em]">
            {t("app.name")}
          </span>
        </Link>
        <nav aria-label={t("nav.label")} className="flex items-center gap-5 ">
          <Link
            href="/suite"
            className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
          >
            <Activity size={16} strokeWidth={1.75} aria-hidden />
            {t("nav.suite")}
          </Link>
          {authEnabled &&
            (user ? (
              <Link
                href="/account"
                className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
              >
                <UserRound size={16} strokeWidth={1.75} aria-hidden />
                {user.name ?? user.email ?? t("nav.account")}
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
              >
                <LogIn size={16} strokeWidth={1.75} aria-hidden />
                {t("nav.signIn")}
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
