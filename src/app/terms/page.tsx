import type { Metadata } from "next";
import { Prose, Section } from "@/components/prose";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms for using Headliner.",
};

export default function TermsPage() {
  return (
    <Prose
      title="Terms of service"
      intro={`These terms govern your use of ${LEGAL.product}, operated by ${LEGAL.operator}, ${LEGAL.place}.`}
    >
      <Section heading="What Headliner is">
        <p>
          Headliner checks live-show offers: it computes deal arithmetic from
          the numbers you enter, shows cultural evidence from the Qloo API, and
          lists what the check cannot establish. It is decision support for
          promoters and touring acts. It is not financial, legal or booking
          advice, and it does not predict ticket sales.
        </p>
      </Section>
      <Section heading="Your responsibilities">
        <ul>
          <li>
            You must be at least {LEGAL.minimumAge} years old to create an
            account.
          </li>
          <li>
            You are responsible for the numbers you enter and for any decision
            you take on the result.
          </li>
          <li>
            Do not abuse the service: no automated scraping of results, no
            attempts to extract the Qloo data, no attacks on the service or on
            others.
          </li>
        </ul>
      </Section>
      <Section heading="Evidence and limits">
        <p>
          Cultural affinity figures come from Qloo and describe audiences, not
          ticket demand. Sample mode shows illustrative data that does not come
          from Qloo and is labelled as such. Sponsor offsets are illustrative
          ranges from the rulebook, never quotes. Every result lists the things
          the check cannot know, such as competing shows, radius clauses and
          actual sales.
        </p>
      </Section>
      <Section heading="Accounts">
        <p>
          Accounts are optional. Running a check needs no account. An account
          saves your checks and lets you share a verdict. You may delete your
          account and data at any time (see the Privacy page).
        </p>
      </Section>
      <Section heading="Availability and changes">
        <p>
          The service is provided as is, without warranty. It may change or stop
          at any time; we give at least 14 days' notice of material changes to
          these terms by email to account holders and a note on this page.
        </p>
      </Section>
      <Section heading="Liability">
        <p>
          To the extent the law allows, our liability for any claim relating to
          the service is limited to the amount you paid us in the twelve months
          before the claim, or USD 50, whichever is greater. Nothing here limits
          liability that cannot be limited by law.
        </p>
      </Section>
      <Section heading="Governing law">
        <p>
          These terms are governed by {LEGAL.governingLaw}. Disputes go to{" "}
          {LEGAL.courts}, unless a mandatory consumer-protection law in your
          country applies instead.
        </p>
      </Section>
    </Prose>
  );
}
