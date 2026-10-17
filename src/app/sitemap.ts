import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3011";
  return [
    "/",
    "/suite",
    "/support",
    "/contact",
    "/terms",
    "/privacy",
    "/cookies",
    "/login",
    "/signup",
  ].map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date("2026-10-17"),
  }));
}
