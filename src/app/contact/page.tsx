import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { PageHeading, Shell } from "@/components/shell";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach the person who runs Headliner.",
};

export default function ContactPage() {
  return (
    <Shell width="medium" className="max-w-xl">
      <PageHeading title={t("contact.title")} intro={t("contact.intro")} />
      <Card>
        <CardContent>
          <ContactForm fallbackEmail={LEGAL.supportEmail} />
        </CardContent>
      </Card>
      <p className="mt-4 text-sm text-muted-foreground">
        {t("contact.fallback", { email: LEGAL.supportEmail })}
      </p>
    </Shell>
  );
}
