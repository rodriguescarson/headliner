import type { ReactNode } from "react";
import { Shell } from "@/components/shell";
import { t } from "@/lib/i18n";
import { LEGAL } from "@/lib/legal";

/** Read-mode page: a readable measure, one body size, plain section headings. */
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
    <Shell width="medium">
      <article className="mx-auto w-full max-w-[72ch]">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {intro && <p className="mt-2 text-muted-foreground">{intro}</p>}
        <p className="mt-3 text-sm text-muted-foreground">
          {t("legal.updated", { date: LEGAL.lastUpdated })}
        </p>
        <div className="mt-8 grid gap-8">{children}</div>
        <p className="mt-10 text-sm text-muted-foreground">
          {t("legal.contact", { email: LEGAL.supportEmail })}
        </p>
      </article>
    </Shell>
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
      <h2 className="mb-2 text-lg font-semibold tracking-tight">{heading}</h2>
      <div className="grid gap-3 leading-7 [&_a]:underline [&_a]:underline-offset-4 [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
