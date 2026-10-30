import { databaseLatency } from "@/modules/admin/service";

export const dynamic = "force-dynamic";

// Public uptime check for an external monitor: reports only whether the app reaches the database
// and how long that took. No counts, versions or configuration are exposed.
export async function GET() {
  try {
    return Response.json({ ok: true, database: "ok", databaseMs: await databaseLatency() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, database: "down" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
