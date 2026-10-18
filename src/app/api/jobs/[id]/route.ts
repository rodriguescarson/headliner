import { jobStore } from "@/lib/jobs/store";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/jobs/[id]">,
) {
  const { id } = await ctx.params;
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(id))
    return Response.json({ ok: false, error: "Bad id." }, { status: 400 });
  const job = await jobStore().get(id);
  if (!job)
    return Response.json({ ok: false, error: "No such job." }, { status: 404 });
  return Response.json(job, { headers: { "Cache-Control": "no-store" } });
}
