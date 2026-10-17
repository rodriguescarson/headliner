import Link from "next/link";
import type { SessionUser } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { Lockup } from "./logo";

export function SiteHeader({
  user,
  authEnabled,
}: {
  user: SessionUser | null;
  authEnabled: boolean;
}) {
  const link = "underline-offset-4 hover:underline";
  return (
    <header className="bg-panel-deep text-panel-deep-ink">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        <Link href="/" className="flex items-center">
          <Lockup />
        </Link>
        <nav aria-label={t("nav.label")} className="flex items-center gap-6">
          <Link href="/board" className={link}>
            {t("nav.board")}
          </Link>
          <Link href="/suite" className={link}>
            {t("nav.suite")}
          </Link>
          {authEnabled &&
            (user ? (
              <Link href="/account" className={link}>
                {t("nav.account")}
              </Link>
            ) : (
              <Link href="/login" className={link}>
                {t("nav.signIn")}
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
