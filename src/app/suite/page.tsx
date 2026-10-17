import type { Metadata } from "next";
import { SuiteRunner } from "@/components/suite-runner";
import { evidenceMode } from "@/lib/check";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Endpoint suite" };

export default function SuitePage() {
  return (
    <main className="rail-grid flex-1 w-full px-4 py-6 md:px-8 md:py-8">
      <div className="on-ground mx-auto w-full max-w-7xl">
        <h1 className="font-condensed text-2xl font-semibold uppercase tracking-wide">
          {t("suite.title")}
        </h1>
        <p className="mt-1 max-w-[65ch]">{t("suite.intro")}</p>
        <SuiteRunner mode={evidenceMode()} />
      </div>
    </main>
  );
}
