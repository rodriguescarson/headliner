import { NextResponse } from "next/server";
import { publicOrigin } from "@/lib/security/public-origin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host)
    return new NextResponse(null, { status: 403 });
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", publicOrigin(request)), {
    status: 303,
  });
}
