import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { Shell } from "@/components/shell";
import { Dot } from "@/components/status";
import { buttonVariants } from "@/components/ui/button";
import { VerdictView } from "@/components/verdict-view";
import { t } from "@/lib/i18n";
import { checkStore, offerLine } from "@/lib/storage";

export async function generateMetadata({
  params,
}: PageProps<"/s/[id]">): Promise<Metadata> {
  const { id } = await params;
  const shared = /^[A-Za-z0-9_-]{6,32}$/.test(id)
    ? await checkStore().get(id)
    : null;
  const title = shared
    ? `${t(`verdict.status.${shared.verdict.status}`)}: ${shared.offer.artist}, ${shared.offer.city}`
    : "Shared result";
  return {
    title,
    description: shared?.verdict.headline,
    robots: { index: false },
    openGraph: { title, description: shared?.verdict.headline },
  };
}

export default async function SharedPage({ params }: PageProps<"/s/[id]">) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(id)) notFound();
  const shared = await checkStore().get(id);
  if (!shared) notFound();
  const line = offerLine(shared.offer);
  return (
    <SmoothScroll>
      <Shell>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{t("share.title")}</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              {line}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Dot tone={shared.mode === "live" ? "success" : "warning"}>
                {shared.mode === "live"
                  ? t("app.liveBanner")
                  : t("app.sampleBanner")}
              </Dot>
              <span>
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
            className={buttonVariants({ variant: "outline" })}
          >
            {t("share.runYourself")}
          </Link>
        </div>
        <VerdictView verdict={shared.verdict} offer={shared.offer} />
      </Shell>
    </SmoothScroll>
  );
}
