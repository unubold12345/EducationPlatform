import { gradePractice } from "@/modules/practice/grading";

export async function POST(request: Request) {
  // Public, stateless demonstration: no accounts, persistence, or paid access.
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "JSON хүсэлт илгээнэ үү." }, { status: 415 });
  }
  let input: unknown;
  try { input = await request.json(); }
  catch { return Response.json({ error: "Хүсэлтийн бүтэц буруу байна." }, { status: 400 }); }
  const result = gradePractice(input);
  if (!result) return Response.json({ error: "Бүх бодлогын хариуг зөв хэлбэрээр сонгоно уу." }, { status: 400 });
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}

