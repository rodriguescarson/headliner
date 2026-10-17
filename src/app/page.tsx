import type { Metadata } from "next";
import Link from "next/link";
import { Lamp } from "@/components/console";
import { HeroBackdrop } from "@/components/motion/hero-backdrop";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { OfferDesk } from "@/components/offer-desk";
import { Story } from "@/components/story";
import { evidenceMode } from "@/lib/check";
import { t } from "@/lib/i18n";
import { RULES_VERSION } from "@/lib/rules";

export const metadata: Metadata = { title: "Check a deal" };

export default function Home() {
  const mode = evidenceMode();
  return (
    <SmoothScroll>
      <main className="rail-grid relative flex-1 w-full overflow-x-clip px-4 py-6 md:px-8 md:py-8">
        <HeroBackdrop />
        <div className="mx-auto w-full max-w-7xl">
          <output className="on-ground mb-4 flex items-center gap-2">
            <Lamp tone={mode === "live" ? "green" : "amber"} size={12} />
            <span className="legend">
              {mode === "live" ? t("app.liveBanner") : t("app.sampleBanner")}
            </span>
          </output>
          <OfferDesk rulesVersion={RULES_VERSION} />
          <p className="mt-8 ">
            <Link
              href="/suite"
              className="text-lamp-blue underline-offset-4 hover:underline"
            >
              {t("desk.suiteLink")}
            </Link>
          </p>
          <Story />
        </div>
      </main>
    </SmoothScroll>
  );
}
