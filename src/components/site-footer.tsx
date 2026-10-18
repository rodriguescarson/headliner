import Link from "next/link";
import { t } from "@/lib/i18n";
import { LEGAL } from "@/lib/legal";

export function SiteFooter() {
  const links = [
    ["/terms", t("footer.terms")],
    ["/privacy", t("footer.privacy")],
    ["/cookies", t("footer.cookies")],
    ["/support", t("footer.support")],
    ["/contact", t("footer.contact")],
  ] as const;
  return (
    <footer className="mt-12 border-t">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
        <p>
          {t("footer.operator", {
            year: new Date().getFullYear(),
            operator: LEGAL.operator,
            place: LEGAL.place,
          })}
        </p>
        <nav
          aria-label={t("footer.label")}
          className="flex flex-wrap gap-x-5 gap-y-2"
        >
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
