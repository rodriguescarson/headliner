import type { Metadata } from "next";
import { Plate } from "@/components/console";
import { ContactForm } from "@/components/contact-form";
import { t } from "@/lib/i18n";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach the person who runs Headliner.",
};

export default function ContactPage() {
  return (
    <main className="rail-grid flex-1 w-full px-4 py-10 md:px-8">
      <div className="on-ground mx-auto w-full max-w-xl">
        <h1 className="font-condensed text-2xl font-semibold uppercase tracking-wide">
          {t("contact.title")}
        </h1>
        <p className="mt-1 text-legend">{t("contact.intro")}</p>
        <Plate className="mt-6">
          <ContactForm fallbackEmail={LEGAL.supportEmail} />
        </Plate>
        <p className="mt-4 text-legend">
          {t("contact.fallback", { email: LEGAL.supportEmail })}
        </p>
      </div>
    </main>
  );
}
