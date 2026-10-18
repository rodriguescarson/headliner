import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies, headers } from "next/headers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { parseTheme, THEME_COOKIE, themeClass } from "@/lib/account/theme";
import { currentUser } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { authEnabled } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: t("app.name"), template: `%s · ${t("app.name")}` },
  description: t("app.tagline"),
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3011",
  ),
  openGraph: { siteName: "Headliner", type: "website" },
  twitter: { card: "summary_large_image" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Reading request headers opts every page into dynamic rendering, which the per-request CSP nonce requires.
  await headers();
  const jar = await cookies();
  const theme = parseTheme(jar.get(THEME_COOKIE)?.value);
  const user = authEnabled() ? await currentUser() : null;
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased",
        geist.variable,
        geistMono.variable,
        themeClass(theme),
      )}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader user={user} authEnabled={authEnabled()} />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
