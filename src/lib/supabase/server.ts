import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

/** Cookie-backed Supabase client for server components, route handlers and server actions. Null when auth is not configured. */
export async function createClient() {
  const env = supabaseEnv();
  if (!env) return null;
  const cookieStore = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet)
            cookieStore.set(name, value, options);
        } catch {
          // Server components cannot set cookies; the proxy refreshes sessions instead.
        }
      },
    },
  });
}
