import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { headers } from "next/headers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { currentUser } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { authEnabled } from "@/lib/supabase/env";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: { default: t("app.name"), template: `%s · ${t("app.name")}` },
  description: t("app.tagline"),
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3011",
  ),
};

const CONTRACT = `DIRECTION CONTRACT (seed 36cafb75, assigned index 3) THESIS: The offer desk is a channel strip. Money rides the fader, affinity reads on a meter, a refusal is the clip lamp, an abstention is a muted channel. It refuses the KPI-tile dashboard. OWN-WORLD: marine-grey panel, cream meter glass, engraved condensed legends, coloured lamp caps; one body size; hierarchy from meter deflection and lamps, not a type ladder; visible rail grid with screws. STORY: a promoter types the offer, watches two needles settle and one lamp light, reads the smallest fix, and sees what no signal can establish. They change or walk away from the deal before the deposit. FIRST VIEWPORT: scribble strip across the top (offer line, primary action right); meter bridge below: Deal math meter, verdict lamp, Qloo signal meter; patch bay of fixes and the stencil of unknowables beneath; the trace folded as the back panel. FORM: recording console channel strip, 3rd on the ranked list, seed key 36cafb75. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Reading request headers opts every page into dynamic rendering, which the per-request CSP nonce requires.
  await headers();
  const user = authEnabled() ? await currentUser() : null;
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* The direction contract ships as inert text so it survives the production build and can be audited. */}
        <script type="text/plain" data-direction-contract="">
          {CONTRACT}
        </script>
        <SiteHeader user={user} authEnabled={authEnabled()} />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
