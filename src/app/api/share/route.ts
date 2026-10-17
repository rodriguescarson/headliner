import { jobStore } from "@/lib/jobs/store";
import { guardJson, log } from "@/lib/security/guard";
import { checkStore, toShared } from "@/lib/storage";

/** Turn a finished check into a share link. The payload is copied from the job, never from the client. */
export async function POST(request: Request) {
  const guard = await guardJson(request, {
    scope: "share",
    limit: 20,
    windowMs: 60_000,
  });
  if (!guard.ok) return guard.response;
  const b = guard.body as { jobId?: unknown };
  const jobId = typeof b.jobId === "string" ? b.jobId : "";
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(jobId))
    return Response.json({ ok: false, error: "Bad job id." }, { status: 400 });
  const job = await jobStore().get(jobId);
  if (!job || job.status !== "done" || !job.result)
    return Response.json(
      { ok: false, error: "That check is not finished." },
      { status: 404 },
    );
  const shared = toShared(job.result);
  if (!shared)
    return Response.json(
      { ok: false, error: "Only a completed verdict can be shared." },
      { status: 422 },
    );
  try {
    const saved = await checkStore().put(shared);
    const base = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    return Response.json(
      { ok: true, id: saved.id, url: `${base}/s/${saved.id}` },
      { status: 201 },
    );
  } catch (e) {
    log("error", "share_failed", {
      message: e instanceof Error ? e.message : "unknown",
    });
    return Response.json(
      { ok: false, error: "Could not save the share link." },
      { status: 500 },
    );
  }
}
