import { OfferDesk } from "@/components/offer-desk";
import { evidenceMode } from "@/lib/check";
import { t } from "@/lib/i18n";
import { SAMPLE_OFFERS } from "@/lib/qloo/sample";
import { RULES_VERSION } from "@/lib/rules";

export default function Home() {
  const mode = evidenceMode();
  return (
    <main className="flex-1 w-full px-4 py-8 md:px-10 md:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8">
          <p className="text-sm font-medium text-muted">{t("app.name")}</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight">
            {t("desk.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-muted">
            {t("desk.intro")}
          </p>
        </header>
        <output
          className={`mb-6 rounded-md border px-3 py-2 text-sm ${mode === "live" ? "border-ok/40 text-ok" : "border-warn/40 text-warn"}`}
        >
          {mode === "live" ? t("app.liveBanner") : t("app.sampleBanner")}
        </output>
        <OfferDesk samples={SAMPLE_OFFERS} rulesVersion={RULES_VERSION} />
      </div>
    </main>
  );
}
