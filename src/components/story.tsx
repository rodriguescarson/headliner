import { Gauge, Radar, ShieldQuestion, SlidersHorizontal } from "lucide-react";
import { t } from "@/lib/i18n";
import { Plate } from "./console";
import { Reveal } from "./motion/reveal";

const steps = [
  { key: "money", Icon: Gauge },
  { key: "taste", Icon: Radar },
  { key: "unknown", Icon: ShieldQuestion },
  { key: "scenario", Icon: SlidersHorizontal },
] as const;

/** The short story under the desk: what each column is, in the console's own words. Reads after the task, never before it. */
export function Story() {
  return (
    <section className="on-ground mt-14">
      <h2 className="font-condensed text-2xl font-semibold uppercase tracking-wide">
        {t("story.title")}
      </h2>
      <p className="mt-1 max-w-[65ch]">{t("story.intro")}</p>
      <Reveal className="mt-6 grid gap-4 md:grid-cols-2" stagger={0.1}>
        {steps.map(({ key, Icon }) => (
          <Plate key={key}>
            <div className="flex items-center gap-3">
              <Icon
                size={22}
                strokeWidth={1.75}
                aria-hidden="true"
                className="text-lamp-blue"
              />
              <h3 className="font-condensed text-lg font-semibold uppercase tracking-wide">
                {t(`story.${key}.title`)}
              </h3>
            </div>
            <p className="mt-2">{t(`story.${key}.body`)}</p>
          </Plate>
        ))}
      </Reveal>
    </section>
  );
}
