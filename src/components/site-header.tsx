import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
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
  const ghost = buttonVariants({ variant: "ghost", size: "sm" });
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/" className="flex items-center">
          <Lockup />
        </Link>
        <nav aria-label={t("nav.label")} className="flex items-center gap-1">
          <Link href="/board" className={ghost}>
            {t("nav.board")}
          </Link>
          <Link href="/suite" className={ghost}>
            {t("nav.suite")}
          </Link>
          {authEnabled &&
            (user ? (
              <Link href="/account" className={ghost}>
                {t("nav.account")}
              </Link>
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
