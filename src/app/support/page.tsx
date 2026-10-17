import type { Metadata } from "next";
import { Prose, Section } from "@/components/prose";
import { t } from "@/lib/i18n";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Help with Headliner: what it does, what it does not, and how to reach a human.",
};

export default function SupportPage() {
  const faq = [1, 2, 3, 4].map((n) => ({
    q: t(`support.q${n}`),
    a: t(`support.a${n}`),
  }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <Prose title={t("support.title")} intro={t("support.intro")}>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <Section heading={t("support.faq")}>
        {faq.map((f) => (
          <div key={f.q}>
            <p className="font-medium">{f.q}</p>
            <p className="text-muted-foreground">{f.a}</p>
          </div>
        ))}
      </Section>
      <Section heading="Reach a human">
        <p>
          <a
            href={`mailto:${LEGAL.supportEmail}`}
            className="underline underline-offset-4"
          >
            {LEGAL.supportEmail}
          </a>
          . Include the offer line and the time of the check; the rulebook
          version printed under the desk helps too.
        </p>
      </Section>
    </Prose>
  );
}
