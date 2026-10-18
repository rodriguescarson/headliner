import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const widths = {
  wide: "max-w-7xl",
  medium: "max-w-2xl",
  narrow: "max-w-md",
} as const;

/** Every page sits in the same frame: full-width main, one centred column, one gutter. */
export function Shell({
  children,
  width = "wide",
  className,
}: {
  children: ReactNode;
  width?: keyof typeof widths;
  className?: string;
}) {
  return (
    <main className="w-full flex-1 px-4 py-8 md:px-8">
      <div className={cn("mx-auto w-full", widths[width], className)}>
        {children}
      </div>
    </main>
  );
}

export function PageHeading({
  title,
  intro,
  action,
}: {
  title: string;
  intro?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {intro && (
          <p className="mt-1 max-w-[65ch] text-muted-foreground">{intro}</p>
        )}
      </div>
      {action}
    </div>
  );
}
