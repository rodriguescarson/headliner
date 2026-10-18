"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Header link that marks the current section, so a visitor always knows where they are. */
export function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const path = usePathname();
  const active = path === href || path.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "text-muted-foreground",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
