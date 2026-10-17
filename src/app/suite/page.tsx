import type { Metadata } from "next";
import { PageHeading, Shell } from "@/components/shell";
import { SuiteRunner } from "@/components/suite-runner";
import { evidenceMode } from "@/lib/check";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: "API status" };

export default function SuitePage() {
  return (
    <Shell>
      <PageHeading title={t("suite.title")} intro={t("suite.intro")} />
      <SuiteRunner mode={evidenceMode()} />
    </Shell>
  );
}
