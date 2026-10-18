import { ImageResponse } from "next/og";
import { money, pct } from "@/lib/deal/deal-math";
import { t } from "@/lib/i18n";
import { OG, OgLockup } from "@/lib/og/card";
import { checkStore } from "@/lib/storage";

export const alt = "A Headliner verdict on a live-show offer";
export const size = OG.size;
export const contentType = "image/png";

/** The card a co-promoter sees when a verdict link is pasted into chat: the answer, the offer, the number. */
export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shared = /^[A-Za-z0-9_-]{6,32}$/.test(id)
    ? await checkStore().get(id)
    : null;
  if (!shared) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: OG.bg,
        }}
      >
        <OgLockup />
      </div>,
      size,
    );
  }
  const { verdict: v, offer: o } = shared;
  const be = Number.isFinite(v.deal.breakEvenCapacityPct)
    ? v.deal.breakEvenCapacityPct
    : null;
  const tone = OG.status[v.status];
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        background: OG.bg,
        color: OG.ink,
        borderTop: `16px solid ${tone}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <OgLockup />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 22px",
            borderRadius: 999,
            border: `2px solid ${OG.border}`,
            fontSize: 30,
            fontWeight: 600,
          }}
        >
          <div
            style={{ width: 16, height: 16, borderRadius: 8, background: tone }}
          />
          {t(`verdict.status.${v.status}`)}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{
            fontSize: 56,
            fontWeight: 600,
            letterSpacing: -1.5,
            lineHeight: 1.1,
          }}
        >
          {v.headline}
        </div>
        <div style={{ fontSize: 30, color: OG.muted }}>
          {`${o.artist} · ${o.city} · ${o.capacity} cap · ${money(o.ticketPrice)} · ${money(o.guarantee)} guarantee`}
        </div>
      </div>
      <div style={{ display: "flex", gap: 64, fontSize: 28, color: OG.muted }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {t("verdict.breakEven")}
          <span style={{ fontSize: 52, fontWeight: 600, color: OG.ink }}>
            {be === null
              ? "—"
              : `${v.deal.breakEvenTickets} / ${v.deal.inputs.capacity} · ${pct(be)}`}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {t("verdict.selloutNet")}
          <span
            style={{
              fontSize: 52,
              fontWeight: 600,
              color: v.deal.selloutNet < 0 ? OG.status.refused : OG.ink,
            }}
          >
            {money(v.deal.selloutNet)}
          </span>
        </div>
      </div>
    </div>,
    size,
  );
}
