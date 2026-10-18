"use client";
import { createBrowserClient } from "@supabase/ssr";

export type PublicSupabaseEnv = { url: string; anonKey: string };

/**
 * The browser client takes its public settings from the server at request time. Relying on NEXT_PUBLIC_*
 * inlining would bake whatever the build machine had (nothing, in the Docker build, which excludes .env)
 * into the bundle, and sign-in would silently disable itself.
 */
export function createClient(env: PublicSupabaseEnv | null) {
  if (!env) return null;
  return createBrowserClient(env.url, env.anonKey);
}
