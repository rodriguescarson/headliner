/** Auth is optional at runtime: without a Supabase project the desk still runs checks; accounts, saving and sharing are hidden. */
export function supabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export const authEnabled = () => supabaseEnv() !== null;
export const appleSignInEnabled = () =>
  process.env.NEXT_PUBLIC_AUTH_APPLE === "true";
