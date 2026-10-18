import { ImageResponse } from "next/og";
import { t } from "@/lib/i18n";
import { OG, OgLockup } from "@/lib/og/card";

export const alt = "Headliner: check a show offer before you sign it";
export const size = OG.size;
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: OG.bg,
        color: OG.ink,
      }}
    >
      <OgLockup />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            fontSize: 76,
            fontWeight: 600,
            letterSpacing: -2,
            lineHeight: 1.05,
          }}
        >
          {t("home.title")}
        </div>
        <div style={{ fontSize: 32, color: OG.muted, maxWidth: 960 }}>
          {t("home.subtitle")}
        </div>
      </div>
      <div style={{ display: "flex", gap: 28, fontSize: 26, color: OG.muted }}>
        {(["cleared", "fix_required", "refused", "abstained"] as const).map(
          (s) => (
            <div
              key={s}
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  background: OG.status[s],
                }}
              />
              {t(`verdict.status.${s}`)}
            </div>
          ),
        )}
      </div>
    </div>,
    size,
  );
}
