import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import type { SessionUser } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { Lockup } from "./logo";
import { NavLink } from "./nav-link";

export function SiteHeader({
  user,
  authEnabled,
}: {
  user: SessionUser | null;
  authEnabled: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/" className="flex items-center">
          <Lockup />
        </Link>
        <nav aria-label={t("nav.label")} className="flex items-center gap-1">
          <NavLink href="/board">{t("nav.board")}</NavLink>
          <NavLink href="/suite">{t("nav.suite")}</NavLink>
          {authEnabled &&
            (user ? (
              <NavLink href="/account">{t("nav.account")}</NavLink>
            ) : (
              <Link
                href="/login"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                {t("nav.signIn")}
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
