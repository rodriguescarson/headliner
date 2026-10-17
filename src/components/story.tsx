import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { Reveal } from "./motion/reveal";

const steps = ["money", "taste", "unknown", "scenario"] as const;

/** The short story under the desk: what each part of a verdict is. Reads after the task, never before it. */
export function Story() {
  return (
    <section className="mt-20">
      <h2 className="text-xl font-semibold tracking-tight">
        {t("story.title")}
      </h2>
      <p className="mt-1 max-w-[65ch] text-muted-foreground">
        {t("story.intro")}
      </p>
      <Reveal
        className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        stagger={0.1}
      >
        {steps.map((key) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle>{t(`story.${key}.title`)}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t(`story.${key}.body`)}
            </CardContent>
          </Card>
        ))}
      </Reveal>
    </section>
  );
}
