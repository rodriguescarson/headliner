import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { supabaseEnv } from "./env";

/**
 * Session refresh at the edge of every page request (pattern from celabe-admin). When getUser() rotates the
 * refresh token, the new cookies go onto the request (so the page sees the fresh session) and onto the response
 * (so the browser stores them). The caller must return the response handed to onResponse, or copy its cookies.
 */
export function createProxyClient(
  request: NextRequest,
  onResponse: (response: NextResponse) => void,
) {
  const env = supabaseEnv();
  if (!env) return null;
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        const response = NextResponse.next({ request });
        for (const { name, value, options } of toSet)
          response.cookies.set(name, value, options);
        onResponse(response);
      },
    },
  });
}
