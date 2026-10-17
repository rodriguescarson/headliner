import type { Metadata } from "next";
import Link from "next/link";
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

export default function Home() {
  const mode = evidenceMode();
  return (
    <SmoothScroll>
      <Shell>
        <output className="mb-4 block">
          <Badge variant="outline" className="gap-1.5 font-normal">
            <Dot tone={mode === "live" ? "success" : "warning"} />
            {mode === "live" ? t("app.liveBanner") : t("app.sampleBanner")}
          </Badge>
        </output>
        <OfferDesk rulesVersion={RULES_VERSION} />
        <p className="mt-6 text-sm">
          <Link
            href="/suite"
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("desk.suiteLink")}
          </Link>
        </p>
        <Story />
      </Shell>
    </SmoothScroll>
  );
}
