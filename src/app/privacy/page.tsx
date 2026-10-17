import type { Metadata } from "next";
import { Prose, Section } from "@/components/prose";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What Headliner collects, why, and how to delete it.",
};

export default function PrivacyPage() {
  return (
    <Prose
      title="Privacy policy"
      intro={`The data controller is ${LEGAL.operator}, ${LEGAL.place}.`}
    >
      <Section heading="What we process">
        <ul>
          <li>
            <strong>Offer lines you type.</strong> Sent to our server to run the
            check, and to the Qloo API as the act name and city only. Not stored
            unless you save the check to an account.
          </li>
          <li>
            <strong>Account data</strong> (if you create one): email address,
            name and avatar from Google or Apple sign-in, and your saved checks.
            Stored with Supabase (authentication and database).
          </li>
          <li>
            <strong>Technical data:</strong> a hashed form of your IP address
            for rate limiting, kept in memory for one hour; server logs without
            offer text or raw IP addresses.
          </li>
          <li>
            <strong>Model baseline</strong> (only if you tick "Without Qloo"):
            the act, city and capacity are sent to a language model through the
            Vercel AI Gateway to produce the comparison.
          </li>
        </ul>
      </Section>
      <Section heading="Why, and on what basis">
        <p>
          To provide the service you asked for (contract), to keep it secure and
          within fair use (legitimate interest), and, for accounts, with your
          consent when you sign up. We do not sell data, run advertising, or
          train models on your content.
        </p>
      </Section>
      <Section heading="Processors">
        <ul>
          <li>Qloo (cultural evidence, United States)</li>
          <li>Supabase (authentication and database)</li>
          <li>
            Vercel AI Gateway and Anthropic (optional baseline comparison)
          </li>
          <li>Google and Apple (sign-in providers, when you choose them)</li>
        </ul>
      </Section>
      <Section heading="Retention">
        <p>
          Cached Qloo responses are kept server-side to avoid repeat calls; they
          contain no personal data. Account data is kept until you delete the
          account. Rate-limit hashes expire within an hour.
        </p>
      </Section>
      <Section heading="Your rights">
        <p>
          Access, correction, export and deletion. From your Account page you
          can sign out, and request export or deletion by email to{" "}
          {LEGAL.supportEmail} from your account address; deletion completes
          within 7 days. Under India's DPDP Act you may also raise a grievance
          at the same address, which is answered within 30 days.
        </p>
      </Section>
      <Section heading="Children">
        <p>The service is not directed at anyone under {LEGAL.minimumAge}.</p>
      </Section>
      <Section heading="Changes">
        <p>
          We will note material changes here and, for account holders, by email.
        </p>
      </Section>
    </Prose>
  );
}
