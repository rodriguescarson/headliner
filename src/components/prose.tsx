import type { ReactNode } from "react";
import { Screws } from "@/components/console";
import { t } from "@/lib/i18n";
import { LEGAL } from "@/lib/legal";

/** Read-mode page: a readable measure on the panel, engraved section legends, one body size. */
export function Prose({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <main className="rail-grid flex-1 w-full px-4 py-10 md:px-8">
      <article className="plate relative mx-auto w-full max-w-[72ch] p-6 md:p-8">
        <Screws />
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        {intro && <p className="mt-2 text-legend">{intro}</p>}
        <p className="legend mt-3">
          {t("legal.updated", { date: LEGAL.lastUpdated })}
        </p>
        <div className="prose-console mt-8 grid gap-6">{children}</div>
        <p className="mt-10 text-legend">
          {t("legal.contact", { email: LEGAL.supportEmail })}
        </p>
      </article>
    </main>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 font-display text-base font-semibold text-legend">
        {heading}
      </h2>
      <div className="grid gap-3 text-ink [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1">
        {children}
      </div>
    </section>
  );
}
