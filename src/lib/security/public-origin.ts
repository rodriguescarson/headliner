/**
 * The origin users reach the site on. Behind the proxy, `request.url` carries the container's bind
 * address (https://0.0.0.0:3000), so redirects built from it send people nowhere. Prefer the configured
 * app URL, then the proxy's forwarded host, and only then the request itself.
 */
export function publicOrigin(request: Request): string {
  // Bracket access keeps the value a runtime read; dot access to NEXT_PUBLIC_* is inlined at build time.
  // biome-ignore lint/complexity/useLiteralKeys: dot access would be replaced at build time
  const configured = process.env["NEXT_PUBLIC_APP_URL"];
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Fall through to the request's own headers.
    }
  }
  const headers = request.headers;
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const fallback = new URL(request.url);
  if (!host) return fallback.origin;
  const proto =
    headers.get("x-forwarded-proto") ?? fallback.protocol.replace(":", "");
  return `${proto.split(",")[0].trim()}://${host.split(",")[0].trim()}`;
}
