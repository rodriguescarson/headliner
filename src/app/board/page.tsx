import type { Metadata } from "next";
import { OffersBoard } from "@/components/offers-board";
import { evidenceMode } from "@/lib/check";
import { t } from "@/lib/i18n";
import { LIVE_OFFERS } from "@/lib/offers";
import { SAMPLE_OFFERS } from "@/lib/qloo/sample";

export const metadata: Metadata = { title: "The board" };

export default function BoardPage() {
  const mode = evidenceMode();
  return (
    <main className="rail-grid flex-1 w-full px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="on-ground mb-5">
          <h1 className="font-condensed text-2xl font-semibold uppercase tracking-wide">
            {t("board.title")}
          </h1>
          <p className="mt-1 max-w-[65ch]">{t("board.intro")}</p>
        </div>
        <OffersBoard
          rows={mode === "live" ? LIVE_OFFERS : SAMPLE_OFFERS}
          note={mode === "live" ? t("desk.offersNote") : t("app.sampleBanner")}
        />
      </div>
    </main>
  );
}
