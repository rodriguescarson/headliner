import type { Metadata } from "next";
import { Prose, Section } from "@/components/prose";

export const metadata: Metadata = {
  title: "Cookies",
  description: "The cookies Headliner sets and why.",
};

export default function CookiesPage() {
  return (
    <Prose
      title="Cookies"
      intro="Headliner sets no advertising or analytics cookies, so there is no consent banner."
    >
      <Section heading="Strictly necessary">
        <ul>
          <li>
            <strong>Session cookies</strong> (only if you sign in): set by
            Supabase Auth to keep you signed in. HttpOnly, Secure, SameSite=Lax;
            they expire when the session does.
          </li>
        </ul>
      </Section>
      <Section heading="Browser storage">
        <p>
          The page keeps the id of a check you started in the URL so a refresh
          can resume it. Nothing is written to local storage.
        </p>
      </Section>
      <Section heading="Third parties">
        <p>
          Signing in with Google or Apple takes you to their pages, which set
          their own cookies under their own policies. No third-party scripts
          load on Headliner's pages.
        </p>
      </Section>
    </Prose>
  );
}
