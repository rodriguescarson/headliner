import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lamp } from "@/components/console";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { VerdictView } from "@/components/verdict-view";
import { t } from "@/lib/i18n";
import { checkStore, offerLine } from "@/lib/storage";

export const metadata: Metadata = {
  title: "Shared verdict",
  robots: { index: false },
};

export default async function SharedPage({ params }: PageProps<"/s/[id]">) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(id)) notFound();
  const shared = await checkStore().get(id);
  if (!shared) notFound();
  const line = offerLine(shared.offer);
  return (
    <SmoothScroll>
      <main className="rail-grid flex-1 w-full px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="on-ground mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="legend">{t("share.title")}</p>
              <p className="mt-1 font-condensed text-xl">{line}</p>
              <p className="mt-1 flex items-center gap-2">
                <Lamp
                  tone={shared.mode === "live" ? "green" : "amber"}
                  size={12}
                />
                <span className="legend">
                  {shared.mode === "live"
                    ? t("app.liveBanner")
                    : t("app.sampleBanner")}
                </span>
                <span className="legend">
                  ·{" "}
                  {new Date(shared.createdAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </p>
            </div>
            <Link
              href={`/?line=${encodeURIComponent(line)}`}
              className="underline underline-offset-4"
            >
              {t("share.runYourself")}
            </Link>
          </div>
          <VerdictView verdict={shared.verdict} offer={shared.offer} />
        </div>
      </main>
    </SmoothScroll>
  );
}
