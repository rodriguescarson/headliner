import type { Metadata } from "next";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { OfferDesk } from "@/components/offer-desk";
import { Shell } from "@/components/shell";
import { Dot } from "@/components/status";
import { Story } from "@/components/story";
import { Badge } from "@/components/ui/badge";
import { evidenceMode } from "@/lib/check";
import { t } from "@/lib/i18n";
import { RULES_VERSION } from "@/lib/rules";

export const metadata: Metadata = { title: "Check a deal" };

export default async function Home({ searchParams }: PageProps<"/">) {
  const mode = evidenceMode();
  const { line } = await searchParams;
  const initialLine = typeof line === "string" ? line.slice(0, 500) : "";
  return (
    <SmoothScroll>
      <Shell>
        <section className="mx-auto max-w-3xl pt-4 pb-8 text-center md:pt-10">
          <Badge variant="outline" className="gap-1.5 font-normal">
            <Dot tone={mode === "live" ? "success" : "warning"} />
            {mode === "live" ? t("app.liveBanner") : t("app.sampleBanner")}
          </Badge>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-balance md:text-5xl">
            {t("home.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-[60ch] text-base text-pretty text-muted-foreground md:text-lg">
            {t("home.subtitle")}
          </p>
        </section>
        <OfferDesk rulesVersion={RULES_VERSION} initialLine={initialLine} />
        <Story />
      </Shell>
    </SmoothScroll>
  );
}
