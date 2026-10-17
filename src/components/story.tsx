import { t } from "@/lib/i18n";
import { Plate } from "./console";
import { Reveal } from "./motion/reveal";

const steps = ["money", "taste", "unknown", "scenario"] as const;

/** The short story under the desk: what each column is, in the console's own words. Reads after the task, never before it. */
export function Story() {
  return (
    <section className="on-ground mt-14">
      <h2 className="font-display text-2xl font-bold">{t("story.title")}</h2>
      <p className="mt-1 max-w-[65ch]">{t("story.intro")}</p>
      <Reveal className="mt-6 grid gap-4 md:grid-cols-2" stagger={0.1}>
        {steps.map((key) => (
          <Plate key={key}>
            <div>
              <h3 className="font-display text-lg font-semibold">
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
