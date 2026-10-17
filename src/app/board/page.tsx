import type { Metadata } from "next";
import { OffersBoard } from "@/components/offers-board";
import { PageHeading, Shell } from "@/components/shell";
import { evidenceMode } from "@/lib/check";
import { t } from "@/lib/i18n";
import { LIVE_OFFERS } from "@/lib/offers";
import { SAMPLE_OFFERS } from "@/lib/qloo/sample";

export const metadata: Metadata = { title: "Offers" };

export default function BoardPage() {
  const mode = evidenceMode();
  return (
    <Shell>
      <PageHeading title={t("board.title")} intro={t("board.intro")} />
      <OffersBoard
        rows={mode === "live" ? LIVE_OFFERS : SAMPLE_OFFERS}
        note={mode === "live" ? t("desk.offersNote") : t("app.sampleBanner")}
      />
    </Shell>
  );
}
